# Historical V2 Notes

This document describes the earlier V2 visual pass. For the latest changes and validation, see `README-VISUAL-OVERHAUL-V3.md`.

# Grand Line Visual & World Polish

This build continues the visual-only overhaul while retaining the existing story and core controls.

## Main improvements
- Rebuilt the procedural NPC fallback with human proportions, articulated arms and legs, layered clothing, facial features, hair, belts, cuffs, and role-specific hats/accessories.
- Added eight ambient residents across Foosha Village and Loguetown. They follow small patrol routes, pause, and look around; they are not quest-critical characters.
- Reworked the ocean with a generated wave-detail bump texture, animated multi-directional waves, clearer coastal color, and better surface response.
- Added a moving sun, moon, and a field of stars that fade in during the night cycle.
- Replaced simple cloud clusters with larger layered cloud banks that drift across the sky.
- Added three drifting merchant/sailor vessels with crew silhouettes.
- Rebuilt the minimap rendering with depth contours, a navigation grid, island shorelines, points of interest, quest markers, enemy/NPC markers, and a facing-direction player arrow.
- Added the Gashing Impact attack on **T** with stamina cost, cooldown, damage, and a short impact effect. Existing Q/E attacks and R crew assist remain available.
- Rebuilt Foosha and Loguetown building shells with separate wall sections and usable doorway gaps. Player movement now resolves against the building wall bounds; doors are shown ajar.
- Added varied Loguetown facades including stone, pale limestone, and brick tones, plus surface bump detail on island ground.
- Refined the HUD, health/stamina/XP presentation, minimap frame, quest panel, and ability cards.

## Controls
- WASD: move / steer
- Shift: sprint
- C: dodge
- Q: Gomu Gomu no Pistol
- E: Gomu Gomu no Gatling
- T: Gashing Impact
- R: crew assist
- Click: melee combo
- F: interact / board / disembark
- F6 / F9: save / load

## Validation notes
- All JavaScript files pass Node syntax checks.
- A full interactive WebGL browser playtest could not be completed in this environment. Please test the build in the target browser, especially the new wall/door collisions, NPC animation silhouettes, and T attack effect.
- The NPC models are still procedural fallback characters, not newly authored high-poly scanned or rigged character assets. This pass makes them substantially more human-shaped and detailed, but a further asset/animation pass would be needed to reach AAA character fidelity.
