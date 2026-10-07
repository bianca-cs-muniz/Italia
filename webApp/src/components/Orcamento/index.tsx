"use client";

import React from "react";
import {
  calcularBarra,
  ESTIMATIVA_TRECHO,
  IFaixaOrcamento,
  META_ORCAMENTO,
  ORCAMENTO,
  somarFaixas,
  TETO_ESTIMATIVA_TRECHO,
  TETO_ORCAMENTO,
} from "@/dados/orcamento";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { formatarFaixaReais } from "@/utils/moeda";
import { Barras, Total, Trecho } from "./styles";

// Estilo da barra depois que a lista entra na tela: ela cresce de zero até o
// máximo da faixa, com o trecho abaixo do mínimo esmaecido. O teto é o valor
// da barra cheia (cada bloco tem a sua escala).
const estiloDaBarra = (minimo: number, maximo: number, teto: number, posicao: number): React.CSSProperties => {
  const { largura, inicioFaixa } = calcularBarra(minimo, maximo, teto);
  return {
    left: "0%",
    width: `${largura}%`,
    background: `linear-gradient(90deg, color-mix(in srgb, var(--maiolica) 35%, transparent) 0 ${inicioFaixa}%, var(--maiolica) ${inicioFaixa}% 100%)`,
    // Uma barra depois da outra.
    transitionDelay: `${posicao * 90}ms`,
  };
};

interface ILinhaBarraProps {
  faixa: IFaixaOrcamento;
  teto: number;
  posicao: number;
  // A barra só ganha largura quando a lista entra na tela.
  visivel: boolean;
}

// Uma linha de barra: usada nas faixas gerais e na estimativa do trecho.
const LinhaBarra = ({ faixa, teto, posicao, visivel }: ILinhaBarraProps) => (
  <div className="brow">
    <span className="lbl">{faixa.rotulo}</span>
    <div className="track">
      <span className="fill" style={visivel ? estiloDaBarra(faixa.minimo, faixa.maximo, teto, posicao) : undefined} />
    </div>
    <span className="val">{formatarFaixaReais(faixa.minimo, faixa.maximo)}</span>
  </div>
);

const TOTAL_TRECHO = somarFaixas(ESTIMATIVA_TRECHO.faixas);

export const Orcamento = () => {
  const { ref: refCabecalho, visivel: cabecalhoVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refBarras, visivel: barrasVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refTotal, visivel: totalVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refTrecho, visivel: trechoVisivel } = useRevelar<HTMLDivElement>();

  return (
    <section id="orcamento">
      <div className="wrap">
        <div ref={refCabecalho} className={classeRevelar(cabecalhoVisivel, "sec-head")}>
          <h2>Orçamento para 3</h2>
          <p>Faixas estimadas por categoria. A barra mostra do mínimo ao máximo.</p>
        </div>
        <Barras ref={refBarras} className={classeRevelar(barrasVisivel)}>
          {ORCAMENTO.map((faixa, i) => (
            <LinhaBarra key={faixa.rotulo} faixa={faixa} teto={TETO_ORCAMENTO} posicao={i} visivel={barrasVisivel} />
          ))}
        </Barras>
        <Total ref={refTotal} className={classeRevelar(totalVisivel, "tiles")}>
          <span className="t1">Meta recomendada</span>
          <span className="t2">{META_ORCAMENTO}</span>
        </Total>
        <p className="fine">
          Valores são metas de planejamento para 2029/2030, não cotações futuras. Vale manter uma reserva adicional além da meta.
          Faixas calculadas para o roteiro anterior, de 22–23 dias; revisar para o roteiro atual, de 25 dias, com carro de Salerno a
          Assis e volta por Milão.
        </p>
        <Trecho ref={refTrecho} className={classeRevelar(trechoVisivel)}>
          <h3>Estimativa parcial: {ESTIMATIVA_TRECHO.titulo}</h3>
          <p className="apoio">Recorte de três cidades para os três; não se soma à meta. Escala própria.</p>
          <Barras>
            {ESTIMATIVA_TRECHO.faixas.map((faixa, i) => (
              <LinhaBarra key={faixa.rotulo} faixa={faixa} teto={TETO_ESTIMATIVA_TRECHO} posicao={i} visivel={trechoVisivel} />
            ))}
          </Barras>
          <p className="total-trecho">
            Total da estimativa <b>{formatarFaixaReais(TOTAL_TRECHO.minimo, TOTAL_TRECHO.maximo)}</b>
          </p>
          <p className="nota">
            Calculada para o roteiro anterior: 10 noites (Roma 5, Assis 2, Florença 3) e trem entre as três. Hoje são 12 noites nessas
            cidades e elas não são mais seguidas; revisar.
          </p>
        </Trecho>
      </div>
    </section>
  );
};
