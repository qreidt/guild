# Guild

The game is about **adventurers interacting with the city** — that is the subject,
and the reason the project is named Guild. The city simulation (buildings, workers,
goods, market) exists to give adventurers something to interact with.

One context — everything in `src/` shares this language.

## Language

### Work

**Quest**:
A unit of work a building posts publicly for an adventurer to claim and fulfil in
exchange for a reward. Authored by one party, carried out by another.
_Avoid_: Task, Mission, Request, Contract, Commission, Job

**Objective**:
The condition that decides whether a quest is fulfilled — what must be true of the
world for it to count as done.
_Avoid_: Goal, requirement, win condition

**Post**:
To put a quest on the board. Only a building posts.
_Avoid_: Create, publish, issue, list

**Claim**:
To take sole ownership of an open quest. Only an adventurer claims, and a quest
admits one claimant.
_Avoid_: Accept, take, assign, pick up

**Fulfil**:
To satisfy a claimed quest's objective and settle it — the terminal event in a
quest's life.
_Avoid_: Complete, finish, close, resolve

**Reward**:
What the poster gives up for a quest to be fulfilled. Committed when the quest is
posted, not when it is fulfilled — so a posted quest is always a funded one.
_Avoid_: Payment, fee, bounty, payout

**Gather**:
An objective satisfied by holding a quantity of an item. Says what must be true at
the end, never how it was achieved.
_Avoid_: Fetch, retrieve, supply

**Forage**:
The act of searching a location, with an uncertain outcome — one way of satisfying
a gather objective. How hard something is to forage is a property of looking
*here* for *this*, not of the item itself.
_Avoid_: Harvest, pick, farm, grind

**Deliver**:
To hand a satisfied objective's goods to the poster. Inseparable from fulfilling:
the goods and the reward change hands in the same event, so neither happens
without the other.
_Avoid_: Hand in, turn in, submit, drop off

**Travel**:
To move from one location to another, taking time. A cost read from a table, never
measured off the 3D map.
_Avoid_: Walk, move, go, journey

**Action**:
A unit of work a worker performs *inside* its own building, over a number of ticks.
Internal to one building; never posted, never claimed.
_Avoid_: Task, job

### People

**Worker**:
Anonymous labour belonging to a building. Has no identity, no skills, and no
existence outside the building that owns it; performs actions.
_Avoid_: Employee, staff, citizen

**Adventurer**:
A named, persistent individual with rank, class, attributes, proficiencies, money,
and an inventory. Belongs to no building; chooses their own work.
_Avoid_: Hero, mercenary, unit

### Places

**Building**:
A structure in the city that owns an inventory and money, and may own workers.
_Avoid_: Facility, site, plot

**Adventurers' Guild**:
The building where quests are posted and adventurers are registered. Owns neither
the quests nor the adventurers — it is where they meet.
_Avoid_: Guild (ambiguous with the game itself), guild hall, lodge

**Location**:
A named place someone can be, and travel between. Says nothing about danger or
what lives there. The town is a location.
_Avoid_: Place, area, region, map

**Zone**:
_Reserved, not yet modelled._ A dangerous area with inhabitants and encounters.
Every zone is a location; not every location is a zone — the town never will be.
