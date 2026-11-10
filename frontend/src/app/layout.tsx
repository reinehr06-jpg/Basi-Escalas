import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import { LocaleProvider } from "@/context/LocaleContext";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "Basiléia Escalas",
  description: "Escalas de voluntários: ministérios, funções, confirmações, trocas e presenças.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans bg-[#F9FAFB] text-[#111827] antialiased">
        <LocaleProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </LocaleProvider>
        <Toaster 
          position="top-center" 
          toastOptions={{
            style: {
              background: '#F8F7FC', // gray-50 roxo muito suave
              color: '#3B0764',      // purple-deep
              borderColor: '#E9D5FF', // border roxa clara
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.15)',
              borderRadius: '12px',
              fontWeight: 500,
              fontSize: '14px',
            },
          }} 
        />
      </body>
    </html>
  );
}
