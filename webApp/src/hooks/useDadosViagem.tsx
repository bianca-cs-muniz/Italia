"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import LugaresService, { ILugar, ILugarInput } from "@/services/lugares/lugares.service";
import ChecklistService from "@/services/checklist/checklist.service";

// Sem tempo real: os dados são buscados de novo quando a pessoa volta para a
// aba (outra pessoa da família pode ter salvo algo nesse meio-tempo).
const aoVoltarParaAAba = (recarregar: () => void) => {
  const aoMudarVisibilidade = () => {
    if (document.visibilityState === "visible") recarregar();
  };
  window.addEventListener("focus", recarregar);
  document.addEventListener("visibilitychange", aoMudarVisibilidade);
  return () => {
    window.removeEventListener("focus", recarregar);
    document.removeEventListener("visibilitychange", aoMudarVisibilidade);
  };
};

export const useLugares = () => {
  const [lugares, setLugares] = useState<ILugar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Sobe a cada gravação: uma listagem pedida antes de uma gravação terminar
  // pode chegar depois dela, já velha, e é descartada.
  const versao = useRef(0);

  useEffect(() => {
    let ativo = true;
    // Evita buscas empilhadas: voltar para a aba dispara `focus` e `visibilitychange` juntos.
    let buscando = false;

    const buscar = (inicial: boolean) => {
      if (buscando) return;
      buscando = true;
      const versaoAoPedir = versao.current;
      let descartada = false;
      LugaresService.listar()
        .then((lista) => {
          if (!ativo) return;
          if (versao.current !== versaoAoPedir) {
            descartada = true;
            return;
          }
          setLugares(lista);
          setErro(null);
        })
        .catch(() => {
          // Falha ao recarregar em segundo plano não apaga o que já está na tela.
          if (ativo && inicial) setErro("Não foi possível carregar os lugares.");
        })
        .finally(() => {
          buscando = false;
          if (!ativo) return;
          // Resposta velha jogada fora: busca de novo para não ficar sem dados.
          if (descartada) buscar(inicial);
          else setCarregando(false);
        });
    };

    buscar(true);
    const parar = aoVoltarParaAAba(() => buscar(false));
    return () => {
      ativo = false;
      parar();
    };
  }, []);

  const criarLugar = useCallback(async (data: ILugarInput) => {
    const criado = await LugaresService.criar(data);
    versao.current += 1;
    // Uma recarga (ao voltar para a aba) pode já ter trazido o lugar novo.
    setLugares((prev) => (prev.some((l) => l.id === criado.id) ? prev.map((l) => (l.id === criado.id ? criado : l)) : [...prev, criado]));
    return criado;
  }, []);

  const atualizarLugar = useCallback(async (id: string, data: ILugarInput) => {
    const atualizado = await LugaresService.atualizar(id, data);
    versao.current += 1;
    setLugares((prev) => prev.map((l) => (l.id === id ? atualizado : l)));
    return atualizado;
  }, []);

  const deletarLugar = useCallback(async (id: string) => {
    await LugaresService.deletar(id);
    versao.current += 1;
    setLugares((prev) => prev.filter((l) => l.id !== id));
  }, []);

  return { lugares, carregando, erro, criarLugar, atualizarLugar, deletarLugar };
};

export const useChecklist = () => {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  // Sobe quando uma marcação sai e quando ela volta do servidor: uma lista
  // pedida nesse intervalo pode estar velha e é descartada.
  const versao = useRef(0);
  // Marcações ainda a caminho do servidor.
  const gravando = useRef(0);
  // Número do clique mais recente de cada item: só a resposta dele conta.
  const cliques = useRef<Record<string, number>>({});
  // Uma lista foi descartada (ou uma marcação falhou) e é preciso buscar de
  // novo assim que não houver gravação em curso.
  const recargaPendente = useRef(false);
  const recarregar = useRef<() => void>(() => {});

  useEffect(() => {
    let ativo = true;
    let buscando = false;

    const buscar = (inicial: boolean) => {
      if (buscando) return;
      // Com marcação em curso a resposta seria descartada de qualquer jeito.
      if (gravando.current > 0) {
        recargaPendente.current = true;
        return;
      }
      buscando = true;
      recargaPendente.current = false;
      const versaoAoPedir = versao.current;
      let descartada = false;
      ChecklistService.obter()
        .then((lista) => {
          if (!ativo) return;
          if (versao.current !== versaoAoPedir) {
            descartada = true;
            return;
          }
          setMarcados(lista);
          setErro(null);
        })
        .catch(() => {
          if (ativo && inicial) setErro("Não foi possível carregar o checklist.");
        })
        .finally(() => {
          buscando = false;
          if (!ativo) return;
          // Se ainda há gravação, a nova busca fica marcada e sai quando ela terminar.
          if (descartada || recargaPendente.current) buscar(inicial);
          else setCarregando(false);
        });
    };

    recarregar.current = () => buscar(false);
    buscar(true);
    const parar = aoVoltarParaAAba(() => buscar(false));
    return () => {
      ativo = false;
      recarregar.current = () => {};
      parar();
    };
  }, []);

  // O item muda na hora (atualização otimista) e volta atrás se o servidor
  // recusar; o erro segue para quem chamou avisar a pessoa.
  const alternarItem = useCallback(async (itemId: string, marcado: boolean) => {
    const aplicar = (id: string, valor: boolean) =>
      setMarcados((prev) => {
        const semItem = prev.filter((m) => m !== id);
        return valor ? [...semItem, id] : semItem;
      });

    const clique = (cliques.current[itemId] ?? 0) + 1;
    cliques.current[itemId] = clique;
    // Cliques rápidos no mesmo item: a resposta de um clique antigo não pode
    // passar por cima do mais novo.
    const ehOMaisRecente = () => cliques.current[itemId] === clique;

    aplicar(itemId, marcado);
    versao.current += 1;
    gravando.current += 1;
    try {
      const salvo = await ChecklistService.marcar(itemId, marcado);
      if (ehOMaisRecente()) aplicar(salvo.itemId, salvo.marcado);
    } catch (err) {
      // Depois de uma falha o estado do servidor é incerto: confere com ele.
      recargaPendente.current = true;
      if (ehOMaisRecente()) {
        aplicar(itemId, !marcado);
        throw err;
      }
    } finally {
      versao.current += 1;
      gravando.current -= 1;
      if (gravando.current === 0 && recargaPendente.current) recarregar.current();
    }
  }, []);

  return { marcados, carregando, erro, alternarItem };
};
