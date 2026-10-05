import { vi } from "vitest";

// O jsdom não implementa showModal()/close() do <dialog>. Este substituto só
// liga/desliga o atributo `open` e dispara `close`, como o navegador faz; não
// há camada superior, foco preso nem ::backdrop. Devolve true se precisou
// instalar algum dos dois métodos.
export const instalarDialogo = (): boolean => {
  const prototipo = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
  let instalou = false;
  if (typeof prototipo.showModal !== "function") {
    instalou = true;
    prototipo.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute("open", "");
    };
  }
  if (typeof prototipo.close !== "function") {
    instalou = true;
    prototipo.close = function close(this: HTMLDialogElement) {
      if (!this.hasAttribute("open")) return;
      this.removeAttribute("open");
      this.dispatchEvent(new Event("close"));
    };
  }
  return instalou;
};

// O jsdom também não tem matchMedia. `reduzido` responde à consulta
// "(prefers-reduced-motion: reduce)".
export const simularMatchMedia = (reduzido: boolean) => {
  vi.stubGlobal(
    "matchMedia",
    vi.fn((consulta: string) => ({
      matches: reduzido,
      media: consulta,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
};
