"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { ehTrechoId, TRECHOS_COM_LUGARES, TrechoId } from "@/dados/trechos";
import FotosService from "@/services/fotos/fotos.service";
import { ILugar, ILugarInput, TipoLugar, TIPOS_LUGAR } from "@/services/lugares/lugares.service";
import { IToast } from "@/shared/components/useToast";
import { IControleSobreposicao, Sobreposicao } from "@/utils/componentes/Sobreposicao";
import { comprimirImagem } from "@/utils/comprimirImagem";
import { normalizarLink } from "@/utils/link";
import { aceitarFotos, destaquesParaTexto, MAXIMO_FOTOS, textoParaDestaques, validarDestaques } from "./regras";
import { IFotoFormulario, SeletorFotos } from "./SeletorFotos";
import { Formulario } from "./styles";

const TIPO_PADRAO: TipoLugar = "Atração";

interface IFormularioLugarProps {
  // Ausente = lugar novo.
  lugar?: ILugar;
  // Trecho que vem selecionado num lugar novo (ou num lugar cujo trecho não existe mais).
  trechoInicial: TrechoId;
  // Botão "Adicionar lugar" que abriu o formulário.
  origem?: HTMLElement | null;
  // O aviso é desenhado dentro da sobreposição (ver Sobreposicao).
  toast: IToast | null;
  mostrarToast: (mensagem: string) => void;
  aoSalvar: (dados: ILugarInput, id?: string) => Promise<void>;
  aoExcluir: (id: string) => Promise<void>;
  // Chamado depois de salvar, com o formulário já fechado.
  aoSalvo: (trecho: TrechoId) => void;
  aoFechar: () => void;
}

let proximaChave = 0;
const novaChave = () => `foto-${(proximaChave += 1)}`;

const mensagemDeErro = (err: unknown) => (err instanceof Error && err.message ? err.message : "Não foi possível salvar. Tente de novo.");

