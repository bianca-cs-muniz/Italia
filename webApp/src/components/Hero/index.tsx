"use client";

import React from "react";
import { MapaRota } from "./MapaRota";
import { Cabecalho } from "./styles";

const TITULO = "Itália";

const FATOS: { rotulo: string; valor: string; destaque?: boolean }[] = [
  { rotulo: "Duração", valor: "25 dias" },
  { rotulo: "Estilo", valor: "Confortável, sem luxo" },
  { rotulo: "Transporte", valor: "Trem, barco e carro de Salerno a Assis" },
  { rotulo: "Planejamento", valor: "2029/2030" },
  { rotulo: "Meta para os 3", valor: "R$ 55–60 mil", destaque: true },
];

export const Hero = () => {
  return (
    <Cabecalho id="top">
      <div className="wrap">
        <div>
          <p className="who">Você, sua mãe e uma criança de 11 anos</p>
          {/* As letras sobem uma a uma; o leitor de tela lê só o rótulo. */}
          <h1 className="title" aria-label={TITULO}>
            <span aria-hidden="true">
              {Array.from(TITULO).map((letra, i) => (
                <span key={i} className="l" style={{ animationDelay: `${(0.08 * i).toFixed(2)}s` }}>
                  {letra}
                </span>
              ))}
            </span>
          </h1>
          <p className="title-2">vinte e cinco dias em setembro</p>
          <p className="goal">
            Os principais lugares do país e três paradas de fé num ritmo confortável: história, paisagens, praia, comida boa e
            experiências que também façam sentido para uma criança.
          </p>
          <dl className="facts">
            {FATOS.map((fato) => (
              <div key={fato.rotulo} className={fato.destaque ? "fact money" : "fact"}>
                <dt>{fato.rotulo}</dt>
                <dd>{fato.valor}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mapcard tiles">
          <h2>O caminho</h2>
          <p>Toque numa cidade para ir ao trecho do roteiro.</p>
          <MapaRota />
          <div className="legend">
            <span>
              <i />
              Entre bases
            </span>
            <span>
              <i className="spurl" />
              Bate-volta
            </span>
          </div>
        </div>
      </div>
    </Cabecalho>
  );
};
