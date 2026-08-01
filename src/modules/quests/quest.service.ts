import { reactive } from 'vue';
import type { ItemID } from '../items/id.ts';
import type { BuildingID } from '../../game/city/buildings/common/Building.ts';
import { isObjectiveFulfilled, isObjectiveObtainable, objectiveConcerns } from './objectives.ts';
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
     * pay the escrowed reward out, and close the quest. Terminal — a fulfilled
     * quest never moves again.
     *
     * Settlement is money only. It does **not** move the claimant's goods to the
     * poster: a gather objective is "end up holding a quantity" (`CONTEXT.md`),
     * and handing the herbs over is *delivery* — the third verb in CQR-61's own
     * title, and Phase 2's to define. Nothing in Phase 1 calls `fulfil`, so the
     * asymmetry is unreachable in play; it is reachable from the console, where
     * settling repeatedly against one held stack lets a poster pay out forever
     * and never restock. Phase 2 closes it by transferring the goods here.
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
