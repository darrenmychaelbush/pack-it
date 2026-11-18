# Pack It!

Pack It! is a travel puzzle game for the browser. Players arrange differently shaped items inside a suitcase, complete destination-based levels, and collect passport stamps.

Created as a personal project exploring game design, touch interaction, and development with generative AI.

## My role and development process

I developed this project through prompting in Lovable, which generated the implementation. My work focused on the game concept, gameplay requirements, interface direction, play-testing, and directing revisions. This became a great learning tool to further my understanding in game development. 

For example, while initially testing the first two puzzle levels, Nashville and Miami, I identified issues with item sizing, boot alignment, scrolling, and touch usability. I used those observations to request changes and then checked the resulting gameplay, and was also able to see how the code changed, helping speed up my learning curve. 

The repository provides the generated source code for review alongside that development process.

## Gameplay

- Drag items from the tray into the suitcase.
- Select an item and use the rotate control to change its orientation.
- Fit every item within the available space while avoiding overlaps and blocked cells.
- Use hints when needed and aim to finish within the level’s target move count.
- Earn stars and destination passport stamps.
- In Forgot It! levels, rearrange packed items to make room for a missing item.
- Leave an unfinished puzzle and resume it in the same browser.

## Technology

- React and TypeScript
- TanStack Start and TanStack Router
- Tailwind CSS and Vite
- Vitest and React Testing Library
- Browser localStorage for saved puzzles and progress

## Run locally

Install Node.js and npm, then clone the repository using an account with access.

```sh
git clone https://github.com/darrenmychaelbush/pack-it.git
cd pack-it
npm install
npm run dev
```

Open the local address printed in the terminal.

## Project structure

| File | Purpose |
| --- | --- |
| `src/components/game/PackingGame.tsx` | Game interface, pointer interactions, and play flow |
| `src/game/engine.ts` | Item rotation, placement checks, completion, and scoring |
| `src/game/levels.ts` | Destination levels, item layouts, and starting positions |
| `src/game/solver.ts` | Puzzle solution validation |
| `src/game/rearrange.ts` | Rearrangement checks for Forgot It! puzzles |
| `src/game/progress.ts` | Saved puzzles, level progress, and passport stamps |
| `src/test/levels.test.ts` | Tests for level definitions, rearrangement requirements, and item sizes |

For a code walkthrough, start with `canPlaceItem` in the game engine, then follow how `PackingGame` uses it to validate a move.

## Development checks

The following commands are available in the project.

```sh
npm test
npm run lint
npm run build
```

The level tests check puzzle solution constraints, Forgot It! rearrangement requirements, and relative item footprints.

## Current scope

Pack It! is a personal game prototype. Progress is stored locally in the browser, so it is specific to that browser and device and can be removed by clearing site data.

## Creator

Darren Bush  
[Portfolio](https://dmbush.com/) 
