# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to
what they actually look like in Linear (see `issue-tracker.md`).

Linear carries two axes, and triage uses both: a **label** records the role, and a
**workflow state** keeps the board honest about whether the issue is actionable.

| Label in mattpocock/skills | Label in our tracker | Linear state | Meaning                                  |
| -------------------------- | -------------------- | ------------ | ---------------------------------------- |
| `needs-triage`             | `needs-triage`       | `Backlog`    | Maintainer needs to evaluate this issue  |
| `needs-info`               | `needs-info`         | `Backlog`    | Waiting on reporter for more information |
| `ready-for-agent`          | `ready-for-agent`    | `Todo`       | Fully specified, ready for an AFK agent  |
| `ready-for-human`          | `ready-for-human`    | `Todo`       | Requires human implementation            |
| `wontfix`                  | `wontfix`            | `Canceled`   | Will not be actioned                     |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), apply the label
string **and** move the issue to the paired state. The label is the source of truth that
skills read back; the state is what makes the Linear board legible to a human.

## Rules

- **The five roles are mutually exclusive.** Applying one means removing any other four
  that are present.
- **Preserve the type labels.** `Bug`, `Feature`, and `Improvement` classify *what* an
  issue is and are orthogonal to triage. They must survive every triage write.
- **`save_issue` replaces the whole label set.** Read the current labels first and send
  the union minus the triage labels you're displacing. See "Labels: read before you write"
  in `issue-tracker.md`.
- **A new issue with no triage label** is untriaged and belongs to the `needs-triage`
  queue, whether or not the label has been applied yet.
- **Triaged out.** `wontfix` pairs with the `Canceled` state, not `Done` — `Done` means
  the work happened.

## Creating the labels

None of the five exist in the CQR team yet; they are created on first use with
`create_issue_label` (`teamId` = the CQR team, or omit it for a workspace-wide label).
Create a label only when a triage decision actually needs it — don't pre-seed all five.

Edit the table above if you later rename any of these in Linear.
