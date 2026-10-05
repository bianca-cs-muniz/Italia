"use client";

import React, { useMemo } from "react";
import { TrechoId } from "@/dados/trechos";
import { ILugar } from "@/services/lugares/lugares.service";
import { CartaoLugar } from "./CartaoLugar";
import { lugaresDoTrecho } from "./regras";
import { BotaoAdicionar, CabecalhoLugares, Grade } from "./styles";

interface IGradeLugaresProps {
  trechoId: TrechoId;
  tituloTrecho: string;
  // Todos os lugares; a grade mostra só os deste trecho, do mais antigo ao mais novo.
  lugares: ILugar[];
  carregando: boolean;
  aoAbrir: (lugar: ILugar, origem: HTMLElement) => void;
  aoAdicionar: (origem: HTMLElement) => void;
}

export const GradeLugares = ({ trechoId, tituloTrecho, lugares, carregando, aoAbrir, aoAdicionar }: IGradeLugaresProps) => {
  const doTrecho = useMemo(() => lugaresDoTrecho(lugares, trechoId), [lugares, trechoId]);

  return (
    <>
      <CabecalhoLugares>
        <h3>
          Lugares salvos
          <span className="count">{doTrecho.length > 0 ? doTrecho.length : ""}</span>
        </h3>
      </CabecalhoLugares>
      {/* O id é o destino da rolagem depois de salvar um lugar. */}
      <Grade id={`lugares-${trechoId}`}>
        {carregando ? (
          <p className="empty-note">Carregando lugares…</p>
        ) : (
          <>
            {doTrecho.map((lugar) => (
              <CartaoLugar key={lugar.id} lugar={lugar} aoAbrir={(origem) => aoAbrir(lugar, origem)} />
            ))}
            <BotaoAdicionar type="button" onClick={(evento) => aoAdicionar(evento.currentTarget)}>
              <span>
                <span className="plus">+</span>
                Adicionar lugar em {tituloTrecho}
              </span>
            </BotaoAdicionar>
          </>
        )}
      </Grade>
    </>
  );
};
