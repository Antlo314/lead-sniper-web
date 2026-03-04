import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Urgent Lead Sniper 🎯',
  description: 'Siphoning the noise to find cash-ready clients in real-time.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
