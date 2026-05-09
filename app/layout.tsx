import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C-forge",
  description: "Mint cforge CFRG tokens on Celo and MiniPay.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
