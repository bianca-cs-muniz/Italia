"use client";

import React from "react";
import { TRECHOS_COM_BASE } from "@/dados/trechos";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { ContornoTabela } from "./styles";

// Tabela derivada do roteiro: uma linha por trecho que tem cidade-base.
export const Hospedagem = () => {
  const { ref: refCabecalho, visivel: cabecalhoVisivel } = useRevelar<HTMLDivElement>();
  const { ref: refTabela, visivel: tabelaVisivel } = useRevelar<HTMLDivElement>();

  return (
    <section id="hospedagem">
      <div className="wrap">
        <div ref={refCabecalho} className={classeRevelar(cabecalhoVisivel, "sec-head")}>
          <h2>Onde ficar</h2>
          <p>Bases recomendadas, com quarto triplo e boa localização.</p>
        </div>
        <ContornoTabela ref={refTabela} className={classeRevelar(tabelaVisivel)}>
          <table>
            <thead>
              <tr>
                <th scope="col">Cidade</th>
                <th scope="col">Noites</th>
                <th scope="col">Estratégia</th>
              </tr>
            </thead>
            <tbody>
              {TRECHOS_COM_BASE.map((trecho) => (
                <tr key={trecho.id}>
                  <td className="city">{trecho.base}</td>
                  <td className="n">{trecho.noites}</td>
                  <td>{trecho.estadia}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </ContornoTabela>
      </div>
    </section>
  );
};
