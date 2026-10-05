"use client";

import React, { useId, useRef } from "react";
import { obterTrecho } from "@/dados/trechos";
import { ILugar } from "@/services/lugares/lugares.service";
import { IToast } from "@/shared/components/useToast";
import { IControleSobreposicao, Sobreposicao } from "@/utils/componentes/Sobreposicao";
import { linkSeguro } from "@/utils/link";
import { Galeria } from "./Galeria";
import { paragrafos } from "./regras";
import { Informacoes } from "./styles";

interface IVisualizadorLugarProps {
  lugar: ILugar;
  // Cartão que foi clicado.
  origem?: HTMLElement | null;
  // O aviso é desenhado dentro da sobreposição (ver Sobreposicao).
  toast: IToast | null;
  // Chamado depois que o visualizador terminou de fechar.
  aoEditar: (lugar: ILugar) => void;
  aoFechar: () => void;
}

export const VisualizadorLugar = ({ lugar, origem, toast, aoEditar, aoFechar }: IVisualizadorLugarProps) => {
  const controle = useRef<IControleSobreposicao>(null);
  const idTitulo = useId();
  const trecho = obterTrecho(lugar.trecho);
  const link = linkSeguro(lugar.link);
  const descricao = paragrafos(lugar.descricao);

  // Uma sobreposição por vez: a de edição só abre quando esta acabou de sair.
  const editar = async () => {
    await controle.current?.fechar();
    aoEditar(lugar);
  };

  return (
    <Sobreposicao ref={controle} idTitulo={idTitulo} origem={origem} toast={toast} aoFechar={aoFechar}>
      <Galeria fotos={lugar.fotos} nome={lugar.nome} />
      <Informacoes>
        <span className="tag" data-tipo={lugar.tipo}>
          {lugar.tipo || "Lugar"}
        </span>
        {trecho && (
          <p className="where">
            {trecho.subtitulo} · {trecho.dias}
          </p>
        )}
        <h2 id={idTitulo}>{lugar.nome}</h2>
        {lugar.resumo && <p className="summary">{lugar.resumo}</p>}
        {lugar.preco && (
          <div className="pricebox">
            <span>Preço</span>
            <b>{lugar.preco}</b>
          </div>
        )}
        {lugar.destaques.length > 0 && (
          <div className="dl">
            {lugar.destaques.map((destaque, i) => (
              <span key={`${i}-${destaque}`} className="chip">
                {destaque}
              </span>
            ))}
          </div>
        )}
        {/* Texto da pessoa sempre como texto: parágrafos e quebras de linha viram elementos, nunca HTML. */}
        {descricao.length > 0 && (
          <div className="desc">
            {descricao.map((linhas, i) => (
              <p key={i}>
                {linhas.map((linha, j) => (
                  <React.Fragment key={j}>
                    {j > 0 && <br />}
                    {linha}
                  </React.Fragment>
                ))}
              </p>
            ))}
          </div>
        )}
        <div className="actions">
          {link && (
            <a className="btn" href={link} target="_blank" rel="noopener noreferrer">
              Abrir link
            </a>
          )}
          <button type="button" className="btn ghost" onClick={editar}>
            Editar
          </button>
        </div>
      </Informacoes>
    </Sobreposicao>
  );
};
