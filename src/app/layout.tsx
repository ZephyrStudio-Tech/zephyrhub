import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "sonner";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ZephyrHub - Kit Digital",
  description: "Centro de operaciones B2B - Gestión completa del Kit Digital",
  icons: {
    icon: "https://supabase.kitdigitalzephyrstudio.es/storage/v1/object/public/img_web/logozephyrhub.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1e293b",
              border: "1px solid #334155",
              color: "#f1f5f9",
            },
            classNames: {
              success: "!bg-emerald-900/90 !border-emerald-700 !text-emerald-100",
              error: "!bg-red-900/90 !border-red-700 !text-red-100",
              info: "!bg-cyan-900/90 !border-cyan-700 !text-cyan-100",
              warning: "!bg-amber-900/90 !border-amber-700 !text-amber-100",
            },
          }}
        />
      </body>
    </html>
  );
}
