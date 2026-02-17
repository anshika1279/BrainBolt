import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "BrainBolt Quiz",
  description: "Adaptive infinite quiz platform with live leaderboards.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${fraunces.variable}`}
      suppressHydrationWarning
      data-theme="light"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(() => { try { const stored = localStorage.getItem('theme'); if (stored) document.documentElement.setAttribute('data-theme', stored); } catch (e) {} })();",
          }}
        />
      </head>
      <body className="min-h-screen bg-bg text-foreground">
        {children}
      </body>
    </html>
  );
}
