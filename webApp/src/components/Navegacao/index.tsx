"use client";

import React, { useEffect, useState } from "react";
import { Barra } from "./styles";

// Os ids são os das seções dentro de <main>.
export const SECOES = [
  { id: "roteiro", rotulo: "Roteiro" },
  { id: "hospedagem", rotulo: "Hospedagem" },
  { id: "orcamento", rotulo: "Orçamento" },
  { id: "checklist", rotulo: "Checklist" },
  { id: "dicas", rotulo: "Dicas" },
];

export const Navegacao = () => {
  const [rolou, setRolou] = useState(false);
  const [ativa, setAtiva] = useState<string | null>(null);

  // A borda de baixo só aparece depois que a página rola.
  useEffect(() => {
    const aoRolar = () => setRolou(window.scrollY > 10);
    window.addEventListener("scroll", aoRolar, { passive: true });
    // A página pode abrir já rolada (recarga no meio, link com âncora).
    aoRolar();
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  // Seção ativa: a que cruza a faixa logo acima do meio da tela.
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) setAtiva(entrada.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    SECOES.forEach(({ id }) => {
      const secao = document.getElementById(id);
      if (secao) observador.observe(secao);
    });
    return () => observador.disconnect();
  }, []);

  return (
    <Barra data-rolou={rolou ? "" : undefined} aria-label="Seções do plano">
      <div className="wrap">
        <a className="brand" href="#top">
          Itália, setembro
        </a>
        <div className="nav-links">
          {SECOES.map(({ id, rotulo }) => (
            <a key={id} href={`#${id}`} className={ativa === id ? "active" : undefined} aria-current={ativa === id ? "true" : undefined}>
              {rotulo}
            </a>
          ))}
        </div>
      </div>
    </Barra>
  );
};
