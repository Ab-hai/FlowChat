import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "FlowChat — Speak English with real confidence",
  description:
    "Practice spoken English with a friendly AI partner and get honest feedback after every conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${jakarta.variable} ${jakarta.className} h-full antialiased`}
        style={{ "--fc": "#d14925", "--fc-rgb": "209, 73, 37" } as React.CSSProperties}
      >
        <body className="min-h-full">{children}</body>
      </html>
    </ClerkProvider>
  );
}
