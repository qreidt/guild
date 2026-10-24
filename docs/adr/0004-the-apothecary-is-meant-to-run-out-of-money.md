# The Apothecary is meant to run out of money

The Apothecary has no income. It brews potions and never sells them, and it now
also pays for gather quests, so its wallet only ever goes down. Its starting money
is raised to 1000 (every other building starts at 100) purely to give a long
enough runway to watch the quest loop run.

**Do not "fix" this by giving the Apothecary a `TransportAction` to sell potions
to the market.** That would install the wrong economy. The Apothecary's intended
revenue is **adventurers buying potions from it directly** — the game is about
adventurers interacting with the city, and potion sales are one of those
interactions. Adding a market sales line now would create a second, competing sink
that the real mechanic would then have to be reconciled against.

Going broke is an accepted temporary state. The correct fix is the feature that
has not been built yet.

---

## Amended by CQR-118, 2026-10-24

That feature was built. The Apothecary now makes seven everyday goods for
townsfolk — soap, cough syrup, tea, a bandage, a balm, a sleeping draught, an
ointment — and takes them to market as soon as they are made. It has income, and
over a 200-tick run at seed 1 its money rose from 1000 to 1071 while still paying
for every gather quest it posted.

**What changed:** the opening sentence. The Apothecary is no longer meant to run
out of money, and the 1000 starting purse is now a float rather than a runway.

**What stands, unchanged:** the prohibition this ADR exists for. **Do not give
the Apothecary a sales line for its potions.** Potion revenue is still meant to
be adventurers buying them here directly, and that mechanic is still unbuilt.
The everyday goods are a different product for a different customer, which is
why they do not create the competing sink this ADR warned about.

The distinction is enforced in code: `EVERYDAY_GOODS` in `Apothecary.ts` is an
explicit list of the seven, and the sell action reads only that list. A snapshot
of "everything stackable on the shelf" would breach this ADR silently, and is
the one change to that file most likely to do so by accident.
