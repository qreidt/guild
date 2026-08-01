# The quest board is a module service, and objectives are plain data

The quest board lives in `src/modules/quests/`, not on the `AdventurersGuild`
building. The guild is a thin `BaseBuilding` shell over it — the same relationship
`Market` already has with `marketService`. Buildings post and adventurers claim by
calling the service directly, so neither needs a building lookup.

The alternative — storing the board on the guild — would force every poster to
import `GameController` to find the building, deepening the import cycle that
`GameController.ts` carries a six-line warning about (it caused a blank page in
every production build). It would also make the quest system untestable without
booting a full `City`, whereas the service runs headless under `npm run console`.

## Objectives carry no behaviour

An `Objective` is a serializable discriminated union (`{ kind: 'gather', item,
quantity, location }`). The logic that turns an objective into the next `Action`
lives in a **resolver registry keyed by `kind`**, mirroring `ItemRegistry`.

This is deliberate and a reader's OO instinct will suggest otherwise. Methods on
objective classes would make quests non-inspectable data — the board UI and any
future save file would hold live objects. Keeping objectives inert means adding a
new objective kind (`hunt`, when combat arrives) is **one registry entry**: the
board, the claim flow, and the adventurer's loop are untouched.
