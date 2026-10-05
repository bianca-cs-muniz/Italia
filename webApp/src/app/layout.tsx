import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeRegistry } from "@/utils/componentes/ThemeRegistry";

export const metadata: Metadata = {
  title: "Itália em setembro — plano de viagem",
  description: "Roteiro dia a dia, lugares salvos, hospedagem, orçamento e checklist da viagem em família pela Itália.",
};

// Claro e escuro: o tema segue o sistema (tokens em globals.css).
export const viewport: Viewport = {
  colorScheme: "light dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="pt-BR">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
};

export default RootLayout;
