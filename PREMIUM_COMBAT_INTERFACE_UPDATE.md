# Global Punjabi Arena — Premium Combat & Interface Update

## What changed
- The two player power rails remain visible during selection, clash, result, and final states.
- Both sides retain five large numbered slots (1–5); the chosen move's icon and short name appear beneath the row after both players lock.
- The hidden-pick rule is preserved: Player 2 cannot see Player 1's selection before Player 2 locks, and vice versa.
- The battle stage has a stronger navy / blue / red / metallic-gold visual frame.
- Character pose strips and full-body selection portraits are enlarged 2× with high-quality resampling for cleaner display at the intended stage size.
- Character sprites are kept above the power canvas so the fighters remain visible during attacks.
- Power projectiles now originate closer to the fighter lanes and target the opposing fighter lane; the selected move's own elemental texture remains visible during the impact bloom.
- Hit markers are moved onto the opponent lanes instead of the arena centre.
- Canvas uses a desynchronized 2D context where supported and a reduced particle cap to lower render pressure.
- Added 12 power profiles (36 total) and mapped every profile to an existing elemental visual asset.

## Important behavior
- Existing turn-based power-strength resolution, health, round, victory, and editable-name flow are preserved.
- The five numbered buttons remain visible during the fight, with the selected power name/icon shown below each player's row.
- This is still a two-player local, turn-based power clash game, not a free-roaming real-time fighting game.

## Validation performed
- Checked all 68 fighter pose files and the 9 required animation strips per fighter.
- Checked all 36 power names have a corresponding power texture mapping and that the referenced texture files exist.
- Parsed the complete CSS stylesheet with zero parser errors.
- Ran TypeScript TSX parsing; no TSX syntax diagnostics were reported. Full type/build validation could not be completed because the environment does not have the project's React/Vite dependencies installed and npm install timed out.

## Performance note
The canvas follows the browser's `requestAnimationFrame` refresh cadence and uses bounded particles. A stable 120 FPS depends on the display refresh rate, browser, GPU, and device. No hardware benchmark is claimed.
