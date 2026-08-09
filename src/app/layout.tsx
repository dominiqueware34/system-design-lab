import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AfterCompleteSignInBanner } from "@/components/auth/SignInPrompt";
import { AppNav } from "@/components/nav/AppNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "System Design Lab",
  description:
    "System design teaching game: Training, Practice, Solo Mode, and Campaign seasons. SpaceXAI scores architectures.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-zinc-950 font-sans antialiased`}
      >
        <AppNav />
        <AuthHeader />
        <AfterCompleteSignInBanner />
        {children}
      </body>
    </html>
  );
}
