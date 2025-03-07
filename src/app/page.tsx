'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the game component
const GameContainer = dynamic(
  () => import('@/components/game/GameContainer'),
  { loading: () => <div>Loading game...</div> }
);

export default function Home() {
  return (
    <main>
      <Suspense fallback={<div>Loading...</div>}>
        <GameContainer />
      </Suspense>
    </main>
  );
}