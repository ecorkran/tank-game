# Installation Instructions

To get the Tank Game running on your machine, follow these steps:

## Prerequisites

- Node.js (version 18 or higher recommended)
- npm (comes with Node.js)
- A modern web browser

## Installation Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/tank-game.git
   cd tank-game
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Sound Files

The game requires sound files which are not included in the repository. You'll need to add these files to `/public/assets/sounds/`:

- `shoot.mp3`
- `explosion.mp3`
- `hit.mp3`
- `game-over.mp3`
- `background.mp3`
- `powerup.mp3`
- `shield.mp3`

You can find free sound effects at sites like:
- [Freesound](https://freesound.org/)
- [OpenGameArt](https://opengameart.org/)
- [ZapSplat](https://www.zapsplat.com/)

## Deployment

To deploy to Vercel:

1. Create an account on [Vercel](https://vercel.com) if you don't have one
2. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Follow the prompts to complete the deployment

## Troubleshooting

If you encounter any issues:

1. Make sure you're using a compatible version of Node.js
2. Check the browser console for any error messages
3. Verify that sound files are properly placed in the sounds directory
4. Make sure your browser supports HTML5 Canvas