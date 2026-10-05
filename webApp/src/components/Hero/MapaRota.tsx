"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ALTURA_MAPA,
  BATE_VOLTAS,
  CAMINHO_LONGO,
  CAMINHO_NORTE,
  CAMINHO_SUL,
  CAMINHO_TREM,
  IParada,
  LARGURA_MAPA,
  PARADA_INICIAL,
  PARADAS,
  PASSO_GRADE,
} from "@/dados/paradas";
import { movimentoReduzido, useMovimentoReduzido } from "@/shared/components/useMovimentoReduzido";

// Linhas da grade de fundo (sem as bordas do mapa).
const LINHAS_HORIZONTAIS = Array.from({ length: 8 }, (_, i) => (i + 1) * PASSO_GRADE);
const LINHAS_VERTICAIS = Array.from({ length: 7 }, (_, i) => (i + 1) * PASSO_GRADE);

// Tempo de uma volta completa do trem, em ms.
const VOLTA_DO_TREM = 19000;

const irParaTrecho = (parada: IParada) => {
  document.getElementById(`ch-${parada.trecho}`)?.scrollIntoView({ behavior: movimentoReduzido() ? "auto" : "smooth" });
};

export const MapaRota = () => {
  const reduzido = useMovimentoReduzido();
  const norteRef = useRef<SVGPathElement>(null);
  const sulRef = useRef<SVGPathElement>(null);
  const trilhoRef = useRef<SVGPathElement>(null);
  const tremRef = useRef<SVGCircleElement>(null);
  const [paradasVisiveis, setParadasVisiveis] = useState(false);
  const [desenhado, setDesenhado] = useState(false);

  // O traçado é animado pelo comprimento real de cada caminho, que só o
  // navegador sabe medir; por isso tudo acontece aqui, depois de montar.
  useEffect(() => {
    const norte = norteRef.current;
    const sul = sulRef.current;
    const trilho = trilhoRef.current;
    const trem = tremRef.current;
    if (!norte || !sul || !trilho || !trem) return;

    const temporizadores: number[] = [];
    let quadro = 0;

    const tracar = (caminho: SVGPathElement, duracao: number, atraso: number) => {
      const comprimento = caminho.getTotalLength();
      caminho.style.transition = "none";
      caminho.style.strokeDasharray = String(comprimento);
      caminho.style.strokeDashoffset = reduzido ? "0" : String(comprimento);
      if (reduzido) return;
      // Força o navegador a aplicar o estado inicial antes de ligar a transição.
      caminho.getBoundingClientRect();
      caminho.style.transition = `stroke-dashoffset ${duracao}s cubic-bezier(.6,.1,.3,1) ${atraso}s`;
      caminho.style.strokeDashoffset = "0";
    };
    tracar(norte, 2.8, 0.5);
    tracar(sul, 0.9, 3.5);

    temporizadores.push(window.setTimeout(() => setParadasVisiveis(true), reduzido ? 0 : 500));
    temporizadores.push(window.setTimeout(() => setDesenhado(true), reduzido ? 0 : 3100));

    // O trem percorre o caminho inteiro em laço. Sem animação quando a pessoa
    // pediu menos movimento.
    if (!reduzido) {
      const comprimento = trilho.getTotalLength();
      temporizadores.push(
        window.setTimeout(() => {
          let inicio: number | null = null;
          trem.setAttribute("opacity", "1");
          const andar = (agora: number) => {
            if (inicio === null) inicio = agora;
            const fracao = ((agora - inicio) / VOLTA_DO_TREM) % 1;
            const ponto = trilho.getPointAtLength(fracao * comprimento);
            trem.setAttribute("cx", String(ponto.x));
            trem.setAttribute("cy", String(ponto.y));
            quadro = requestAnimationFrame(andar);
          };
          quadro = requestAnimationFrame(andar);
        }, 4400),
      );
    }

    return () => {
      temporizadores.forEach((t) => window.clearTimeout(t));
      cancelAnimationFrame(quadro);
      trem.setAttribute("opacity", "0");
    };
  }, [reduzido]);

  return (
    <svg
      className={desenhado ? "route drawn" : "route"}
      viewBox={`0 0 ${LARGURA_MAPA} ${ALTURA_MAPA}`}
      role="group"
      aria-label="Mapa do roteiro"
    >
      {LINHAS_HORIZONTAIS.map((y) => (
        <line key={`h${y}`} x1={0} x2={LARGURA_MAPA} y1={y} y2={y} stroke="#fff" strokeOpacity={0.06} />
      ))}
      {LINHAS_VERTICAIS.map((x) => (
        <line key={`v${x}`} y1={0} y2={ALTURA_MAPA} x1={x} x2={x} stroke="#fff" strokeOpacity={0.06} />
      ))}

      {BATE_VOLTAS.map((bateVolta) => (
        <path key={bateVolta.id} className="spur" d={bateVolta.d} />
      ))}
      <path className="long" d={CAMINHO_LONGO} />
      <path ref={norteRef} className="main" d={CAMINHO_NORTE} />
      <path ref={sulRef} className="main" d={CAMINHO_SUL} />
      <path ref={trilhoRef} d={CAMINHO_TREM} fill="none" stroke="none" />

      {PARADAS.map((parada, i) => {
        const ancora = parada.ancora ?? "start";
        const classes = ["stop", parada.base ? "base" : "", paradasVisiveis ? "on" : ""].filter(Boolean).join(" ");
        return (
          <g
            key={parada.id}
            className={classes}
            // As paradas acendem em sequência, no sentido da viagem.
            style={{ transitionDelay: `${i * 230}ms` }}
            tabIndex={0}
            role="link"
            aria-label={`${parada.nomeCompleto ?? parada.nome}, ${parada.dias}`}
            onClick={() => irParaTrecho(parada)}
            onKeyDown={(evento) => {
              if (evento.key === "Enter" || evento.key === " ") {
                evento.preventDefault();
                irParaTrecho(parada);
              }
            }}
          >
            <circle className="ring" cx={parada.x} cy={parada.y} r={parada.base ? 7 : 5} />
            <text x={parada.x + parada.rotuloX} y={parada.y + parada.rotuloY} textAnchor={ancora}>
              {parada.nome}
            </text>
            <text className="d" x={parada.x + parada.rotuloX} y={parada.y + parada.rotuloY + 13} textAnchor={ancora}>
              {parada.dias}
            </text>
          </g>
        );
      })}

      <circle ref={tremRef} className="train" r={4.5} cx={PARADA_INICIAL.x} cy={PARADA_INICIAL.y} opacity={0} />
    </svg>
  );
};
