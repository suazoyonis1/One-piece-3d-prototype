# One Piece 3D Prototype — Dawn Island Story Update

This update builds on the existing Three.js project and keeps its movement, combat, sailing, UI, and world systems.

## Story progression
1. Meet Red-Haired Shanks in Foosha Village.
2. Speak with Mayor Woop Slap and collect three village supply crates.
3. Find Garp, then Curly Dadan at Mount Colubo.
4. Defeat the Gray Terminal bandits.
5. Meet Ace and Sabo.
6. Set sail (the story marks the ten-year transition).
7. Continue into Shells Town, recruit Zoro, and visit Baratie.

## Technical notes
- The Luffy GLTF path now matches the uploaded project's `model/Luffy/` directory.
- GLTF texture URLs are remapped by the existing loader from `textures/` to the project's `texture/` directory.
- JavaScript files were checked with Node's syntax checker. This is not a substitute for testing in a browser; the live browser build should still be checked after deployment.

## Latest upgrade: living NPCs and enemy behavior

- The Foosha mayor now follows a short village patrol route and pauses when Luffy approaches.
- NPCs use their available idle/walk procedural animation while standing or moving.
- Enemies patrol near their spawn points, detect Luffy within an alert radius, chase him, and return toward their home area if he escapes.
- Enemy attacks now have a short wind-up and recovery window, making attacks easier to read and dodge.
- Procedural character rigs now animate a simple attack pose for wind-up states.
- Defeated enemies award Berries once: standard enemies award 100 by default and bosses award 1,000.

Existing story progression, treasure caches, ship controls, and player abilities are retained.
