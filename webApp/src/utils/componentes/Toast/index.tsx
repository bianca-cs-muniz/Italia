"use client";

import React from "react";
import { IToast } from "@/shared/components/useToast";
import { AvisoToast } from "./styles";

interface IToastProps {
  toast: IToast | null;
}

// Região `role="status"` sempre presente: leitores de tela só anunciam
// mudanças em regiões que já existiam quando o texto muda.
export const Toast = ({ toast }: IToastProps) => {
  return (
    <AvisoToast role="status" aria-live="polite" data-visivel={toast ? "" : undefined}>
      {toast?.mensagem}
    </AvisoToast>
  );
};
