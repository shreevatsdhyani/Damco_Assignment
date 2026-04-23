import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { VoiceProvider } from "./lib/VoiceContext";
import { ThemeProvider } from "./lib/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aegis - Voice-Activated AI CFO",
  description: "Privacy-first financial intelligence platform. Ask questions about your financial data using voice commands while maintaining 100% data privacy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <VoiceProvider>{children}</VoiceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
