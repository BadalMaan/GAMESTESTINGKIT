# Global Super Hero — Human 3D + Sound Upgrade

This build replaces the previous mannequin/remote-GLB experiment with Ara 3D Gen's real MakeHuman-based character builder. It constructs two distinct rigged human characters in-browser (Soldier / Adventurer), recolours their outfits blue/red, and adds light superhero armour without covering their faces. Combat, locomotion and reaction animation sets are requested from the library.

The original game rules, power roster, selection flow, health, rounds, MegaPower/Shield exceptions, damage and win logic have been left in the existing arena code.

## Sound
`public/audio/` contains original locally bundled WAV effects for selection, launch, elemental powers, clash, draw and victory. The existing user-requested AHHH and Get Out Loser voice clips remain separate and mutually exclusive.

## Deploy
Deploy the project root to Netlify with: Install `npm install`, Build `npm run build`, Publish `dist`. The 3D character library loads its CC0 MakeHuman/CMU data from its documented CDN at runtime, so the deployed site needs internet access to that CDN on first load.

## Credits
Ara 3D Gen: MIT software; CC0 MakeHuman character data; CMU Graphics Lab motion-capture animations. See https://ara3dgen.com/ and https://ara3dgen.com/docs/library/ .
