import { reactive } from 'vue';
import type { ItemID } from '../items/id.ts';
import type { BuildingID } from '../../game/city/buildings/common/Building.ts';
import transactionService from '../inventory/transaction.service.ts';
import {
    isObjectiveFulfilled,
    isObjectiveObtainable,
    objectiveConcerns,
    objectiveDelivery,
} from './objectives.ts';
import {
    QuestNotClaimableError,
    QuestNotFoundError,
    QuestNotFulfillableError,
    QuestStatus,
    type ClaimantID,
    type Objective,
    type Quest,
    type QuestClaimant,
    type QuestID,
    type Wallet,
} from './common.ts';

let global_id = 1;

/**
 * The public quest board.
 *
 * A plain service, not building state — the `AdventurersGuild` is a thin shell
 * over it, the same relationship `Market` already has with `marketService`.
 * Buildings post and adventurers claim by calling this directly, so neither
 * needs a building lookup and the whole board runs headless, without a `City`.
 * See ADR 0002.
 */
class QuestService {
    private readonly quests: Quest[] = [];

    /**
     * Put a funded quest on the board. The reward is debited from `wallet`
     * **now** (ADR 0003), so a quest anyone can see is a quest that is
     * definitely paid for.
     *
     * Returns `null` — never throws — when the quest cannot be posted. This is
     * called from `Building.reviewQuests()`, which runs inside the tick loop
     * where nothing catches: a throw here would kill the simulation. Both
     * refusals are legible in-game rather than exceptional:
     *
     * - the poster cannot afford the reward, so the board goes quiet and the
     *   silence is the signal that a building is in trouble;
     * - the objective is unobtainable anywhere as the world is authored, so no
     *   quest nobody could fulfil ever reaches the board.
     */
    public post(
        poster: BuildingID,
        wallet: Wallet,
        objective: Objective,
        reward: number,
    ): Quest | null {
        if (!isObjectiveObtainable(objective)) {
            console.warn(
                `[QuestService] '${poster}' tried to post an unobtainable objective: ` +
                `${JSON.stringify(objective)} — nothing in the world can supply it.`
            );
            return null;
        }

        if (wallet.get() < reward) {
            return null;
        }

        wallet.add(-reward);

        const quest: Quest = {
            id: `quest:${global_id++}`,
            poster,
            claimant: null,
            objective,
            reward,
            status: QuestStatus.Open,
        };

        this.quests.push(quest);

        console.debug(`[QuestService] ${poster} posted ${quest.id} for ${reward}g`);

        return quest;
    }

    /** Take sole ownership of an open quest. A quest admits one claimant. */
    public claim(questId: QuestID, claimant: ClaimantID): Quest {
        const quest = this.require(questId);

        if (quest.status !== QuestStatus.Open) {
            throw new QuestNotClaimableError(questId, quest.status);
        }

        quest.claimant = claimant;
        quest.status = QuestStatus.Claimed;

        return quest;
    }

    /**
     * Settle a claimed quest: check the objective against the claimant's state,
     * move the goods from the claimant to the poster, pay the escrowed reward
     * out, and close the quest. Terminal — a fulfilled quest never moves again.
     *
     * The goods move **here**, not alongside a call to here. Settling used to be
     * money only, which let a claimant settle repeatedly against one held stack:
     * a poster paid out forever and never restocked. Delivery and payment are
     * the same event, so they are the same method — a caller cannot do half of
     * it. What moves is the objective's business (`objectiveDelivery`), not the
     * board's; a kind that hands over nothing simply transfers nothing.
     *
     * Order matters. The transfer runs before the status flips, so a claimant
     * who cannot actually produce the goods throws with the quest still Claimed
     * rather than leaving it half-settled.
     */
    public fulfil(questId: QuestID, claimant: QuestClaimant, wallet: Wallet): Quest {
        const quest = this.require(questId);

        if (quest.status !== QuestStatus.Claimed) {
            throw new QuestNotFulfillableError(questId, `it is ${quest.status}, not ${QuestStatus.Claimed}`);
        }

        if (quest.claimant !== claimant.id) {
            throw new QuestNotFulfillableError(
                questId,
                `it is claimed by '${quest.claimant}', not '${claimant.id}'`,
            );
        }

        if (!isObjectiveFulfilled(quest.objective, claimant)) {
            throw new QuestNotFulfillableError(questId, `the objective is not satisfied`);
        }

        this.deliver(claimant, quest);

        quest.status = QuestStatus.Fulfilled;
        wallet.add(quest.reward);

        console.debug(`[QuestService] ${claimant.id} fulfilled ${quest.id} for ${quest.reward}g`);

        return quest;
    }

    /** The whole board, in posting order. */
    public getAll(): readonly Quest[] {
        return this.quests;
    }

    /** Quests still waiting for someone to claim them. */
    public getOpen(): Quest[] {
        return this.quests.filter((q) => q.status === QuestStatus.Open);
    }

    public getByPoster(poster: BuildingID): Quest[] {
        return this.quests.filter((q) => q.poster === poster);
    }

    /**
     * Quests still in flight (Open or Claimed) that concern `item`, optionally
     * narrowed to one poster. This is how a building answers "am I already
     * waiting on this?" — without it, a poster whose stock is low re-posts an
     * identical quest every single tick.
     */
    public getOutstandingFor(item: ItemID, poster?: BuildingID): Quest[] {
        return this.quests.filter(
            (q) =>
                q.status !== QuestStatus.Fulfilled &&
                (poster === undefined || q.poster === poster) &&
                objectiveConcerns(q.objective, item),
        );
    }

    /**
     * Hand the objective's goods from the claimant to the poster.
     *
     * Goes through the transaction service rather than a take-then-put pair so
     * the debit is validated and applied in one call and the credit in the next,
     * with nothing able to run in between — the same path every building action
     * already settles through.
     *
     * Input and output are separate `Map` instances on purpose. The transaction
     * store keeps whatever reference it is handed, so passing one map as both
     * ends makes two supposedly independent halves the same object — the exact
     * implicit coupling that has produced bugs in this codebase before.
     */
    private deliver(claimant: QuestClaimant, quest: Quest): void {
        const goods = objectiveDelivery(quest.objective);
        if (goods.size === 0) return;

        const transactionId = transactionService.createTransaction(
            claimant.id,
            quest.poster,
            { stacks: goods },
            { stacks: new Map(goods) },
        );

        transactionService.commitTransaction(transactionId);
    }

    private require(questId: QuestID): Quest {
        const quest = this.quests.find((q) => q.id === questId);
        if (!quest) {
            throw new QuestNotFoundError(questId);
        }

        return quest;
    }
}

// Reactive singleton, matching `marketService`: engine writes (a quest pushed
// onto the board, a status transition) flow through the Vue proxy so the board
// panel re-renders instead of staying frozen.
export default reactive(new QuestService()) as QuestService;
