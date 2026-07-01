import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fremmøde 2026',
  description: 'Spor arbejdsfremmøde, pendling og ferie for 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="da">
      <body className="bg-slate-50 min-h-screen">{children}</body>
    </html>
  );
}
