# One Piece: Grand Line — Visual Overhaul V3

This is a substantial art-direction, environment, character, interface and world-interaction pass based on the V2 project.

## Character and NPC work
- Replaced the fallback's stacked primitive silhouette with tapered lathed anatomy, articulated capsule limbs, shaped face profiles, layered clothing, tailored lapels, waist sashes, leather straps, cuffs, boots, hair and role-specific headwear.
- Added distinct period-inspired outfits for fishermen, cooks, merchants, travelers, nobles, swordsmen, carpenters, doctors, sailors, pirates and Marines.
- Added period-style matchlock/arquebus props for Marine and guard characters, and cutlass/sheath details for pirate and sailor roles.
- Merged static character geometry by material while keeping articulated limb pivots separate. This reduces the fallback character from roughly 55–65 individual mesh draws to about 24–27 while retaining walk, idle, attack and gesture animation.
- Added ambient residents with patrol routes and randomized idle gestures: waving, talking, stretching, inspecting, fishing, carrying, sweeping, pointing and lookout behavior.
- Added distance-based NPC and enemy visibility/update culling.

## World and atmosphere
- Added procedural woven cloth, wood-grain, brick, irregular stone and limestone textures, including bump detail for masonry.
- Improved the ocean with a textured color map, high-frequency wave bump map, multi-directional animated vertex waves, clearcoat and an equirectangular sky reflection environment.
- Added a camera-following atmospheric sky dome with day/night color gradients, a glowing sun, moonlight, stars and layered drifting cloud formations.
- Added animated seabirds, wind-swaying palm fronds and broadleaf crowns, grass tufts, small terrain mounds, rocks, bushes and animated shoreline foam.
- Rebuilt the player's Going Merry with a tapered V-hull, deck planking, railings, stern cabin, two curved canvas sails, rigging, Jolly Roger sail marks, sheep figurehead, anchor and cargo. Sails and pennant move with the wind.
- Rebuilt ambient sailing vessels with tapered hulls, decks, gunwales, benches, cargo, masts, curved sails, rigging, pennants and animated crew. Five vessels follow open-sea routes.
- Added market produce, fish racks, dock details and lanterns to make the villages feel inhabited.

## Buildings and world interaction
- Varied Foosha house materials across wood, stone, brick, limestone and plaster-like finishes, with a masonry foundation, gabled tiled roofs, timber framing, chimneys and doorway openings.
- Added wall durability. Pistol, Gatling and Gashing Impact damage nearby wall sections; destroyed sections become passable breaches.
- Added jump-through front window openings while preserving solid wall collision at ground level and usable doorways.
- Applied wall collision to ambient NPCs and enemies so their routes do not simply pass through house shells.

## Interface and combat
- Reworked the minimap as a rectangular sea chart with rotating player heading, island shorelines, depth contours, NPC/enemy/treasure markers and quest waypoints.
- Refined HP, stamina, berries, bounty, level/XP and ability card presentation.
- Added separate visual effects and attack poses for Gomu Gomu no Pistol, Gomu Gomu no Gatling and Gashing Impact.
- Preserved the existing movement, sailing, quest, save/load and crew systems.

## Validation
- All project JavaScript files pass `node --check`.
- Ran a Node/Three.js scene-construction smoke test with a Canvas implementation: the world built six islands, 42 NPCs, four enemies, five ambient vessels, 12 seabirds, 22 cloud banks and 21 building colliders; repeated world/NPC updates completed without runtime exceptions.
- Tested wall damage through two Gashing-strength hits and confirmed the resulting breach is passable. Tested the window opening's ground-level block and jump-through allowance.
- A full visual browser playtest remains outstanding: the available headless Chromium environment could not initialize its EGL/WebGL context. The project should still be tested in the target desktop browser for final visual tuning, frame rate and GLTF loading.

## Asset-quality note
The existing Luffy GLTF remains the player model; if its required limb/shoulder rig is incomplete, the game now keeps the animated fallback rather than swapping in a T-pose. The expanded NPC cast uses a much more detailed, material-batched procedural fallback; it is not a substitute for a library of authored high-poly, rigged human GLB characters. Reaching true AAA character fidelity will require compatible licensed character models, PBR texture sets and animation clips.
