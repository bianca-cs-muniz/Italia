"use client";

import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { IToast } from "@/shared/components/useToast";
import { movimentoReduzido } from "@/shared/components/useMovimentoReduzido";
import { Toast } from "@/utils/componentes/Toast";
import { Dialogo, Folha } from "./styles";

// Tempo da animação de saída (a transição mais longa da folha é de .5s, mas
// aos 380ms ela já sumiu).
const DURACAO_SAIDA = 380;

export interface IControleSobreposicao {
  // Fecha com a animação de saída; a promessa resolve depois de `aoFechar`.
  // Vale mesmo com a sobreposição `bloqueada` (o bloqueio é só para a pessoa).
  fechar: () => Promise<void>;
}

interface ISobreposicaoProps {
  idTitulo: string;
  aoFechar: () => void;
  children: React.ReactNode;
  // Elemento que abriu a sobreposição: a folha "cresce" a partir dele.
  origem?: HTMLElement | null;
  // Folha estreita de uma coluna (formulário) em vez de galeria + informações.
  estreita?: boolean;
  // Enquanto for verdadeiro, a pessoa não consegue fechar (botão ×, Esc e
  // clique no fundo são ignorados): há uma gravação em andamento.
  bloqueada?: boolean;
  // O <dialog> modal fica na camada superior e deixa o resto da página inerte:
  // um aviso que precise aparecer com ele aberto tem de ser desenhado aqui dentro.
  toast?: IToast | null;
  ref?: React.Ref<IControleSobreposicao>;
}

// Diálogo nativo (<dialog>): foco preso, Esc, papel de "dialog" e a devolução
// do foco ao fechar já vêm do navegador. Quem usa monta o componente quando
// quer abrir e desmonta em `aoFechar`, que é chamado só depois da animação de
// saída (Esc, clique no fundo, botão de fechar ou `fechar()` pelo ref).
export const Sobreposicao = ({ idTitulo, aoFechar, children, origem, estreita, bloqueada, toast, ref }: ISobreposicaoProps) => {
  const dialogoRef = useRef<HTMLDialogElement>(null);
  const folhaRef = useRef<HTMLDivElement>(null);
  const temporizador = useRef<number | undefined>(undefined);
  const aguardando = useRef<(() => void)[]>([]);
  const pressionouNoFundo = useRef(false);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    const dialogo = dialogoRef.current;
    const folha = folhaRef.current;
    if (!dialogo || !folha) return;
    if (!dialogo.open) dialogo.showModal();

    // Só dá para medir depois do showModal(): antes o diálogo não tem caixa.
    if (origem) {
      const o = origem.getBoundingClientRect();
      const f = folha.getBoundingClientRect();
      folha.style.transformOrigin = `${o.left + o.width / 2 - f.left}px ${o.top + o.height / 2 - f.top}px`;
    }

    document.body.style.overflow = "hidden";

    // Dois quadros: o primeiro pinta o estado inicial, o segundo dispara a transição.
    let segundoQuadro = 0;
    const primeiroQuadro = requestAnimationFrame(() => {
      segundoQuadro = requestAnimationFrame(() => setAberta(true));
    });

    return () => {
      cancelAnimationFrame(primeiroQuadro);
      cancelAnimationFrame(segundoQuadro);
      window.clearTimeout(temporizador.current);
      temporizador.current = undefined;
      document.body.style.overflow = "";
    };
    // Só na abertura: `origem` não muda enquanto a sobreposição está montada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Único caminho de saída, com ou sem animação.
  const concluir = useCallback(() => {
    aoFechar();
    aguardando.current.splice(0).forEach((resolver) => resolver());
  }, [aoFechar]);

  const fechar = useCallback(
    () =>
      new Promise<void>((resolver) => {
        aguardando.current.push(resolver);
        if (temporizador.current !== undefined) return;
        setAberta(false);
        temporizador.current = window.setTimeout(
          () => {
            const dialogo = dialogoRef.current;
            if (dialogo?.open) dialogo.close();
            else concluir();
          },
          movimentoReduzido() ? 0 : DURACAO_SAIDA,
        );
      }),
    [concluir],
  );

  useImperativeHandle(ref, () => ({ fechar }), [fechar]);

  // Fechamentos pedidos pela pessoa (×, Esc, fundo) respeitam o bloqueio.
  const fecharPeloUsuario = () => {
    if (!bloqueada) fechar();
  };

  return (
    <Dialogo
      ref={dialogoRef}
      aria-labelledby={idTitulo}
      data-aberta={aberta ? "" : undefined}
      onClose={(evento) => {
        if (evento.target !== evento.currentTarget) return;
        // O navegador pode forçar o fechamento (Esc repetido) mesmo com o
        // `cancel` segurado. Bloqueada e sem um `fechar()` nosso em curso:
        // reabre em vez de sair no meio da gravação.
        if (bloqueada && temporizador.current === undefined) {
          evento.currentTarget.showModal();
          return;
        }
        concluir();
      }}
      onCancel={(evento) => {
        // `cancel` também vem de dentro: o <input type="file"> dispara um
        // quando a pessoa desiste do seletor de arquivos, e ele borbulha até aqui.
        if (evento.target !== evento.currentTarget) return;
        // Esc: segura o fechamento imediato do navegador para a folha sair animada.
        evento.preventDefault();
        fecharPeloUsuario();
      }}
      // O clique no fundo escurecido é entregue ao próprio <dialog>. Só vale se
      // o botão também foi pressionado no fundo (selecionar um texto e soltar
      // fora da folha não fecha).
      onPointerDown={(evento) => {
        pressionouNoFundo.current = evento.target === evento.currentTarget;
      }}
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && pressionouNoFundo.current) fecharPeloUsuario();
      }}
    >
      <Folha ref={folhaRef} data-estreita={estreita ? "" : undefined}>
        <button type="button" className="x" aria-label="Fechar" aria-disabled={bloqueada ? "true" : undefined} onClick={fecharPeloUsuario}>
          ×
        </button>
        {children}
      </Folha>
      {toast !== undefined && <Toast toast={toast} />}
    </Dialogo>
  );
};
