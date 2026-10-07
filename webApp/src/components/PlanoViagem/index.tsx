"use client";

import React, { useEffect, useState } from "react";
import { ehTrechoId, IDS_TRECHOS, TrechoId } from "@/dados/trechos";
import { useChecklist, useLugares } from "@/hooks/useDadosViagem";
import { ILugar, ILugarInput } from "@/services/lugares/lugares.service";
import { movimentoReduzido } from "@/shared/components/useMovimentoReduzido";
import { useToast } from "@/shared/components/useToast";
import { Toast } from "@/utils/componentes/Toast";
import { Navegacao } from "@/components/Navegacao";
import { Hero } from "@/components/Hero";
import { Roteiro } from "@/components/Roteiro";
import { Hospedagem } from "@/components/Hospedagem";
import { Orcamento } from "@/components/Orcamento";
import { Checklist } from "@/components/Checklist";
import { Dicas } from "@/components/Dicas";
import { Rodape } from "@/components/Rodape";
import { VisualizadorLugar } from "@/components/Lugares/VisualizadorLugar";
import { FormularioLugar } from "@/components/Lugares/FormularioLugar";

// `origem` é o elemento clicado: a sobreposição abre "crescendo" a partir dele.
type VisualizadorEstado = { lugarId: string; origem: HTMLElement | null } | null;
type EditorEstado = { lugar?: ILugar; trecho: TrechoId; origem: HTMLElement | null } | null;

// Página inteira do plano: busca os dados, distribui para as seções e controla
// as duas sobreposições (ver um lugar e criar/editar um lugar).
export const PlanoViagem = () => {
  const { lugares, carregando, erro: erroLugares, criarLugar, atualizarLugar, deletarLugar } = useLugares();
  const { marcados, carregando: carregandoChecklist, erro: erroChecklist, alternarItem } = useChecklist();
  const { toast, mostrarToast } = useToast();

  const [visualizador, setVisualizador] = useState<VisualizadorEstado>(null);
  const [editor, setEditor] = useState<EditorEstado>(null);

  // Com a API fora do ar a página continua de pé (grades vazias); só avisa.
  const erroDeCarga = erroLugares ?? erroChecklist;
  useEffect(() => {
    if (erroDeCarga) mostrarToast(erroDeCarga);
  }, [erroDeCarga, mostrarToast]);

  // O visualizador mostra sempre a versão atual do lugar; se ele sumir numa
  // recarga (apagado em outro aparelho), a sobreposição sai junto.
  const lugarVisto = visualizador ? lugares.find((l) => l.id === visualizador.lugarId) : undefined;

  const salvarLugar = async (dados: ILugarInput, id?: string) => {
    if (id) await atualizarLugar(id, dados);
    else await criarLugar(dados);
  };

  // Depois de salvar, leva a pessoa até a grade do trecho onde o lugar ficou.
  const mostrarGradeDoTrecho = (trecho: TrechoId) => {
    window.setTimeout(() => {
      document.getElementById(`lugares-${trecho}`)?.scrollIntoView({ behavior: movimentoReduzido() ? "auto" : "smooth", block: "center" });
    }, 70);
  };

  const alternarChecklist = (itemId: string, marcado: boolean) => {
    alternarItem(itemId, marcado).catch((err) => {
      mostrarToast(err instanceof Error && err.message ? err.message : "Não foi possível salvar. Tente de novo.");
    });
  };

  return (
    <>
      <Navegacao />
      <Hero />
      <main>
        <Roteiro
          lugares={lugares}
          carregandoLugares={carregando}
          aoAbrirLugar={(lugar, origem) => setVisualizador({ lugarId: lugar.id, origem })}
          aoAdicionarLugar={(trecho, origem) => setEditor({ trecho, origem })}
        />
        <Hospedagem />
        <Orcamento />
        <Checklist marcados={marcados} aoAlternar={alternarChecklist} desabilitado={carregandoChecklist} />
        <Dicas />
      </main>
      <Rodape />

      {visualizador && lugarVisto && (
        <VisualizadorLugar
          key={lugarVisto.id}
          lugar={lugarVisto}
          origem={visualizador.origem}
          toast={toast}
          // Lugar de um trecho que saiu do roteiro: o formulário abre no primeiro trecho válido.
          aoEditar={(lugar) => setEditor({ lugar, trecho: ehTrechoId(lugar.trecho) ? lugar.trecho : IDS_TRECHOS[0], origem: null })}
          aoFechar={() => setVisualizador(null)}
        />
      )}

      {editor && (
        <FormularioLugar
          lugar={editor.lugar}
          trechoInicial={editor.trecho}
          origem={editor.origem}
          toast={toast}
          mostrarToast={mostrarToast}
          aoSalvar={salvarLugar}
          aoExcluir={deletarLugar}
          aoSalvo={mostrarGradeDoTrecho}
          aoFechar={() => setEditor(null)}
        />
      )}

      <Toast toast={toast} />
    </>
  );
};
