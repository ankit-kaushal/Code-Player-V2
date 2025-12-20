import type { Metadata } from 'next';
import { AuthProvider } from './context/AuthContext';
import './globals.css';

export const metadata: Metadata = {
  title: 'Code Player',
  description: 'A code player for HTML, CSS, and JavaScript',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

