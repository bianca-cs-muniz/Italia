"use client";

import React from "react";
import { TRECHOS, TrechoId } from "@/dados/trechos";
import { ILugar } from "@/services/lugares/lugares.service";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { Capitulo } from "./Capitulo";
import { SecaoRoteiro } from "./styles";

interface IRoteiroProps {
  lugares: ILugar[];
  carregandoLugares: boolean;
  aoAbrirLugar: (lugar: ILugar, origem: HTMLElement) => void;
  aoAdicionarLugar: (trecho: TrechoId, origem: HTMLElement) => void;
}

export const Roteiro = ({ lugares, carregandoLugares, aoAbrirLugar, aoAdicionarLugar }: IRoteiroProps) => {
  const { ref, visivel } = useRevelar<HTMLDivElement>();

  return (
    <SecaoRoteiro id="roteiro">
      <div className="wrap">
        <div ref={ref} className={classeRevelar(visivel, "sec-head")}>
          <h2>Roteiro dia a dia</h2>
          <p>
            Roma → Assis → Florença → Cinque Terre → Veneza → Milão → Nápoles → San Giovanni Rotondo → Costa Amalfitana, com três
            paradas de peregrinação: Roma, Assis e San Giovanni Rotondo. A Sicília fica para uma viagem própria de 10–14 dias.
          </p>
        </div>
        {TRECHOS.map((trecho) => (
          <Capitulo
            key={trecho.id}
            trecho={trecho}
            lugares={lugares}
            carregandoLugares={carregandoLugares}
            aoAbrirLugar={aoAbrirLugar}
            aoAdicionarLugar={aoAdicionarLugar}
          />
        ))}
      </div>
    </SecaoRoteiro>
  );
};
