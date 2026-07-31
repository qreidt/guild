# `.cycles` — request intake

This is the **intake stage** of the spec pipeline. It holds the *input* to spec
generation, not specs themselves.

Pipeline:

1. A cycle of work starts here as a raw **`request.md`**.
2. The `refine-request` command critiques it, runs one round of questions, and
   writes a **`refined-brief.md`**.
3. The brief is handed off to **`spec-workflow-mcp`**, which generates the actual
   spec under `.spec-workflow/specs/{name}/` (Requirements → Design → Tasks).

So: `.specs/.cycles/` = raw request + refined brief · `.spec-workflow/specs/` =
generated spec · `.specs/*` = canonical current-state docs.

## Cycles

- [CQR-53](https://linear.app/cqr/issue/CQR-53/read-only-environment-interfaces-2d-vs-3d-bake-off-vertical-slice)
  — [cqr-53-read-only-environment-interfaces/](./cqr-53-read-only-environment-interfaces/)
  — read-only environment interfaces, 2D-vs-3D bake-off. **Status:** spec authored
  in-cycle (`requirements.md` + `plan.md` + `tasks.md`); ready to implement.
- [CQR-59](https://linear.app/cqr/issue/CQR-59)
  — [cqr-59-apothecary-herbs-and-potions/](./cqr-59-apothecary-herbs-and-potions/)
  — the Apothecary building: full foraged-herb catalog as items, health + mana potion
  brewing, and 2D/3D visual parity with the CQR-53 environments. **Status:**
  [`refined-brief.md`](./cqr-59-apothecary-herbs-and-potions/refined-brief.md) written;
  ready for spec-workflow. Delivered as **one combined spec**, phased
  A (city expansion) → B (Apothecary).
  - sub-feature [city-expansion/](./cqr-59-apothecary-herbs-and-potions/city-expansion/)
    — grow the walled town inland (the interior is full: 0 free plots) so the Apothecary
    can sit inside the walls. Folded into the combined brief as Phase A.
