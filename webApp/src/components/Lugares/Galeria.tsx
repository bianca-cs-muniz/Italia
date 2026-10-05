"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { urlDaFoto } from "@/services/fotos/fotos.service";
import { inicialDoNome, proximoIndice } from "./regras";
import { Marcador, PainelGaleria } from "./styles";

// Arrasto mínimo, em px, para o gesto contar como troca de foto.
const ARRASTO_MINIMO = 40;

interface IGaleriaProps {
  // Ids das fotos, em ordem.
  fotos: string[];
  nome: string;
}

export const Galeria = ({ fotos, nome }: IGaleriaProps) => {
  const [indice, setIndice] = useState(0);
  const inicioArrasto = useRef<number | null>(null);
  const total = fotos.length;
  // A lista pode encolher numa recarga enquanto o visualizador está aberto.
  const atual = Math.min(indice, Math.max(0, total - 1));

  const andar = useCallback((passo: number) => setIndice((i) => proximoIndice(Math.min(i, Math.max(0, total - 1)), passo, total)), [total]);

  // Setas do teclado trocam a foto de qualquer ponto do visualizador.
  useEffect(() => {
    if (total < 2) return;
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.target instanceof HTMLInputElement) return;
      if (evento.key === "ArrowRight") andar(1);
      if (evento.key === "ArrowLeft") andar(-1);
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [andar, total]);

  if (total === 0) {
    return (
      <PainelGaleria>
        <Marcador className="tiles" data-grande="">
          <span>{inicialDoNome(nome)}</span>
        </Marcador>
      </PainelGaleria>
    );
  }

  return (
    <PainelGaleria
      onPointerDown={(evento) => {
        inicioArrasto.current = evento.clientX;
      }}
      onPointerUp={(evento) => {
        if (inicioArrasto.current === null) return;
        const deslocamento = evento.clientX - inicioArrasto.current;
        inicioArrasto.current = null;
        if (Math.abs(deslocamento) > ARRASTO_MINIMO) andar(deslocamento < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        inicioArrasto.current = null;
      }}
    >
      {fotos.map((id, i) => (
        <div key={id} className={i === atual ? "slide active" : "slide"} aria-hidden={i === atual ? undefined : true}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlDaFoto(id)} alt={`${nome} — foto ${i + 1}`} draggable={false} />
        </div>
      ))}
      {total > 1 && (
        <>
          <button type="button" className="gnav prev" aria-label="Foto anterior" onClick={() => andar(-1)}>
            ‹
          </button>
          <button type="button" className="gnav next" aria-label="Próxima foto" onClick={() => andar(1)}>
            ›
          </button>
          <span className="gcount">
            {atual + 1} / {total}
          </span>
          <div className="dots" aria-hidden="true">
            {fotos.map((id, i) => (
              <i key={id} className={i === atual ? "on" : undefined} />
            ))}
          </div>
        </>
      )}
    </PainelGaleria>
  );
};
