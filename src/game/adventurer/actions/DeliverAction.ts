import { Action } from "../../city/buildings/common/Action.ts";
import questService from "../../../modules/quests/quest.service.ts";
import type { QuestID } from "../../../modules/quests/common.ts";
// Type-only on purpose — see the note in `TravelAction.ts`.
import type { Adventurer } from "../Adventurer.ts";

/** Handing goods over a counter and being paid for them. */
const DELIVER_TICKS = 1;

/**
 * Settling a claimed quest with the building that posted it.
 *
 * Note what this action does **not** declare: no `input`, no `input_origin`, no
 * `output`. A reader will expect them — goods are moving. They are absent
 * because the move happens inside `questService.fulfil()`, together with the
 * reward, so that delivery and payment cannot come apart (ADR 0003). Declaring
 * the transfer here as well would run it twice.
 *
 * `fulfil` throws, and this runs inside the tick loop. Two things keep that
 * safe: the planner only asks for this step once the objective is satisfied, and
 * `Adventurer.handleTick()` catches anything that still gets through. The throw
 * is right for `fulfil` itself — a caller outside the loop wants to know.
 */
export class DeliverAction extends Action {
    static name = 'Deliver';

    public total_ticks = DELIVER_TICKS;

    constructor(
        private readonly adventurer: Adventurer,
        public readonly quest_id: QuestID,
    ) {
        super();
    }

    protected finished(): void {
        const quest = questService.fulfil(
            this.quest_id,
            this.adventurer.claimant,
            this.adventurer.wallet,
        );

        console.debug(
            `[${this.adventurer.name}] delivered ${quest.id} to ${quest.poster} ` +
            `and was paid ${quest.reward}g.`
        );
    }
}
