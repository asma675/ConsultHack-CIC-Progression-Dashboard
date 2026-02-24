export const metadata = {
  title: "CIC Progression Dashboard",
  description: "Glow progression membership demo with tiers + admin + persistence",
};

import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
