import type { Metadata } from 'next';
import { Inter as FontSans } from 'next/font/google'; // Using Inter as a clean, modern font
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { AppProviders } from '@/components/providers/AppProviders';


const fontSans = FontSans({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'AgentVerse - AI Agent Marketplace',
  description: 'Discover, hire, and manage AI agents for your projects.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen font-sans antialiased', // Removed bg-background here, body handles it in globals.css
          fontSans.variable
        )}
      >
        <AppProviders>
          {/* Main application wrapper, made transparent to show body background effects */}
          <div className="relative flex min-h-dvh flex-col bg-transparent">
            <Header />
            <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">{children}</main>
            <Footer />
          </div>
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
