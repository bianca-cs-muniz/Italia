"use client";

import { useSyncExternalStore } from "react";

const CONSULTA = "(prefers-reduced-motion: reduce)";

// Leitura pontual, para handlers e efeitos (rolagem suave, tempo de espera de
// uma animação). No servidor responde `false`.
export const movimentoReduzido = () => typeof window !== "undefined" && window.matchMedia(CONSULTA).matches;

const assinar = (aoMudar: () => void) => {
  const consulta = window.matchMedia(CONSULTA);
  consulta.addEventListener("change", aoMudar);
  return () => consulta.removeEventListener("change", aoMudar);
};

// Versão reativa. Na hidratação vale `false` (o mesmo que o servidor
// renderizou) e só depois assume a preferência real, sem erro de hidratação.
export const useMovimentoReduzido = () => useSyncExternalStore(assinar, movimentoReduzido, () => false);
