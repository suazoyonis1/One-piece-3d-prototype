# One Piece: Dawn Island — Double Upgrade

This build continues from the Living World & Combat Upgrade and keeps the existing Dawn Island / East Blue chapter content.

## New systems

- Player progression: XP, levels, increasing HP and stamina caps, and level-scaled melee / Gomu damage.
- Quest rewards: completing story objectives awards Berries and XP.
- Crew companions: recruited Zoro and Sanji follow Luffy around the world.
- Save / load: F6 saves and F9 loads a browser-local adventure snapshot, including player stats, quest progress, recruited crew, treasure caches, supply crates, enemy states, and ship position / sailing state.
- Exploration minimap: player-centered map with islands, quest waypoint, NPCs, enemies, and unopened treasure caches. The island label updates with the player's location.
- Day / night cycle: a gradual four-minute lighting, sky, and fog cycle.

## Controls added

- F6 — Save adventure in this browser
- F9 — Load saved adventure in this browser

The save is stored in this browser's local storage. It does not sync between devices or browsers.

## Validation

All project JavaScript files were checked with `node --check`; ZIP integrity was checked after packaging. The game has not been verified in a live browser session, so please test the new systems locally before publishing to GitHub Pages.
