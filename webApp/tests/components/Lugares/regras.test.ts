import { describe, expect, it } from "vitest";
import {
  aceitarFotos,
  contarPorTrecho,
  destaquesParaTexto,
  inicialDoNome,
  lugaresDoTrecho,
  MAXIMO_DESTAQUES,
  MAXIMO_FOTOS,
  paragrafos,
  proximoIndice,
  rotuloFotos,
  TAMANHO_MAXIMO_DESTAQUE,
  textoParaDestaques,
  validarDestaques,
} from "@/components/Lugares/regras";
import type { ILugar } from "@/services/lugares/lugares.service";

const lugar = (dados: Partial<ILugar>): ILugar => ({
  id: "l1",
  trecho: "roma",
  tipo: "Atração",
  nome: "Coliseu",
  resumo: "",
  preco: "",
  link: "",
  descricao: "",
  destaques: [],
  fotos: [],
  criadoEm: "2026-01-01T10:00:00.000Z",
  atualizadoEm: "2026-01-01T10:00:00.000Z",
  ...dados,
});

const arquivo = (type: string, nome = "a") => ({ type, nome });

describe("limites espelhados da API", () => {
  it("deve permitir até 12 fotos, 20 destaques e 80 caracteres por destaque", () => {
    expect({ MAXIMO_FOTOS, MAXIMO_DESTAQUES, TAMANHO_MAXIMO_DESTAQUE }).toEqual({
      MAXIMO_FOTOS: 12,
      MAXIMO_DESTAQUES: 20,
      TAMANHO_MAXIMO_DESTAQUE: 80,
    });
  });
});

describe("lugaresDoTrecho", () => {
  it("deve devolver só os lugares do trecho pedido", () => {
    const lugares = [lugar({ id: "a", trecho: "roma" }), lugar({ id: "b", trecho: "veneza" }), lugar({ id: "c", trecho: "roma" })];

    expect(lugaresDoTrecho(lugares, "roma").map((l) => l.id)).toEqual(["a", "c"]);
  });

  it("deve ordenar do mais antigo para o mais novo", () => {
    const lugares = [
      lugar({ id: "novo", criadoEm: "2026-03-01T00:00:00.000Z" }),
      lugar({ id: "antigo", criadoEm: "2026-01-01T00:00:00.000Z" }),
      lugar({ id: "meio", criadoEm: "2026-02-01T00:00:00.000Z" }),
    ];

    expect(lugaresDoTrecho(lugares, "roma").map((l) => l.id)).toEqual(["antigo", "meio", "novo"]);
  });

  it("deve manter a ordem de chegada quando as datas são iguais", () => {
    const lugares = [lugar({ id: "primeiro" }), lugar({ id: "segundo" })];

    expect(lugaresDoTrecho(lugares, "roma").map((l) => l.id)).toEqual(["primeiro", "segundo"]);
  });

  it("não deve alterar a lista recebida", () => {
    const lugares = [lugar({ id: "novo", criadoEm: "2026-03-01T00:00:00.000Z" }), lugar({ id: "antigo", criadoEm: "2026-01-01T00:00:00.000Z" })];

    lugaresDoTrecho(lugares, "roma");

    expect(lugares.map((l) => l.id)).toEqual(["novo", "antigo"]);
  });

  it("deve devolver vazio quando o trecho não tem lugares", () => {
    expect(lugaresDoTrecho([lugar({ trecho: "roma" })], "amalfi")).toEqual([]);
  });

  it("deve devolver vazio quando não há lugares", () => {
    expect(lugaresDoTrecho([], "roma")).toEqual([]);
  });
});

describe("contarPorTrecho", () => {
  it("deve contar os lugares de cada trecho", () => {
    const lugares = [lugar({ trecho: "roma" }), lugar({ trecho: "veneza" }), lugar({ trecho: "roma" })];

    expect(contarPorTrecho(lugares)).toEqual({ roma: 2, veneza: 1 });
  });

  it("deve devolver um objeto vazio quando não há lugares", () => {
    expect(contarPorTrecho([])).toEqual({});
  });

  it("não deve listar trechos sem lugares", () => {
    expect(contarPorTrecho([lugar({ trecho: "norte" })]).roma).toBeUndefined();
  });
});

