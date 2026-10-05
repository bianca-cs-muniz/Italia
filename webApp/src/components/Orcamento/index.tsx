"use client";

import React from "react";
import { calcularBarra, META_ORCAMENTO, ORCAMENTO } from "@/dados/orcamento";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { formatarFaixaReais } from "@/utils/moeda";
import { Barras, Total } from "./styles";

// Estilo da barra depois que a lista entra na tela: ela cresce de zero até o
// máximo da faixa, com o trecho abaixo do mínimo esmaecido.
const estiloDaBarra = (minimo: number, maximo: number, posicao: number): React.CSSProperties => {
  const { largura, inicioFaixa } = calcularBarra(minimo, maximo);
  return {
    left: "0%",
    width: `${largura}%`,
    background: `linear-gradient(90deg, color-mix(in srgb, var(--maiolica) 35%, transparent) 0 ${inicioFaixa}%, var(--maiolica) ${inicioFaixa}% 100%)`,
    // Uma barra depois da outra.
    transitionDelay: `${posicao * 90}ms`,
  };
};

export const Orcamento = () => {
  const { ref: refCabecalho, visivel: cabecalhoVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refBarras, visivel: barrasVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refTotal, visivel: totalVisivel } = useRevelar<HTMLDivElement>();

  return (
    <section id="orcamento">
      <div className="wrap">
        <div ref={refCabecalho} className={classeRevelar(cabecalhoVisivel, "sec-head")}>
          <h2>Orçamento para 3</h2>
          <p>Faixas estimadas por categoria. A barra mostra do mínimo ao máximo.</p>
        </div>
        <Barras ref={refBarras} className={classeRevelar(barrasVisivel)}>
          {ORCAMENTO.map((faixa, i) => (
            <div key={faixa.rotulo} className="brow">
              <span className="lbl">{faixa.rotulo}</span>
              <div className="track">
                <span className="fill" style={barrasVisivel ? estiloDaBarra(faixa.minimo, faixa.maximo, i) : undefined} />
              </div>
              <span className="val">{formatarFaixaReais(faixa.minimo, faixa.maximo)}</span>
            </div>
          ))}
        </Barras>
        <Total ref={refTotal} className={classeRevelar(totalVisivel, "tiles")}>
          <span className="t1">Meta recomendada</span>
          <span className="t2">{META_ORCAMENTO}</span>
        </Total>
        <p className="fine">
          Valores são metas de planejamento para 2029/2030, não cotações futuras. Vale manter uma reserva adicional além da meta.
        </p>
      </div>
    </section>
  );
};
