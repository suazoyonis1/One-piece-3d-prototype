# One Piece: Grand Line — V6 Environment Asset Pass

V6 builds on the V5 project. It does not replace the existing gameplay or procedural world.

## Included in this pass
- Added an optional asynchronous environment-asset loader. It runs after the V5 world is created, so the playable procedural environment remains available while external models load.
- Added 20 grass/reed patches around the Mount Colubo wilderness and trail region.
- Added eight scaled rock formations around the Dawn Island coastline and mountain perimeter.
- Added one scaled forest-grove display from the Low Poly Forest Tree Pack.
- Added all supplied model files and their original license files under `assets/external/`.
- Added one animated offshore breaking-wave accent using the supplied ocean-wave GLTF morph animation. The existing procedural ocean remains the primary water surface.
- Kept the freshwater grouper asset in the project, but did not place it in open water because the current ocean has no underwater rendering/view.
- Kept external asset loading optional: a failed model request logs a warning and leaves the procedural environment in place.

## Asset credits and licenses

- Grass — Georgeous. Sketchfab Standard License. Source: https://sketchfab.com/3d-models/grass-674d42354f6348a7a85fc06a7f004db5
- Rock Game Assets — Ribfan Hariyanto. CC BY 4.0. Source: https://sketchfab.com/3d-models/rock-game-assets-4938bf45561447efa2c7048d51ff0fbc
- Low Poly Forest Tree Pack — 99.Miles. CC BY 4.0. Source: https://sketchfab.com/3d-models/low-poly-forest-tree-pack-5ff5a51e74324845a4e4905f182dfb2b
- lowpoly freshwater grouper — Arrangemonk. CC BY 4.0. Source: https://sketchfab.com/3d-models/lowpoly-freshwater-grouper-8c72d720bbe84be2ab5e20adc1480aae
- ocean wave — Andrea Marziano. CC BY 4.0. Source: https://sketchfab.com/3d-models/ocean-wave-f86f444dc7cc4458a0140f05a03c5896

The original `license.txt` files are retained alongside each asset. The CC BY 4.0 assets require attribution; their exact creator-provided attribution text is preserved in those files. The Grass asset's Sketchfab Standard terms are also retained with the asset.

## Validation status
- JavaScript syntax checks: passed for `world.js`, `environment-assets.js`, and `main.js`.
- glTF JSON and referenced buffer/texture checks: passed for all four supplied model archives.
- Browser/WebGL playtest: not completed in this environment. A headless Chromium launch failed to initialize its graphics backend, so visual appearance, scale, and runtime rendering still need confirmation in a normal browser/device.

## Additional animated ocean breaker — V6 follow-up

- **Ocean Wave - w/Maya** by Twin Dragon Studios
- Source: https://sketchfab.com/3d-models/ocean-wave-wmaya-03f0559f6b7646ea9014e2e72f71b198
- License: CC BY 4.0
- Attribution: This work is based on "Ocean Wave - w/Maya" (https://sketchfab.com/3d-models/ocean-wave-wmaya-03f0559f6b7646ea9014e2e72f71b198) by Twin Dragon Studios (https://sketchfab.com/RHALL) licensed under CC-BY-4.0 (http://creativecommons.org/licenses/by/4.0/).

The model is loaded as one offshore animated breaker. Its GLTF animation is advanced by the existing world update loop. The procedural ocean and the earlier ocean-wave asset remain in place as complementary effects.

## Mountain-forest landscape set piece — V6 follow-up

- **The landscape is a forest in the mountains** by dasy444
- Source: https://sketchfab.com/3d-models/the-landscape-is-a-forest-in-the-mountains-27b7e06431f244ef84e28bada7560c98
- License: Sketchfab Standard License (see the asset's preserved `license.txt`)
- The source asset is retained in `assets/external/forest-mountain-landscape/` with its original textures and license file.

The scene is loaded as one distant scenic set piece near Dawn Island's wilderness edge. It is not added to the collision system; existing island ground, paths, movement, and gameplay remain authoritative.

## PSX Houses architectural cluster — V6 follow-up

- **PSX Houses** by domi236
- Source: https://sketchfab.com/3d-models/psx-houses-c535b11378194028b5410e4e60afdad5
- License: Sketchfab Standard License (see the preserved `assets/external/psx-houses/license.txt`)
- Includes intact and damaged low-poly house elements with their source textures.

The model is placed as one architectural set piece on Shells Town. It is visual scenery only and does not replace the island terrain, collision setup, NPCs, quests, or existing buildings.
