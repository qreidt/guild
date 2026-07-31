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
