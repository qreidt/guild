# Issue tracker: Linear

Issues, tickets, and PRDs for this repo live in **Linear**, in the project **Guild Game**
under the team **CQR**. Access is through the Linear MCP connector (`mcp__claude_ai_Linear__*`).
GitHub Issues is **not** used — GitHub (`qreidt/guild`) holds only code, branches, and PRs.

| Thing            | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| Team             | `CQR` (the only team in the workspace)                     |
| Issue key prefix | `CQR-<n>` — e.g. `CQR-59`                                  |
| Project          | `Guild Game`                                               |
| Project URL      | https://linear.app/cqr/project/guild-game-3fea51450abb     |

Always scope new issues to **both** `team: "CQR"` and `project: "Guild Game"`. An issue
created without the project lands loose in the team backlog and falls out of the game's
board.

## Conventions

- **Create an issue**: `save_issue` with `title`, `team: "CQR"`, `project: "Guild Game"`,
  and `description` as Markdown. Omit `id` — passing it means "update".
- **Read an issue**: `get_issue` with the identifier (`CQR-59`). Pass
  `includeRelations: true` when blocking/related edges matter. Comments come from
  `list_comments` with `issueId` — `get_issue` does not include them.
- **List issues**: `list_issues` with `project: "Guild Game"`, plus `state`, `label`, or
  `assignee` filters. Ask for the fields you need via `fields`, e.g.
  `["title", "description", "status", "labels", "url"]`.
- **Comment**: `save_comment` with `issueId` and `body`. Reply into a thread with
  `parentId` instead of opening a new top-level thread.
- **Change state**: `save_issue` with `id` and `state` (state name, e.g. `"Todo"`).
- **Close**: set `state` to `Done` (finished), `Canceled` (won't do), or `Duplicate` —
  leave a `save_comment` explaining why before closing.
- **Update a long description**: prefer `patch` over resending the whole `description`.
  Each anchor must match exactly once.

Send real newlines and real special characters in `description` / `body`. Do not escape
them as `\n` — the connector takes the string literally.

## Labels: read before you write

`save_issue`'s `labels` parameter **replaces the entire label set**. Any label you omit is
removed. Before adding a triage label, read the issue's current labels and send the union:

1. `get_issue` (or `list_issues` with `fields: ["labels"]`) to read the current set
2. `save_issue` with `labels: [...existing, "ready-for-agent"]`

Omitting `labels` entirely leaves them untouched — do that whenever you're changing
something else.

The workspace already uses `Bug`, `Feature`, and `Improvement` as **issue-type** labels.
They are orthogonal to the triage vocabulary in `triage-labels.md` and must survive any
triage write.

## When a skill says "publish to the issue tracker"

Create a Linear issue on team `CQR` in project `Guild Game`.

## When a skill says "fetch the relevant ticket"

`get_issue` on the `CQR-<n>` identifier, then `list_comments` for the discussion.

## Specs stay on disk

`.specs/` in this repo is the canonical home for specs (see `CLAUDE.md`). Active work sits
under `.specs/.cycles/<cycle-id>/`, where `<cycle-id>` is derived from the Linear
identifier — e.g. `CQR-59` → `.specs/.cycles/cqr-59-apothecary-herbs-and-potions/`.

A Linear issue should **link** to its cycle folder rather than duplicate the spec body.
Keep the issue focused on the request, acceptance criteria, and discussion; keep
requirements, plan, and tasks in the repo where they are reviewed with the code.

Linear **documents** under the Guild Game project mirror spec content for MCP access
(`list_documents` / `get_document` / `save_document`). When specs change materially,
update both the `.specs/` files and the mirrored Linear documents.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: an issue on `CQR` / `Guild Game` labelled `wayfinder:map`, holding the
  Notes / Decisions-so-far / Fog body.
- **Child ticket**: `save_issue` with `parentId` set to the map's identifier — Linear
  sub-issues are native, so no task-list fallback is needed. Label it
  `wayfinder:<type>` (`research` / `prototype` / `grilling` / `task`).
- **Blocking**: `save_issue` with `blockedBy: ["CQR-12"]` / `blocks: [...]` — these are
  append-only; use `removeBlockedBy` / `removeBlocks` to clear an edge. Read edges back
  with `get_issue` and `includeRelations: true`. A ticket is unblocked when every blocker
  sits in a `completed` or `canceled` state.
- **Frontier query**: `list_issues` with `parentId: <map>` and an open state, drop any
  with an unresolved blocker or an assignee; first in map order wins.
- **Claim**: `save_issue` with `id` and `assignee: "me"` — the session's first write.
- **Resolve**: `save_comment` with the answer, set `state` to `Done`, then append a
  context pointer to the map's Decisions-so-far via a `patch` on the map issue.
