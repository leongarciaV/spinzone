import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpinZone — entrenamiento por frecuencia cardiaca",
  description: "Diseña y realiza sesiones de spinning guiadas por tus zonas cardiacas.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "SpinZone",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
