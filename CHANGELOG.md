# Changelog

All notable changes to Otter Village.

## [1.1.0] — 2026-06-12

### Added
- Loading screen with spinner when entering the village
- Cross-origin support: Vercel frontend can connect to Railway backend via `VITE_BACKEND_URL`
- `.env.production` for client build configuration
- `vercel.json` for Vercel deployment
- README.md with full project documentation
- CHANGELOG.md (this file)
- `.gitignore` for node_modules and dist

### Changed
- **UI/UX overhaul:**
  - Login screen: animated gradient background, glass-morphism card, better spacing
  - All HUD elements: improved glass-morphism with subtle borders
  - Chat: smoother message animation (scale + slide), refined input focus states
  - Emote bar: better hover effects with lift + scale
  - Player list: glowing dot indicators, hover states
  - Controls hint: more subtle, better positioned
  - Responsive: mobile-friendly layout for login and HUD
  - Loading overlay: animated spinner with fade transition
- Button text changed from "Join Village" → "Enter Village"
- Input fields: disabled spellcheck, better placeholder styling

### Fixed
- Local player not showing in player count (was 0, now correctly shows 1+)
- Local player now appears in villager list as "You"
- `roundRect` canvas API compatibility for older browsers

## [1.0.0] — 2026-06-12

### Added
- Three.js 3D world with procedural generation (seeded RNG)
- 60 trees, 80 flowers, 20 rocks, 6 houses, fences, pond, bridge, town hall
- Socket.io real-time multiplayer (20Hz position sync)
- 8 animal types with unique procedural meshes (ears, tails)
- Day/night cycle with dynamic sun and sky
- Camera-relative WASD movement with walk bobbing
- Chat system with floating 3D bubbles
- 8 emotes with float-up animation
- Name tags as 3D sprites
- Isometric camera with smooth follow
- Express production server serving static build
- Deployed to Railway with public URL
