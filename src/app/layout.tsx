import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, DM_Sans, Parisienne, Special_Elite } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import "./wedding-brand.css";

const cormorant = Cormorant_Garamond({
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-cormorant",
  display: "swap",
});

const dmSans = DM_Sans({
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const parisienne = Parisienne({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-parisienne",
  display: "swap",
});

const specialElite = Special_Elite({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-special-elite",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Jans Narvaez & Yurleydi Solarte | Nuestra boda",
  description: "Acompáñanos a celebrar nuestra boda el 11 de octubre de 2026 a las 6:00 p. m. en Mocoa, Putumayo.",
  applicationName: "Jans & Yurleydi",
};

export const viewport: Viewport = {
  themeColor: "#f5edfb",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-CO" className={`${cormorant.variable} ${dmSans.variable} ${parisienne.variable} ${specialElite.variable} antialiased`}>
      <body className="min-h-screen flex flex-col font-body">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[10001] focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:text-[#5b3f6d]">Ir al contenido principal</a>
        {children}
        <Toaster position="bottom-center" toastOptions={{ style: { background: "#fffafe", color: "#44334f", border: "1px solid rgba(123, 98, 93, .2)", fontFamily: "var(--font-dm-sans)" } }} />
      </body>
    </html>
  );
}
