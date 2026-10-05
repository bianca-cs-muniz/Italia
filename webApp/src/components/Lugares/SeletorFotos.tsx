"use client";

import React, { useEffect, useRef, useState } from "react";
import { urlDaFoto } from "@/services/fotos/fotos.service";
import { AreaFotos } from "./styles";

// Foto no formulário: já salva na API (`id`), recém-escolhida (`arquivo` +
// `url` de pré-visualização) ou as duas coisas, logo depois do upload.
export interface IFotoFormulario {
  chave: string;
  id?: string;
  arquivo?: File;
  url?: string;
}

interface ISeletorFotosProps {
  fotos: IFotoFormulario[];
  // Recebe tudo o que foi escolhido ou solto; quem usa aplica o limite de 12.
  aoAdicionar: (arquivos: File[]) => void;
  aoRemover: (chave: string) => void;
  desabilitado?: boolean;
}

export const SeletorFotos = ({ fotos, aoAdicionar, aoRemover, desabilitado }: ISeletorFotosProps) => {
  const entrada = useRef<HTMLInputElement>(null);
  const [arrastandoSobre, setArrastandoSobre] = useState(false);

  // Desistir do seletor de arquivos dispara um `cancel` que borbulha; um
  // <dialog> acima entenderia como pedido para fechar. O React só escuta
  // `cancel` no próprio <dialog> (a prop onCancel nem existe para <input>),
  // por isso o ouvinte aqui é nativo.
  useEffect(() => {
    const campo = entrada.current;
    if (!campo) return;
    const conter = (evento: Event) => evento.stopPropagation();
    campo.addEventListener("cancel", conter);
    return () => campo.removeEventListener("cancel", conter);
  }, []);

  const escolher = () => {
    if (!desabilitado) entrada.current?.click();
  };

  return (
    <AreaFotos>
      <span className="rotulo">Fotos</span>
      <div
        className={arrastandoSobre ? "drop over" : "drop"}
        tabIndex={0}
        role="button"
        aria-disabled={desabilitado ? "true" : undefined}
        onClick={escolher}
        onKeyDown={(evento) => {
          if (evento.key === "Enter" || evento.key === " ") {
            evento.preventDefault();
            escolher();
          }
        }}
        onDragOver={(evento) => {
          evento.preventDefault();
          setArrastandoSobre(true);
        }}
        onDragLeave={() => setArrastandoSobre(false)}
        onDrop={(evento) => {
          evento.preventDefault();
          setArrastandoSobre(false);
          if (!desabilitado) aoAdicionar(Array.from(evento.dataTransfer.files));
        }}
      >
        Arraste imagens aqui ou clique para escolher
      </div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(evento) => {
          aoAdicionar(Array.from(evento.target.files ?? []));
          // Limpa para a mesma foto poder ser escolhida de novo depois de removida.
          evento.target.value = "";
        }}
      />
      <div className="thumbs">
        {fotos.map((foto, i) => {
          const src = foto.url ?? (foto.id ? urlDaFoto(foto.id) : undefined);
          return (
            <div key={foto.chave} className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {src && <img src={src} alt="" />}
              <button type="button" aria-label={`Remover foto ${i + 1}`} disabled={desabilitado} onClick={() => aoRemover(foto.chave)}>
                ×
              </button>
            </div>
          );
        })}
      </div>
    </AreaFotos>
  );
};
