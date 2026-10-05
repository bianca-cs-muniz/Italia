"use client";

import React from "react";
import { ILugar } from "@/services/lugares/lugares.service";
import { urlDaFoto } from "@/services/fotos/fotos.service";
import { inicialDoNome, rotuloFotos } from "./regras";
import { Cartao, Marcador } from "./styles";

interface ICartaoLugarProps {
  lugar: ILugar;
  // Recebe o próprio cartão: o visualizador abre "crescendo" a partir dele.
  aoAbrir: (origem: HTMLElement) => void;
}

export const CartaoLugar = ({ lugar, aoAbrir }: ICartaoLugarProps) => {
  const capa = lugar.fotos[0];
  const selo = rotuloFotos(lugar.fotos.length);

  return (
    <Cartao type="button" onClick={(evento) => aoAbrir(evento.currentTarget)}>
      <span className="media">
        {capa ? (
          <>
            {/* Foto servida pela API (via rewrite): o otimizador de imagens do Next não se aplica. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlDaFoto(capa)} alt="" loading="lazy" />
            {selo && <span className="nimg">{selo}</span>}
          </>
        ) : (
          <Marcador className="tiles">
            <span>{inicialDoNome(lugar.nome)}</span>
          </Marcador>
        )}
      </span>
      <span className="pbody">
        <span className="tag" data-tipo={lugar.tipo}>
          {lugar.tipo || "Lugar"}
        </span>
        <span className="nome">{lugar.nome}</span>
        {lugar.resumo && <span className="resumo">{lugar.resumo}</span>}
        {lugar.preco && <span className="price">{lugar.preco}</span>}
      </span>
    </Cartao>
  );
};
