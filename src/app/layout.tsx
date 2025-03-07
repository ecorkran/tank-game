import React from 'react';
import './globals.css';

export const metadata = {
  title: 'Tank Game',
  description: 'A 2D tank battle game',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}