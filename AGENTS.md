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
- Levels are authored as ASCII grids in `src/game/levels.ts` (letters = items, `#` = blocked); shapes and solutions are derived from the grid so every level is guaranteed solvable.
- Forgot It! starting grids must be machine-checked so the missing item cannot fit before rearranging.
- Progress goes through the `ProgressStore` interface in `src/game/progress.ts` (localStorage today) so a cloud store can replace it without touching gameplay.
- Dragging uses Pointer Events with window listeners and transform-positioned floating items, never native HTML drag-and-drop — required for smooth touch play.
