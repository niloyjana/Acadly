import type { Metadata } from "next";
import { Space_Grotesk, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { GoogleAnalytics } from "@next/third-parties/google";
import "./globals.css";

const display = Space_Grotesk({ subsets: ["latin"], variable: "--font-display", weight: ["500", "600", "700"] });
const body = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "Acadly — one workspace for every committee",
  description: "Calendar, tasks, submissions, and approvals for student committees.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${display.variable} ${body.variable}`}>
        <div className="fixed inset-0 z-[-1] pointer-events-none" aria-hidden>
          <div
            className="absolute inset-0 dark:hidden"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.12) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
            }}
          />
          <div
            className="absolute inset-0 hidden dark:block"
            style={{
              backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
              maskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 50%, black 40%, transparent 100%)",
            }}
          />
        </div>
        <Providers>{children}</Providers>
        {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />}
      </body>
    </html>
  );
}
