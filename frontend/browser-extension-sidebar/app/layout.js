import { Inter, JetBrains_Mono } from 'next/font/google';
import { ThemeProvider } from '@/components/theme-provider';
import { EmbedModeHandler } from '@/components/EmbedModeHandler';
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
  title: 'PAROKSH - Your AI Browser Agent',
  description: 'PAROKSH is your intelligent browser assistant that can browse, click, search, fill forms and complete tasks for you.',
  openGraph: {
    title: 'PAROKSH - Your AI Browser Agent',
    description: 'An autonomous AI agent that lives in your browser sidebar and can understand and interact with webpages.',
    images: [
      {
        url: 'https://paroksh.ai/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'PAROKSH AI Browser Agent'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAROKSH - Your AI Browser Agent',
    description: 'An autonomous AI agent that lives in your browser sidebar and can understand and interact with webpages.'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground">
        <EmbedModeHandler />
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
