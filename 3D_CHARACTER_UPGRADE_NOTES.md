# Global Super Hero — Real 3D Character Upgrade

This build adds a genuine real-time Three.js character layer to the existing `public/arena.html` battle scene. The two fighters use a rigged, textured human GLB model with separate blue/red superhero armour accents attached to the model skeleton. The original arena renderer remains as a fallback if the remote GLB cannot be fetched.

## Preserved
- Existing power selection, rounds, health and clash resolution in `arena.html`
- Existing power wheel and numbered power controls
- Existing sound event sequencing and custom hit/loser audio behaviour
- Existing bright daytime arena artwork and VFX
- Existing Netlify build configuration

## 3D model source and license
- Model: Grab3D, “Man Base Mesh” rigged GLB
- Direct runtime asset: `https://grab3d.com/dl/man-base-character-rigged/man-base-character-rigged.glb`
- License: CC0 1.0 (public domain dedication), as stated on the model page
- Source page: https://grab3d.com/models/characters/man-base-character/

The model is fetched at runtime, so first-time loading requires an internet connection and the host must allow cross-origin GLB delivery. If the model host or CDN is unavailable, the game automatically falls back to the original canvas fighters rather than breaking the match.

## Technical note
The 3D model has rigged walk/run clips. The arena's existing combat state is bridged to the 3D overlay for cast, hit recoil and knockdown presentation. This is a first integrated 3D pass; it does not yet include bespoke motion-captured punch, kick, Phoenix transformation or full ragdoll clips. The source model is a realistic human base mesh with fitted superhero armour accents, not a custom sculpted AAA hero asset.

## Netlify
- Install command: `npm install`
- Build command: `npm run build`
- Publish/output directory: `dist`
