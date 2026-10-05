"use client";

import React, { useMemo } from "react";
import { calcularProgresso, ITENS_CHECKLIST } from "@/dados/checklist";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { ListaChecklist, Progresso } from "./styles";

interface IChecklistProps {
  // Ids dos itens marcados.
  marcados: string[];
  aoAlternar: (itemId: string, marcado: boolean) => void;
  // Enquanto a lista do servidor não chegou: marcar antes disso valeria sobre
  // um estado que a pessoa ainda não viu.
  desabilitado?: boolean;
}

export const Checklist = ({ marcados, aoAlternar, desabilitado }: IChecklistProps) => {
  const { ref: refCabecalho, visivel: cabecalhoVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refLista, visivel: listaVisivel } = useRevelar<HTMLDivElement>();
  const conjunto = useMemo(() => new Set(marcados), [marcados]);
  const { feitos, total, percentual } = calcularProgresso(marcados);

  return (
    <section id="checklist">
      <div className="wrap">
        <div ref={refCabecalho} className={classeRevelar(cabecalhoVisivel, "sec-head")}>
          <h2>Checklist</h2>
          <Progresso>
            <div className="bar">
              <i style={{ width: `${percentual}%` }} />
            </div>
            <span>
              {feitos} de {total}
            </span>
          </Progresso>
        </div>
        <ListaChecklist ref={refLista} className={classeRevelar(listaVisivel)}>
          {ITENS_CHECKLIST.map((item) => {
            const marcado = conjunto.has(item.id);
            return (
              <label key={item.id} className={marcado ? "check done" : "check"}>
                <input type="checkbox" checked={marcado} disabled={desabilitado} onChange={(e) => aoAlternar(item.id, e.target.checked)} />
                <span className="box">
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M4 10.5l4 4 8-9" />
                  </svg>
                </span>
                <span className="ctext">{item.texto}</span>
              </label>
            );
          })}
        </ListaChecklist>
      </div>
    </section>
  );
};
