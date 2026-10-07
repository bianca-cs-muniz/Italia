"use client";

import React, { useMemo } from "react";
import { ILugar } from "@/services/lugares/lugares.service";
import { CartaoLugar } from "./CartaoLugar";
import { lugaresForaDoRoteiro } from "./regras";
import { CabecalhoLugares, Grade } from "./styles";

interface IGradeForaDoRoteiroProps {
  // Todos os lugares; a grade mostra só os de trechos que não existem mais.
  lugares: ILugar[];
  carregando: boolean;
  aoAbrir: (lugar: ILugar, origem: HTMLElement) => void;
}

// Lugares salvos num trecho que saiu do roteiro: ficam à vista no fim, para
// serem movidos (pelo formulário de edição) ou apagados. Sem botão de
// adicionar; some quando não há nenhum.
export const GradeForaDoRoteiro = ({ lugares, carregando, aoAbrir }: IGradeForaDoRoteiroProps) => {
  const foraDoRoteiro = useMemo(() => lugaresForaDoRoteiro(lugares), [lugares]);

  if (carregando || foraDoRoteiro.length === 0) return null;

  return (
    <>
      <CabecalhoLugares>
        <h3>
          Lugares de trechos que saíram do roteiro
          <span className="count">{foraDoRoteiro.length}</span>
        </h3>
      </CabecalhoLugares>
      <Grade>
        <p className="empty-note">Abra um lugar e edite para movê-lo a um trecho atual, ou apague.</p>
        {foraDoRoteiro.map((lugar) => (
          <CartaoLugar key={lugar.id} lugar={lugar} aoAbrir={(origem) => aoAbrir(lugar, origem)} />
        ))}
      </Grade>
    </>
  );
};
