"use client";

import React from "react";
import { ehTrechoId, ITrecho, TrechoId } from "@/dados/trechos";
import { ILugar } from "@/services/lugares/lugares.service";
import { classeRevelar, useRevelar } from "@/shared/components/useRevelar";
import { GradeLugares } from "@/components/Lugares/GradeLugares";
import { textoNoites } from "./regras";
import { ArtigoCapitulo } from "./styles";

interface ICapituloProps {
  trecho: ITrecho;
  // Todos os lugares salvos; a grade filtra os deste trecho.
  lugares: ILugar[];
  carregandoLugares: boolean;
  aoAbrirLugar: (lugar: ILugar, origem: HTMLElement) => void;
  aoAdicionarLugar: (trecho: TrechoId, origem: HTMLElement) => void;
}

export const Capitulo = ({ trecho, lugares, carregandoLugares, aoAbrirLugar, aoAdicionarLugar }: ICapituloProps) => {
  const { ref, visivel } = useRevelar<HTMLElement>();
  const trechoId = trecho.id;

  return (
    // O id `ch-...` é o destino dos cliques no mapa do hero.
    <ArtigoCapitulo ref={ref} id={`ch-${trecho.id}`} className={classeRevelar(visivel)}>
      <div className="ch-side">
        <span className="ch-days">{trecho.dias}</span>
        <h3 className="ch-title">{trecho.titulo}</h3>
        <p className="ch-sub">{trecho.subtitulo}</p>
        {trecho.base ? (
          <div className="ch-base">
            <b>
              Base: {trecho.base}
              {trecho.noites !== undefined && ` · ${textoNoites(trecho.noites)}`}
            </b>
            <br />
            {trecho.estadia}
          </div>
        ) : (
          <div className="ch-base">Ajuste conforme os horários dos voos.</div>
        )}
      </div>
      <div>
        <ol className="days">
          {trecho.itens.map((item) => (
            <li key={item.dia} className="day">
              <div className="day-n">
                <small>Dia</small>
                {item.dia}
              </div>
              <div>
                <h3>{item.titulo}</h3>
                <div className="chips">
                  {item.paradas.map((parada) => (
                    <span key={parada} className="chip">
                      {parada}
                    </span>
                  ))}
                </div>
                {item.nota && <p className="note">{item.nota}</p>}
              </div>
            </li>
          ))}
        </ol>
        {/* O retorno não tem lugares para salvar. */}
        {ehTrechoId(trechoId) && (
          <GradeLugares
            trechoId={trechoId}
            tituloTrecho={trecho.titulo}
            lugares={lugares}
            carregando={carregandoLugares}
            aoAbrir={aoAbrirLugar}
            aoAdicionar={(origem) => aoAdicionarLugar(trechoId, origem)}
          />
        )}
      </div>
    </ArtigoCapitulo>
  );
};
