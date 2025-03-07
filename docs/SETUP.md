# Tank Game Setup Instructions

This document will guide you through setting up and running the tank game project. Follow these steps to get started.

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm or yarn
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Initial Setup

1. Clone the repository (or unzip the project files into a directory)

2. Open a terminal and navigate to the project directory:
   ```bash
   cd tank-game
   ```

3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

## Project Structure

Before starting, familiarize yourself with the project's structure:

```
tank-game/
├── public/                  # Static assets
│   ├── assets/
│   │   ├── sounds/          # Game sound effects
│   │   └── sprites/         # Game graphics (if any)
│   └── favicon.ico          # Site favicon
├── src/                     # Source code
│   ├── app/                 # Next.js app directory
│   ├── components/          # React components
│   │   └── game/            # Game-specific components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Game logic and utilities
│   ├── styles/              # CSS modules
│   └── types/               # TypeScript type definitions
├── package.json             # Project dependencies and scripts
├── next.config.js           # Next.js configuration
├── tsconfig.json            # TypeScript configuration
└── vercel.json              # Vercel deployment configuration
```

## Development

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. The game should now be running in your browser with hot-reloading enabled.

## Adding Sound Assets

For the game to work properly, you need to add sound effects:

1. Create the following directories if they don't exist:
   ```bash
   mkdir -p public/assets/sounds
   ```

2. Add the following sound files to the `public/assets/sounds/` directory:
   - `shoot.mp3` - Sound when firing
   - `explosion.mp3` - Sound when an enemy is destroyed
   - `hit.mp3` - Sound when a projectile hits a tank
   - `game-over.mp3` - Sound when the player dies
   - `background.mp3` - Background music
   - `powerup.mp3` - Sound when collecting a power-up
   - `shield.mp3` - Sound when shield blocks damage

   You can find free sound effects at sites like:
   - [Freesound](https://freesound.org/)
   - [OpenGameArt](https://opengameart.org/)
   - [ZapSplat](https://www.zapsplat.com/)

## Building for Production

1. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. The output files will be in the `out` directory, ready for deployment.

## Deployment

The game is configured for easy deployment to Vercel:

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy the project:
   ```bash
   vercel
   ```

3. Follow the prompts to complete the deployment.

## Troubleshooting

If you encounter any issues:

1. **Dependency Errors**: Make sure you're using the correct Node.js version and have installed all dependencies.
   ```bash
   npm install
   ```

2. **Build Errors**: Check for TypeScript errors in your code.
   ```bash
   npm run lint
   ```

3. **Runtime Errors**: Check the browser console for errors. Most issues will be reported there.

4. **Canvas Not Rendering**: Make sure your browser supports HTML5 Canvas and that JavaScript is enabled.

## Next Steps

After setting up the project, refer to the following files:

- `task-outline.md` - Overview of all game features to implement
- `detailed-implementation-guide.md` - Step-by-step implementation instructions
- `implementation-overview.md` - High-level architecture overview

Happy coding!