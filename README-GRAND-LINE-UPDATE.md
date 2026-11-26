# One Piece: East Blue + Grand Line Update

This build continues the existing Dawn Island / East Blue prototype.

## Fixes in this update
- Expanded the Dawn Island shoreline so Mount Colubo, Gray Terminal, and Goa Kingdom sit on connected land.
- Added polygon-based Dawn Island ground checks so the player cannot walk across the ocean just because they are inside a large circular island radius.
- Corrected Luffy's GLTF bone-name lookups to match the actual skeleton names in `model/Luffy/scene.gltf`.
- Changed the leg gait to use a forward/back swing axis and lowered the shoulders from the T-pose.
- Reduced walking and sprint speeds for a more controlled gait.
- Moved the Going Merry to the southern Foosha pier and extended the pier toward the water.

## Grand Line content added
- Loguetown island with a central avenue, market stalls, residential blocks, Marine headquarters, and the execution platform.
- Smoker and Buggy NPC encounters.
- Buggy's four-enemy plaza ambush and boss battle.
- Marine patrol enemies; defeating Marines increases the wanted bounty.
- A crew-assist action on **R** after recruiting Zoro or Sanji.
- Reverse Mountain island with a large mountain silhouette and a visible current route.
- Quest progression from East Blue completion through Loguetown and Reverse Mountain.
- F6/F9 saves now retain the bounty and Buggy encounter state.

## Controls
- WASD / arrows: move or steer
- Shift: sprint
- Space: jump / continue dialogue
- Click: melee combo
- Q: Gomu Pistol
- E: Gomu Gatling
- C: dodge
- R: crew assist (after recruiting a crewmate)
- F: interact / board or leave the ship
- F6 / F9: save / load

## Run locally
Serve this folder from a local web server (do not open `index.html` as a `file://` URL), then open it in a modern browser with WebGL enabled.

## Notes
The Luffy model includes a blink animation only; the walking/action pose is driven by the corrected skeleton-bone procedural animation. The new Loguetown and Reverse Mountain environments are prototype-scale environments built from procedural geometry, not imported high-detail asset packs.
