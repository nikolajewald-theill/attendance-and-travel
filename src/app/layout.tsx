import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Fremmøde',
  description: 'Spor arbejdsfremmøde, pendling og ferie',
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
