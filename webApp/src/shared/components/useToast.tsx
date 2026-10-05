"use client";

import { useState, useCallback, useEffect } from "react";

export interface IToast {
  mensagem: string;
  chave: number;
}

export const useToast = () => {
  const [toast, setToast] = useState<IToast | null>(null);

  const mostrarToast = useCallback((mensagem: string) => {
    setToast({ mensagem, chave: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  return { toast, mostrarToast };
};