describe("textoParaDestaques", () => {
  it("deve transformar cada linha em um destaque", () => {
    expect(textoParaDestaques("4 hóspedes\nAr-condicionado\nTerraço")).toEqual(["4 hóspedes", "Ar-condicionado", "Terraço"]);
  });

  it("deve tirar os espaços das pontas de cada linha", () => {
    expect(textoParaDestaques("  Wi-Fi  \n\tTerraço ")).toEqual(["Wi-Fi", "Terraço"]);
  });

  it("deve descartar linhas vazias ou só com espaços", () => {
    expect(textoParaDestaques("Wi-Fi\n\n   \nTerraço\n")).toEqual(["Wi-Fi", "Terraço"]);
  });

  it("deve aceitar quebras de linha do Windows", () => {
    expect(textoParaDestaques("Wi-Fi\r\nTerraço")).toEqual(["Wi-Fi", "Terraço"]);
  });

  it("deve devolver vazio quando o texto é vazio", () => {
    expect(textoParaDestaques("")).toEqual([]);
  });
});

describe("destaquesParaTexto", () => {
  it("deve escrever um destaque por linha", () => {
    expect(destaquesParaTexto(["Wi-Fi", "Terraço"])).toBe("Wi-Fi\nTerraço");
  });

  it("deve devolver texto vazio quando não há destaques", () => {
    expect(destaquesParaTexto([])).toBe("");
  });

  it("deve voltar à mesma lista depois de ir a texto e voltar", () => {
    const destaques = ["4 hóspedes", "Ar-condicionado", "Terraço privativo"];

    expect(textoParaDestaques(destaquesParaTexto(destaques))).toEqual(destaques);
  });
});

describe("validarDestaques", () => {
  it("deve aceitar uma lista vazia", () => {
    expect(validarDestaques([])).toBeNull();
  });

  it("deve aceitar exatamente 20 destaques", () => {
    expect(validarDestaques(Array.from({ length: 20 }, (_, i) => `d${i}`))).toBeNull();
  });

  it("deve recusar 21 destaques com a mensagem do limite", () => {
    expect(validarDestaques(Array.from({ length: 21 }, (_, i) => `d${i}`))).toBe("Use no máximo 20 destaques.");
  });

  it("deve aceitar um destaque com exatamente 80 caracteres", () => {
    expect(validarDestaques(["a".repeat(80)])).toBeNull();
  });

  it("deve recusar um destaque com 81 caracteres com a mensagem do limite", () => {
    expect(validarDestaques(["curto", "a".repeat(81)])).toBe("Cada destaque pode ter até 80 caracteres.");
  });
});

describe("aceitarFotos", () => {
  it("deve aceitar todas as imagens quando cabem no limite", () => {
    const arquivos = [arquivo("image/jpeg", "a"), arquivo("image/png", "b")];

    expect(aceitarFotos(arquivos, 0)).toEqual(arquivos);
  });

  it("deve descartar o que não é imagem", () => {
    const arquivos = [arquivo("application/pdf", "pdf"), arquivo("image/webp", "foto"), arquivo("video/mp4", "video"), arquivo("", "sem-tipo")];

    expect(aceitarFotos(arquivos, 0).map((a) => a.nome)).toEqual(["foto"]);
  });

  it("deve aceitar só até completar 12 fotos", () => {
    const arquivos = Array.from({ length: 5 }, (_, i) => arquivo("image/jpeg", `f${i}`));

    expect(aceitarFotos(arquivos, 10).map((a) => a.nome)).toEqual(["f0", "f1"]);
  });

  it("deve aceitar exatamente 12 quando chegam 13 e não há nenhuma", () => {
    const arquivos = Array.from({ length: 13 }, () => arquivo("image/jpeg"));

    expect(aceitarFotos(arquivos, 0)).toHaveLength(12);
  });

  it("não deve aceitar nenhuma quando já há 12 fotos", () => {
    expect(aceitarFotos([arquivo("image/jpeg")], 12)).toEqual([]);
  });

  it("não deve aceitar nenhuma quando já há mais de 12 fotos", () => {
    expect(aceitarFotos([arquivo("image/jpeg")], 15)).toEqual([]);
  });

  it("não deve gastar vaga com arquivos que não são imagem", () => {
    const arquivos = [arquivo("text/plain", "txt"), arquivo("image/jpeg", "foto")];

    expect(aceitarFotos(arquivos, 11).map((a) => a.nome)).toEqual(["foto"]);
  });

  it("deve respeitar um máximo diferente quando informado", () => {
    const arquivos = Array.from({ length: 4 }, () => arquivo("image/jpeg"));

    expect(aceitarFotos(arquivos, 1, 3)).toHaveLength(2);
  });

  it("deve devolver vazio quando nenhum arquivo é escolhido", () => {
    expect(aceitarFotos([], 0)).toEqual([]);
  });
});

