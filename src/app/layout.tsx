import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ConfirmProvider } from "@/components/confirm-dialog";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Heart Desserts · Inventario",
  description: "Control de inventario y ventas de Heart Desserts",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#FDFBF7]">
        <ConfirmProvider>
          <div className="flex-1">{children}</div>
        </ConfirmProvider>
        
        {/* Footer Global */}
        <footer className="py-6 text-center text-xs text-zinc-400 border-t border-zinc-200/60 mt-auto bg-[#FDFBF7]">
          <p className="font-serif font-medium text-zinc-600">Heart Desserts &bull; Sistema de inventario</p>
        </footer>

        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}