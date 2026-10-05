// @vitest-environment jsdom
import { createRef } from "react";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { type IControleSobreposicao, Sobreposicao } from "@/utils/componentes/Sobreposicao";
import { instalarDialogo, simularMatchMedia } from "../../apoio/dom";

// ATENÇÃO: o jsdom não implementa showModal()/close(); `instalarDialogo` põe
// um substituto mínimo (atributo `open` + evento `close`). O que se testa aqui
// é a reação do componente aos eventos, não o <dialog> do navegador.
beforeAll(() => {
  instalarDialogo();
});

beforeEach(() => {
  vi.useFakeTimers();
  simularMatchMedia(false);
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const montar = (props: { bloqueada?: boolean } = {}) => {
  const aoFechar = vi.fn();
  const controle = createRef<IControleSobreposicao>();
  const tela = render(
    <Sobreposicao idTitulo="titulo" aoFechar={aoFechar} ref={controle} {...props}>
      <h2 id="titulo">Novo lugar</h2>
      <input type="file" data-testid="arquivo" />
    </Sobreposicao>,
  );
  const dialogo = tela.baseElement.querySelector("dialog");
  if (!dialogo) throw new Error("O <dialog> não foi renderizado.");
  const botaoFechar = tela.getByLabelText("Fechar");
  const titulo = tela.getByText("Novo lugar");
  const arquivo = tela.getByTestId("arquivo");
  return { ...tela, aoFechar, controle, dialogo, botaoFechar, titulo, arquivo };
};

// Deixa passar com folga o tempo da animação de saída.
const esperarAnimacao = () => {
  act(() => {
    vi.advanceTimersByTime(2000);
  });
};

// Esc no navegador = evento `cancel` (cancelável) no próprio <dialog>.
const dispararCancel = (alvo: Element) => {
  const evento = new Event("cancel", { bubbles: true, cancelable: true });
  act(() => {
    alvo.dispatchEvent(evento);
  });
  return evento;
};

const clicarNoFundo = (dialogo: HTMLDialogElement) => {
  fireEvent.pointerDown(dialogo);
  fireEvent.click(dialogo);
};

describe("Sobreposicao: abertura", () => {
  it("deve abrir o diálogo ao montar", () => {
    const { dialogo } = montar();

    expect(dialogo.hasAttribute("open")).toBe(true);
  });

  it("deve ligar o diálogo ao título pelo aria-labelledby", () => {
    const { dialogo } = montar();

    expect(dialogo.getAttribute("aria-labelledby")).toBe("titulo");
  });

  it("deve travar a rolagem da página enquanto está aberta", () => {
    montar();

    expect(document.body.style.overflow).toBe("hidden");
  });

  it("deve devolver a rolagem da página ao desmontar", () => {
    const { unmount } = montar();

    unmount();

    expect(document.body.style.overflow).toBe("");
  });
});

describe("Sobreposicao: fechamento pela pessoa", () => {
  it("deve fechar pelo botão × depois da animação de saída", () => {
    const { botaoFechar, aoFechar } = montar();

    fireEvent.click(botaoFechar);
    const chamadasAntesDaAnimacao = aoFechar.mock.calls.length;
    esperarAnimacao();

    expect(chamadasAntesDaAnimacao).toBe(0);
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("deve fechar sem esperar a animação quando a pessoa pede movimento reduzido", () => {
    simularMatchMedia(true);
    const { botaoFechar, aoFechar } = montar();

    fireEvent.click(botaoFechar);
    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("deve fechar com Esc (cancel no próprio diálogo)", () => {
    const { dialogo, aoFechar } = montar();

    dispararCancel(dialogo);
    esperarAnimacao();

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("deve segurar o fechamento imediato do navegador no Esc, para a folha sair animada", () => {
    const { dialogo } = montar();

    const evento = dispararCancel(dialogo);

    expect(evento.defaultPrevented).toBe(true);
  });

  it("deve fechar com clique no fundo escurecido", () => {
    const { dialogo, aoFechar } = montar();

    clicarNoFundo(dialogo);
    esperarAnimacao();

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("não deve fechar com clique dentro da folha", () => {
    const { titulo, aoFechar } = montar();

    fireEvent.pointerDown(titulo);
    fireEvent.click(titulo);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("não deve fechar quando o botão foi pressionado na folha e solto no fundo", () => {
    const { dialogo, titulo, aoFechar } = montar();

    fireEvent.pointerDown(titulo);
    fireEvent.click(dialogo);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("deve chamar aoFechar uma vez só quando a pessoa clica várias vezes em fechar", () => {
    const { botaoFechar, dialogo, aoFechar } = montar();

    fireEvent.click(botaoFechar);
    fireEvent.click(botaoFechar);
    dispararCancel(dialogo);
    esperarAnimacao();

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});

describe("Sobreposicao: cancel vindo de um filho", () => {
  it("não deve fechar quando o cancel vem do seletor de arquivos", () => {
    const { arquivo, aoFechar } = montar();

    dispararCancel(arquivo);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("deve continuar aberta depois do cancel de um filho", () => {
    const { arquivo, dialogo } = montar();

    dispararCancel(arquivo);
    esperarAnimacao();

    expect(dialogo.hasAttribute("open")).toBe(true);
  });

  it("não deve interferir no evento cancel do filho", () => {
    const { arquivo } = montar();

    const evento = dispararCancel(arquivo);

    expect(evento.defaultPrevented).toBe(false);
  });

  it("não deve fechar quando um close vem de um filho", () => {
    const { arquivo, aoFechar } = montar();

    act(() => {
      arquivo.dispatchEvent(new Event("close", { bubbles: true }));
    });
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });
});

describe("Sobreposicao: bloqueada", () => {
  it("deve ignorar o botão ×", () => {
    const { botaoFechar, aoFechar } = montar({ bloqueada: true });

    fireEvent.click(botaoFechar);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("deve marcar o botão × como desabilitado para leitores de tela", () => {
    const { botaoFechar } = montar({ bloqueada: true });

    expect(botaoFechar.getAttribute("aria-disabled")).toBe("true");
  });

  it("deve ignorar o Esc", () => {
    const { dialogo, aoFechar } = montar({ bloqueada: true });

    dispararCancel(dialogo);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("deve impedir que o navegador feche sozinho no Esc", () => {
    const { dialogo } = montar({ bloqueada: true });

    const evento = dispararCancel(dialogo);

    expect(evento.defaultPrevented).toBe(true);
  });

  it("deve ignorar o clique no fundo", () => {
    const { dialogo, aoFechar } = montar({ bloqueada: true });

    clicarNoFundo(dialogo);
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
  });

  it("deve continuar aberta depois das tentativas de fechar", () => {
    const { dialogo, botaoFechar } = montar({ bloqueada: true });

    fireEvent.click(botaoFechar);
    dispararCancel(dialogo);
    clicarNoFundo(dialogo);
    esperarAnimacao();

    expect(dialogo.hasAttribute("open")).toBe(true);
  });

  it("deve reabrir, sem chamar aoFechar, quando o navegador força o fechamento", () => {
    const { dialogo, aoFechar } = montar({ bloqueada: true });

    // Esc repetido: o navegador fecha o <dialog> mesmo com o cancel segurado.
    act(() => {
      dialogo.close();
    });
    esperarAnimacao();

    expect(aoFechar).not.toHaveBeenCalled();
    expect(dialogo.hasAttribute("open")).toBe(true);
  });

  it("deve fechar mesmo bloqueada quando o fechamento vem do código (ref.fechar)", async () => {
    const { controle, aoFechar } = montar({ bloqueada: true });

    let fechamento!: Promise<void>;
    act(() => {
      fechamento = controle.current!.fechar();
    });
    esperarAnimacao();

    await expect(fechamento).resolves.toBeUndefined();
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });

  it("deve voltar a aceitar o fechamento quando o bloqueio termina", () => {
    const { rerender, aoFechar, getByLabelText } = montar({ bloqueada: true });
    rerender(
      <Sobreposicao idTitulo="titulo" aoFechar={aoFechar}>
        <h2 id="titulo">Novo lugar</h2>
      </Sobreposicao>,
    );

    fireEvent.click(getByLabelText("Fechar"));
    esperarAnimacao();

    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});

describe("Sobreposicao: fechar() pelo ref", () => {
  it("deve resolver a promessa só depois de chamar aoFechar", async () => {
    const { controle, aoFechar } = montar();
    const ordem: string[] = [];
    aoFechar.mockImplementation(() => ordem.push("aoFechar"));

    let fechamento!: Promise<void>;
    act(() => {
      fechamento = controle.current!.fechar().then(() => {
        ordem.push("promessa");
      });
    });
    esperarAnimacao();
    await fechamento;

    expect(ordem).toEqual(["aoFechar", "promessa"]);
  });

  it("deve resolver todas as promessas e chamar aoFechar uma vez quando fechar() é chamado duas vezes", async () => {
    const { controle, aoFechar } = montar();

    let fechamentos!: Promise<void[]>;
    act(() => {
      fechamentos = Promise.all([controle.current!.fechar(), controle.current!.fechar()]);
    });
    esperarAnimacao();

    await expect(fechamentos).resolves.toHaveLength(2);
    expect(aoFechar).toHaveBeenCalledTimes(1);
  });
});

describe("Sobreposicao: aviso", () => {
  it("deve mostrar o aviso dentro do diálogo quando recebe um toast", () => {
    const aoFechar = vi.fn();
    const { baseElement } = render(
      <Sobreposicao idTitulo="titulo" aoFechar={aoFechar} toast={{ mensagem: "Lugar salvo.", chave: 1 }}>
        <h2 id="titulo">Novo lugar</h2>
      </Sobreposicao>,
    );

    expect(baseElement.querySelector('dialog [role="status"]')?.textContent).toBe("Lugar salvo.");
  });

  it("não deve desenhar a região de aviso quando a prop toast não é usada", () => {
    const { dialogo } = montar();

    expect(dialogo.querySelector('[role="status"]')).toBeNull();
  });
});
