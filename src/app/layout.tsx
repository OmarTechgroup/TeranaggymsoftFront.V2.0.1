import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner"
import { PwaRegister } from "@/components/pwa-register";

const geistSans = Inter({
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Inter({
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "TerangaGymSoft",
  description: "Logiciel de gestion salle de sport",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "TerangaGym" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <QueryProvider>
      <AuthProvider>
        <html lang="fr" suppressHydrationWarning>
          <body className={`${geistSans.className} ${geistMono.className} antialiased`}>
            <ThemeProvider>
              <PwaRegister />
              {children}
              <Toaster richColors position="top-right" />
            </ThemeProvider>
          </body>
        </html>
      </AuthProvider>
    </QueryProvider>
  );
}
