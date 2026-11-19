# UHD Character & Power Artwork Pass

This patch is based on the uploaded `Global-Punjabi-Arena-ARTWORK-ENGINE-REBUILD.zip`.

## Changes
- Added 1146x1291 transparent UHD fighter cutouts for Blue and Red.
- Updated the hero selection cards and persistent fighter layer to use the UHD cutouts.
- Updated the live combat canvas to preload and draw the UHD fighter artwork for idle/hurt states.
- Kept the existing distinct punch, kick, and cast pose art; upscaled those source PNGs 2x with Lanczos resampling and restrained edge sharpening.
- Upscaled all 16 power-effect textures 2x and increased the authored power-art draw size.
- Increased the live canvas backing resolution cap from 1.5x to 2x device pixel ratio.
- Enlarged fighter display bounds and refined the round-result banner.

## Verification
- Verified that the new Blue and Red transparent artwork files exist and are referenced by the React game.
- Verified all 16 power texture files exist after the upscale.
- Verified ZIP integrity after packaging.
- A full Vite/TypeScript production build was not run successfully because project dependencies are not installed in this environment. Install with `npm install`, then run `npm run build` before deploying.

## Notes
The UHD Red fighter is a recolored companion variant of the new Blue artwork so both sides share consistent rendering quality. The original pose/cast artwork remains in place for distinct attack silhouettes. This is an asset and rendering-quality improvement, not a claim of a completed hand-drawn 50-frame animation set or a measured 120 FPS benchmark.
