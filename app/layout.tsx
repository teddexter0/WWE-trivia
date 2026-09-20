import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WWE Era Trivia | 2009–2018",
  description: "Test your WWE knowledge across five levels from Rookie to Hall of Famer.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
