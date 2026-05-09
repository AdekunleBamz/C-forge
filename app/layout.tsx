import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "C-forge",
  description: "Mint cforge CFRG tokens on Celo and MiniPay.",
  metadataBase: new URL("https://cforge-app.vercel.app"),
  icons: {
    icon: "/cforge-golden-coin.svg",
    apple: "/cforge-golden-coin.png",
  },
  openGraph: {
    title: "C-forge",
    description: "Mint cforge CFRG tokens on Celo and MiniPay.",
    url: "https://cforge-app.vercel.app",
    siteName: "C-forge",
    images: [
      {
        url: "/cforge-golden-coin.png",
        width: 1024,
        height: 1024,
        alt: "Glowing golden C-forge coin logo",
      },
    ],
  },
  other: {
    "talentapp:project_verification":
      "0eee374814d5791b34dee9025f918ee4d7ab771ab504ae36cfa8fe79091a0c46aedd5a3045aac31f5fc8065130d370970e14344f58273f19561a34e58c7430a6",
  },
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
