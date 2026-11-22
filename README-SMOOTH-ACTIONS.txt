GLOBAL SUPER HERO - SMOOTH ACTION BUILD

This build uses the exact two user-uploaded GLB meshes from the recent conversation:
- public/models/hell-knight.glb
- public/models/ice-warrior.glb

The files contain static meshes only (no skeletons and no animation clips). This build therefore adds lightweight procedural whole-model idle, lunge, hit-reaction, fall, and victory-combo motion, while the existing canvas game continues to render the power attacks and effects. These are not true articulated limb animations; proper punches/kicks require rigged GLBs with animation clips.

Performance adjustments: renderer pixel ratio capped at 1.25, antialias disabled, delta time capped, and hidden-tab work paused. Three.js and Meshopt decoder are loaded from jsDelivr at runtime, so internet access is required.

Deploy using the existing project settings.
