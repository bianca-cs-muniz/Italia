"use client";

import React from "react";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@mui/material/styles";
import { tema } from "@/utils/tema";

// Cria o tema dentro de um Client Component: o objeto de tema do MUI tem
// funções internas que não podem atravessar a fronteira servidor -> cliente
// do App Router se forem passadas como prop. Sem CssBaseline de propósito: o
// reset e os tokens vêm de globals.css.
export const ThemeRegistry = ({ children }: { children: React.ReactNode }) => {
  return (
    <AppRouterCacheProvider options={{ key: "css" }}>
      <ThemeProvider theme={tema}>{children}</ThemeProvider>
    </AppRouterCacheProvider>
  );
};
