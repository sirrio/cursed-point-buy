import "./globals.css";

export const metadata = {
  title: "Hybrid Point Buy",
  description: "D&D Hybrid Point Buy Rechner mit Curse-Regeln"
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