describe("paragrafos", () => {
  it("deve separar parágrafos por linha em branco", () => {
    expect(paragrafos("Primeiro\n\nSegundo")).toEqual([["Primeiro"], ["Segundo"]]);
  });

  it("deve manter as linhas de um mesmo parágrafo juntas", () => {
    expect(paragrafos("Linha 1\nLinha 2\n\nOutro")).toEqual([["Linha 1", "Linha 2"], ["Outro"]]);
  });

  it("deve tratar como uma separação só várias linhas em branco seguidas", () => {
    expect(paragrafos("A\n\n\n\nB")).toEqual([["A"], ["B"]]);
  });

  it("deve tratar como linha em branco uma linha só com espaços", () => {
    expect(paragrafos("A\n   \nB")).toEqual([["A"], ["B"]]);
  });

  it("deve ignorar linhas em branco no começo e no fim", () => {
    expect(paragrafos("\n\nA\n\n")).toEqual([["A"]]);
  });

  it("deve devolver vazio quando a descrição é vazia", () => {
    expect(paragrafos("")).toEqual([]);
  });

  it("deve devolver vazio quando a descrição só tem espaços e quebras", () => {
    expect(paragrafos("  \n\n  \n")).toEqual([]);
  });
});

describe("inicialDoNome", () => {
  it("deve devolver a primeira letra do nome", () => {
    expect(inicialDoNome("Coliseu")).toBe("C");
  });

  it("deve ignorar espaços no começo", () => {
    expect(inicialDoNome("   Pantheon")).toBe("P");
  });

  it("deve devolver a letra acentuada inteira", () => {
    expect(inicialDoNome("Ópera")).toBe("Ó");
  });

  it("não deve partir um emoji ao meio", () => {
    expect(inicialDoNome("🍕 Pizzaria")).toBe("🍕");
  });

  it('deve devolver "?" quando o nome é vazio', () => {
    expect(inicialDoNome("   ")).toBe("?");
  });
});

describe("proximoIndice", () => {
  it("deve avançar para a foto seguinte", () => {
    expect(proximoIndice(0, 1, 3)).toBe(1);
  });

  it("deve voltar para a foto anterior", () => {
    expect(proximoIndice(2, -1, 3)).toBe(1);
  });

  it("deve ir da última para a primeira ao avançar", () => {
    expect(proximoIndice(2, 1, 3)).toBe(0);
  });

  it("deve ir da primeira para a última ao voltar", () => {
    expect(proximoIndice(0, -1, 3)).toBe(2);
  });

  it("deve dar a volta quando o passo é maior que o total", () => {
    expect(proximoIndice(1, -7, 3)).toBe(0);
  });

  it("deve alternar entre as duas quando há só duas fotos", () => {
    expect(proximoIndice(1, 1, 2)).toBe(0);
  });

  it("deve ficar em 0 quando há uma foto só", () => {
    expect(proximoIndice(0, 1, 1)).toBe(0);
  });

  it("deve ficar em 0 quando não há fotos", () => {
    expect(proximoIndice(0, -1, 0)).toBe(0);
  });
});

describe("rotuloFotos", () => {
  it("deve mostrar a quantidade quando há mais de uma foto", () => {
    expect(rotuloFotos(2)).toBe("2 fotos");
  });

  it("não deve aparecer quando há uma foto só", () => {
    expect(rotuloFotos(1)).toBeNull();
  });

  it("não deve aparecer quando não há fotos", () => {
    expect(rotuloFotos(0)).toBeNull();
  });
});
