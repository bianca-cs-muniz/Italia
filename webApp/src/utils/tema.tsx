import { createTheme } from "@mui/material/styles";

// Os componentes usam os tokens CSS de globals.css (var(--ink),
// var(--maiolica)...), que já trocam sozinhos entre claro e escuro. O tema MUI
// só existe para o SSR do emotion e para manter a mesma fonte da interface.
export const tema = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#1F4AA8" },
    background: { default: "#F4F6FA" },
    text: { primary: "#16213A", secondary: "#5B6478" },
  },
  typography: {
    fontFamily: "'Figtree', system-ui, sans-serif",
  },
});
