import type { Metadata } from "next";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/600.css";
import "@fontsource/cormorant-garamond/600-italic.css";
import "@fontsource/cormorant-garamond/700.css";
import "@fontsource/manrope/400.css";
import "@fontsource/manrope/500.css";
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
import "./globals.css";
import Script from "next/script";

export const metadata: Metadata = {
  title: "My Pick Liella!",
  description: "Unofficial Liella! favorite song selection board.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
      <Script defer src="https://analytics.jayjay.li/script.js" data-website-id="dfacb552-190a-472c-84e2-9d9476bbc6d4"/>
    </html>
  );
}
