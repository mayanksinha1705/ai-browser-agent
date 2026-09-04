import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'Agentic Browser — The Browser Built for AI Agents',
  description:
    'An AI-powered browser designed for autonomous AI agents. APIs and SDKs to integrate browser automation into your agent workflows in Python, TypeScript, and more.',
  keywords: [
    'AI Agent Browser',
    'AI browser',
    'browser automation',
    'LangChain browser',
    'AutoGPT browser',
    'headless browser',
    'AI SDK',
  ],
  openGraph: {
    title: 'Agentic Browser — The Browser Built for AI Agents',
    description:
      'A browser designed from the ground up for autonomous AI agents.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Browser — The Browser Built for AI Agents',
    description:
      'A browser designed from the ground up for autonomous AI agents.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
