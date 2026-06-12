# New Greenwood — Black Wall Street Reborn

A 3D city-building adventure honoring the historic Greenwood District of Tulsa, Oklahoma — where O.W. Gurley, J.B. Stradford, and a community of builders created Black Wall Street.

Walk the district. Harvest lumber, stone, and clay. Build storefronts, trade, take on quests from Greenwood's founders, and grow community wealth — one storefront at a time.

## Features

- **Character creator** — design your founder: era-appropriate names, six callings with founding bonuses, eight skin tones, natural hairstyles (afro, locs, braids, afro puffs, waves), 1920s hats and attire, with a live 3D preview
- **Living 3D world** — day/night cycle with adaptive lighting and music, regrowing resources, NPCs with quests and gossip, click-to-move or WASD
- **Economy & progression** — build and upgrade eight building types, earn BSWX, gain reputation and levels, autosaving to local storage
- **Performance-first rendering** — instanced Kenney models keep the whole forest and quarry to a handful of draw calls
- **Recorded foley audio** — real chop/mine/footstep/coin samples with pitch variation, with a synthesized fallback engine

## Run locally

Prerequisites: Node.js 18+

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrows / click | Move |
| E / Enter / Space | Interact |
| Q | Quests |
| I | Inventory |
| M | Map |
| H | Help |
| Esc | Close panel |

## Tech

Next.js · React Three Fiber · Zustand · Tailwind CSS · WebAudio

3D models and sound effects by [Kenney](https://kenney.nl) (CC0).
