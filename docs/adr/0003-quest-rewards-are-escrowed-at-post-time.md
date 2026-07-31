# Quest rewards are escrowed when the quest is posted

Posting a quest debits the poster's `money` immediately; the quest carries the
funded reward and pays the adventurer on fulfilment. A posted quest is therefore
always a funded quest.

We chose this because `QuestStatus` has exactly three states — `Open`, `Claimed`,
`Fulfilled` — with no failure state. Paying at fulfilment instead would reopen the
branch that enum deliberately closes: a poster can afford two quests individually
but not both together, and an adventurer could finish the work only to find the
wallet empty. Escrow costs one debit and deletes the entire question of who eats
that loss.

## Consequences

- Money now exists in three places — buildings, adventurers, and **open quests**.
  Total city gold is no longer the sum of building wallets; any economy readout
  must count escrowed gold.
- A broke building simply cannot post, so the board goes quiet rather than
  breaking. This is legible ("nobody's hiring") and is the intended signal that a
  building needs a revenue line.
- Because there is no `Abandoned` or `Failed` state, escrowed money never needs
  returning. Adding either state later means also deciding who gets the deposit.
