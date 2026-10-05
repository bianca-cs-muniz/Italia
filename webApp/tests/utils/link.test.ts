import { describe, expect, it } from "vitest";
import { linkSeguro, normalizarLink } from "@/utils/link";

describe("normalizarLink", () => {
  it("deve acrescentar https:// quando o texto não tem protocolo", () => {
    expect(normalizarLink("exemplo.com/quarto")).toBe("https://exemplo.com/quarto");
  });

  it("deve manter o link quando já começa com https://", () => {
    expect(normalizarLink("https://exemplo.com")).toBe("https://exemplo.com");
  });

  it("deve manter o link quando já começa com http://", () => {
    expect(normalizarLink("http://exemplo.com")).toBe("http://exemplo.com");
  });

  it("deve reconhecer o protocolo quando está em maiúsculas", () => {
    expect(normalizarLink("HTTPS://exemplo.com")).toBe("HTTPS://exemplo.com");
  });

  it("deve tirar os espaços das pontas antes de normalizar", () => {
    expect(normalizarLink("  exemplo.com  ")).toBe("https://exemplo.com");
  });

  it("deve devolver vazio quando o texto é vazio", () => {
    expect(normalizarLink("")).toBe("");
  });

  it("deve devolver vazio quando o texto só tem espaços", () => {
    expect(normalizarLink("   ")).toBe("");
  });

  it("não deve produzir um link clicável quando o texto é um javascript:", () => {
    expect(linkSeguro(normalizarLink("javascript:alert(1)"))).toBeNull();
  });
});

describe("linkSeguro", () => {
  it("deve devolver o próprio link quando é https", () => {
    expect(linkSeguro("https://exemplo.com/a?b=1")).toBe("https://exemplo.com/a?b=1");
  });

  it("deve devolver o próprio link quando é http", () => {
    expect(linkSeguro("http://exemplo.com")).toBe("http://exemplo.com");
  });

  it.each([
    ["javascript:", "javascript:alert(1)"],
    ["javascript: em maiúsculas", "JavaScript:alert(1)"],
    ["javascript: com espaço na frente", " javascript:alert(1)"],
    ["data:", "data:text/html,<script>alert(1)</script>"],
    ["vbscript:", "vbscript:msgbox(1)"],
    ["file:", "file:///etc/passwd"],
    ["ftp:", "ftp://exemplo.com"],
    ["mailto:", "mailto:a@b.com"],
  ])("deve devolver null quando o protocolo é %s", (_nome, link) => {
    expect(linkSeguro(link)).toBeNull();
  });

  it("deve devolver null quando o texto não é uma URL", () => {
    expect(linkSeguro("exemplo.com")).toBeNull();
  });

  it("deve devolver null quando o link é vazio", () => {
    expect(linkSeguro("")).toBeNull();
  });

  it("deve devolver null quando o link é null", () => {
    expect(linkSeguro(null)).toBeNull();
  });

  it("deve devolver null quando o link é undefined", () => {
    expect(linkSeguro(undefined)).toBeNull();
  });
});
