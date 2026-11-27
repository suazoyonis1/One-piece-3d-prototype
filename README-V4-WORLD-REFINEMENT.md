# One Piece: Grand Line — V4 World Refinement

V4 is a refinement pass on the supplied V3 source. It preserves the existing Three.js project structure and gameplay systems. Apex Legends is used only as a visual-quality reference for grounded environment presentation, material richness, water, rocks, lighting and overall scene readability; this is not an attempt to reproduce Apex assets or its world.

## V4 changes
- Introductory world branding and lower compass text now fade away after five seconds.
- Player movement has three selectable modes: Walk, Jog (default), and Sprint. Press `V` to cycle modes; hold `Shift` for a temporary sprint. Sprint consumes stamina.
- Added nearby door interaction with `F`; doors animate between open and closed states. Closed doorways now block player collision until opened.
- Increased house window openings proportionally to house size and resized their frames/panes to match.
- Added gable-end infill, a more substantial ridge cap and eave fascia to reduce visible roof gaps.
- Kept procedural foliage out of the central Dawn Island town/street region.
- Improved rock surface detail with a stone texture, bump detail and subtly irregular geometry.
- Retained the existing physically based ocean material, animated waves, environment reflections, ACES tone mapping and day/night lighting; adjusted the overall presentation grade slightly.

## Controls
- `WASD`: move / steer
- `V`: cycle Walk → Jog → Sprint
- `Shift`: temporary sprint
- `C`: dodge
- `Space`: jump
- `F`: interact / toggle nearby doors / board
- `Q`, `E`, `T`: combat abilities

## Validation performed
- `node --check` passed for every JavaScript file in `js/`.
- `index.html` passed Python's HTML parser.
- ZIP integrity checked after packaging.

## Not yet validated
- No full browser visual playtest or WebGL frame-rate test was completed in this environment. Roof alignment, door approach distances, collision feel, water appearance and performance should be checked in a desktop browser.
- This pass does not deploy to GitHub Pages.
