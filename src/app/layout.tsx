import type { Metadata } from "next";
import { IBM_Plex_Sans, Sora } from "next/font/google";
import { AppProviders } from "@/components/AppProviders";
import "./globals.css";

const fontSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const fontDisplay = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "AI Job Agent — Tech jobs for developers",
  description:
    "Personal AI recruiter for software engineers and tech roles. Tailored CVs and cover letters for programming jobs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontDisplay.variable} min-h-screen antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
