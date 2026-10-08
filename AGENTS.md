<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules

- Game logic lives as pure functions in `src/game/engine.ts`; UI components only call them — keeps the engine testable and reusable.
- Levels are authored as ASCII grids in `src/game/levels.ts` (letters = items, `#` = blocked, `.` = empty); every level must pass `validateLevelDefinition` (1 ≤ solver solutions ≤ maxSolutions), enforced by `src/test/levels.test.ts` — keeps puzzles tight instead of free-placement.
- The puzzle solver lives in `src/game/solver.ts` (exact cover with holes, MRV branching); new level grids are found offline by searching for tilings the solver rates unique.
- Forgot It! starting grids must be machine-checked so the missing item cannot fit before rearranging.
- Progress goes through the `ProgressStore` interface in `src/game/progress.ts` (localStorage today) so a cloud store can replace it without touching gameplay.
- Dragging uses Pointer Events with window listeners and transform-positioned floating items, never native HTML drag-and-drop — required for smooth touch play.
- `noUncheckedIndexedAccess` is off: the engine indexes dense grid/shape matrices whose bounds are checked explicitly.
- Realistic packed footprints and item artwork live in `src/game/sizes.ts`; size-checked levels must use those footprints (tested) — keeps relative item sizes believable.
- Unfinished puzzles are saved through `ProgressStore` puzzle methods, separate from completed progress, and cleared on completion — lets players exit and resume safely.
- Forgot It! difficulty is measured by `src/game/rearrange.ts`, whose moves relocate packed items without removing them — keeps rearrangement constraints testable.
- Destination advances use `LevelTransition` and a keyless Natural Earth atlas; coordinates and great-circle projection live in browser-safe game modules, with geography warmed during gameplay — keeps camera, transport, and future world progression reusable without changing packing or depending on API keys.