export const FormularioLugar = ({ lugar, trechoInicial, origem, toast, mostrarToast, aoSalvar, aoExcluir, aoSalvo, aoFechar }: IFormularioLugarProps) => {
  const controle = useRef<IControleSobreposicao>(null);
  const campoNome = useRef<HTMLInputElement>(null);
  const idTitulo = useId();
  const idAvisoTrecho = useId();
  const trechoRemovido = lugar !== undefined && !ehTrechoId(lugar.trecho);

  // Um lugar antigo pode estar num trecho que saiu do roteiro: nesse caso o
  // formulário abre no trecho inicial, e é ele que vai para a API.
  const [trecho, setTrecho] = useState<TrechoId>(lugar && ehTrechoId(lugar.trecho) ? lugar.trecho : trechoInicial);
  const [tipo, setTipo] = useState<TipoLugar>(lugar?.tipo ?? TIPO_PADRAO);
  const [nome, setNome] = useState(lugar?.nome ?? "");
  const [resumo, setResumo] = useState(lugar?.resumo ?? "");
  const [preco, setPreco] = useState(lugar?.preco ?? "");
  const [link, setLink] = useState(lugar?.link ?? "");
  const [descricao, setDescricao] = useState(lugar?.descricao ?? "");
  const [destaques, setDestaques] = useState(destaquesParaTexto(lugar?.destaques ?? []));
  const [fotos, setFotos] = useState<IFotoFormulario[]>(() => (lugar?.fotos ?? []).map((id) => ({ chave: id, id })));
  const [salvando, setSalvando] = useState(false);
  // Excluir pede dois cliques: o primeiro só arma o botão.
  const [exclusaoArmada, setExclusaoArmada] = useState(false);

  // As pré-visualizações são URLs de objeto: precisam ser liberadas quando o
  // formulário sai de cena.
  const fotosAtuais = useRef(fotos);
  useEffect(() => {
    fotosAtuais.current = fotos;
  }, [fotos]);
  useEffect(() => {
    return () => {
      fotosAtuais.current.forEach((foto) => foto.url && URL.revokeObjectURL(foto.url));
    };
  }, []);

  const adicionarFotos = (arquivos: File[]) => {
    const aceitas = aceitarFotos(arquivos, fotos.length);
    // Sobrou imagem de fora: avisa em vez de ignorar em silêncio.
    if (aceitas.length < aceitarFotos(arquivos, 0, Infinity).length) mostrarToast(`Máximo de ${MAXIMO_FOTOS} fotos.`);
    if (aceitas.length === 0) return;
    // Chaves e URLs criadas aqui, fora do atualizador de estado (que precisa
    // ser puro: o React pode chamá-lo mais de uma vez).
    const novas: IFotoFormulario[] = aceitas.map((arquivo) => ({ chave: novaChave(), arquivo, url: URL.createObjectURL(arquivo) }));
    setFotos((prev) => [...prev, ...novas]);
  };

  const removerFoto = (chave: string) => {
    const removida = fotos.find((foto) => foto.chave === chave);
    if (removida?.url) URL.revokeObjectURL(removida.url);
    setFotos((prev) => prev.filter((foto) => foto.chave !== chave));
  };

  const enviar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    if (salvando) return;

    const nomeLimpo = nome.trim();
    if (!nomeLimpo) {
      campoNome.current?.focus();
      mostrarToast("Dê um nome ao lugar.");
      return;
    }
    const listaDestaques = textoParaDestaques(destaques);
    const problema = validarDestaques(listaDestaques);
    if (problema) {
      mostrarToast(problema);
      return;
    }

    setSalvando(true);
    try {
      // Fotos novas sobem primeiro (reduzidas no navegador); o lugar guarda só os ids.
      const ids: string[] = [];
      for (const foto of fotos) {
        if (foto.id) {
          ids.push(foto.id);
          continue;
        }
        if (!foto.arquivo) continue;
        const imagem = await comprimirImagem(foto.arquivo);
        const id = await FotosService.enviar(imagem);
        ids.push(id);
        // Guarda o id: se o salvamento falhar adiante, tentar de novo não reenvia a foto.
        setFotos((prev) => prev.map((f) => (f.chave === foto.chave ? { ...f, id } : f)));
      }

      // A API não tem valores padrão: todos os campos vão sempre.
      await aoSalvar(
        {
          trecho,
          tipo,
          nome: nomeLimpo,
          resumo: resumo.trim(),
          preco: preco.trim(),
          link: normalizarLink(link),
          descricao: descricao.trim(),
          destaques: listaDestaques,
          fotos: ids,
        },
        lugar?.id,
      );
      mostrarToast(lugar ? "Lugar atualizado." : "Lugar salvo.");
      await controle.current?.fechar();
      aoSalvo(trecho);
    } catch (err) {
      mostrarToast(mensagemDeErro(err));
      setSalvando(false);
    }
  };

  const excluir = async () => {
    if (!lugar || salvando) return;
    if (!exclusaoArmada) {
      setExclusaoArmada(true);
      return;
    }
    setSalvando(true);
    try {
      await aoExcluir(lugar.id);
      mostrarToast("Lugar excluído.");
      await controle.current?.fechar();
    } catch (err) {
      mostrarToast(mensagemDeErro(err));
      setSalvando(false);
    }
  };

  return (
    // Bloqueada enquanto grava: fechar no meio deixaria fotos enviadas sem lugar
    // e um aviso de "salvo" sem ninguém vendo o formulário.
    <Sobreposicao ref={controle} idTitulo={idTitulo} origem={origem} estreita bloqueada={salvando} toast={toast} aoFechar={aoFechar}>
      <Formulario
        onSubmit={enviar}
        noValidate
        // Soltar um arquivo fora da área de fotos faria o navegador abrir o arquivo no lugar da página.
        onDragOver={(evento) => evento.preventDefault()}
        onDrop={(evento) => evento.preventDefault()}
      >
        <h2 id={idTitulo}>{lugar ? "Editar lugar" : "Novo lugar"}</h2>
        <div className="row2">
          <div>
            <label className="f">
              Trecho da viagem
              <select
                value={trecho}
                aria-describedby={trechoRemovido ? idAvisoTrecho : undefined}
                onChange={(e) => {
                  if (ehTrechoId(e.target.value)) setTrecho(e.target.value);
                }}
              >
                {TRECHOS_COM_LUGARES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.titulo} — {t.subtitulo}
                  </option>
                ))}
              </select>
            </label>
            {/* Fora do label, para não entrar no nome do campo. */}
            {trechoRemovido && (
              <p id={idAvisoTrecho} className="aviso">
                Este lugar estava num trecho que saiu do roteiro. Escolha o novo trecho.
              </p>
            )}
          </div>
          <label className="f">
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoLugar)}>
              {TIPOS_LUGAR.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="f">
          Nome
          <input
            ref={campoNome}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            maxLength={120}
            placeholder="Ex.: Vatican Rooftop"
          />
        </label>
        <div className="row2">
          <label className="f">
            Resumo <small>uma frase</small>
            <input value={resumo} onChange={(e) => setResumo(e.target.value)} maxLength={200} placeholder="Ex.: Terraço com vista para São Pedro" />
          </label>
          <label className="f">
            Preço <small>opcional</small>
            <input value={preco} onChange={(e) => setPreco(e.target.value)} maxLength={80} placeholder="Ex.: R$ 3.871 (4 noites)" />
          </label>
        </div>
        <label className="f">
          Link
          <input type="url" value={link} onChange={(e) => setLink(e.target.value)} maxLength={500} placeholder="https://" />
        </label>
        <label className="f">
          Descrição
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            maxLength={5000}
            placeholder="Informações, observações, horários…"
          />
        </label>
        <label className="f">
          Destaques <small>um por linha (aparecem como etiquetas)</small>
          <textarea
            value={destaques}
            onChange={(e) => setDestaques(e.target.value)}
            rows={3}
            placeholder={"4 hóspedes\nAr-condicionado\nTerraço privativo"}
          />
        </label>
        <SeletorFotos fotos={fotos} aoAdicionar={adicionarFotos} aoRemover={removerFoto} desabilitado={salvando} />
        <div className="form-actions">
          <div>
            {lugar && (
              <button type="button" className="btn danger" onClick={excluir} disabled={salvando}>
                {exclusaoArmada ? "Confirmar exclusão" : "Excluir lugar"}
              </button>
            )}
          </div>
          <div className="principais">
            <button type="button" className="btn ghost" disabled={salvando} onClick={() => controle.current?.fechar()}>
              Cancelar
            </button>
            <button type="submit" className="btn" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar lugar"}
            </button>
          </div>
        </div>
      </Formulario>
    </Sobreposicao>
  );
};
