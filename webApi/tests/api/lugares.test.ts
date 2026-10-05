import { randomUUID } from "node:crypto";
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { banco } from "../apoio/prisma-em-memoria";
import { UUID_INEXISTENTE, criarLugar, enviarFoto, lugarValido } from "../apoio/fabricas";

const CAMPOS_DA_RESPOSTA = [
  "id",
  "trecho",
  "tipo",
  "nome",
  "resumo",
  "preco",
  "link",
  "descricao",
  "destaques",
  "fotos",
  "criadoEm",
  "atualizadoEm",
];

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function uuids(quantos: number) {
  return Array.from({ length: quantos }, () => randomUUID());
}

describe("POST /api/lugares", () => {
  it("deve responder 201 com o lugar criado", async () => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido());

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject(lugarValido());
    expect(resposta.body.id).toMatch(UUID);
  });

  it("deve devolver exatamente os campos do contrato, com datas em ISO", async () => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido());

    expect(Object.keys(resposta.body).sort()).toEqual([...CAMPOS_DA_RESPOSTA].sort());
    expect(new Date(resposta.body.criadoEm).toISOString()).toBe(resposta.body.criadoEm);
    expect(new Date(resposta.body.atualizadoEm).toISOString()).toBe(resposta.body.atualizadoEm);
  });

  it("deve fazer o lugar criado aparecer em GET /api/lugares", async () => {
    const criado = await criarLugar(app);

    const lista = await request(app).get("/api/lugares");

    expect(lista.body).toEqual([criado]);
  });

  it("deve aceitar os campos opcionais de texto vazios e as listas vazias", async () => {
    const corpo = lugarValido({ resumo: "", preco: "", link: "", descricao: "", destaques: [], fotos: [] });

    const resposta = await request(app).post("/api/lugares").send(corpo);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toMatchObject(corpo);
  });

  it("deve tirar os espaços das pontas dos textos", async () => {
    const corpo = lugarValido({ nome: "  Trattoria Da Enzo  ", resumo: " bom ", destaques: ["  massa fresca  "] });

    const resposta = await request(app).post("/api/lugares").send(corpo);

    expect(resposta.body).toMatchObject({ nome: "Trattoria Da Enzo", resumo: "bom", destaques: ["massa fresca"] });
  });

  it("deve ignorar campos que não fazem parte do contrato (id, criadoEm...)", async () => {
    const corpo = { ...lugarValido(), id: UUID_INEXISTENTE, criadoEm: "2000-01-01T00:00:00.000Z", admin: true };

    const resposta = await request(app).post("/api/lugares").send(corpo);

    expect(resposta.status).toBe(201);
    expect(resposta.body.id).not.toBe(UUID_INEXISTENTE);
    expect(resposta.body.criadoEm).not.toBe("2000-01-01T00:00:00.000Z");
    expect(resposta.body).not.toHaveProperty("admin");
  });

  it.each(["roma", "toscana", "cinque", "veneza", "norte", "napoles", "amalfi"])(
    "deve aceitar o trecho %s",
    async (trecho) => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido({ trecho }));

      expect(resposta.status).toBe(201);
    },
  );

  it.each(["Hospedagem", "Atração", "Restaurante", "Experiência", "Outro"])("deve aceitar o tipo %s", async (tipo) => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido({ tipo }));

    expect(resposta.status).toBe(201);
  });

  describe("valores no limite (aceitos)", () => {
    it.each([
      ["nome com 1 caractere", { nome: "A" }],
      ["nome com 120 caracteres", { nome: "n".repeat(120) }],
      ["resumo com 200 caracteres", { resumo: "r".repeat(200) }],
      ["preco com 80 caracteres", { preco: "p".repeat(80) }],
      ["link com 500 caracteres", { link: `https://exemplo.com/${"a".repeat(480)}` }],
      ["descricao com 5.000 caracteres", { descricao: "d".repeat(5000) }],
      ["20 destaques", { destaques: Array.from({ length: 20 }, (_, i) => `destaque ${i}`) }],
      ["destaque com 80 caracteres", { destaques: ["x".repeat(80)] }],
      ["nome com 120 caracteres depois de tirar os espaços das pontas", { nome: `  ${"n".repeat(120)}  ` }],
    ])("deve aceitar %s", async (_caso, campos) => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido(campos));

      expect(resposta.status).toBe(201);
    });
  });

  describe("entrada inválida → 400 e nada é gravado", () => {
    it.each([
      ["trecho fora da lista", { trecho: "sicilia" }, "trecho: Trecho inválido."],
      ["trecho com maiúscula", { trecho: "Roma" }, "trecho: Trecho inválido."],
      ["tipo fora da lista", { tipo: "Museu" }, "tipo: Tipo inválido."],
      ["tipo sem acento", { tipo: "Atracao" }, "tipo: Tipo inválido."],
      ["nome vazio", { nome: "" }, "nome: Informe o nome do lugar."],
      ["nome só com espaços", { nome: "   " }, "nome: Informe o nome do lugar."],
      ["nome com 121 caracteres", { nome: "n".repeat(121) }, "nome: O nome pode ter no máximo 120 caracteres."],
      ["resumo com 201 caracteres", { resumo: "r".repeat(201) }, "resumo: O resumo pode ter no máximo 200 caracteres."],
      ["preco com 81 caracteres", { preco: "p".repeat(81) }, "preco: O preço pode ter no máximo 80 caracteres."],
      [
        "link com 501 caracteres",
        { link: `https://exemplo.com/${"a".repeat(481)}` },
        "link: O link pode ter no máximo 500 caracteres.",
      ],
      [
        "descricao com 5.001 caracteres",
        { descricao: "d".repeat(5001) },
        "descricao: A descrição pode ter no máximo 5.000 caracteres.",
      ],
      [
        "21 destaques",
        { destaques: Array.from({ length: 21 }, (_, i) => `destaque ${i}`) },
        "destaques: Um lugar pode ter no máximo 20 destaques.",
      ],
      [
        "destaque com 81 caracteres",
        { destaques: ["ok", "x".repeat(81)] },
        "destaques.1: Cada destaque pode ter no máximo 80 caracteres.",
      ],
      ["destaque vazio", { destaques: [""] }, "destaques.0: Destaque vazio."],
      ["destaque só com espaços", { destaques: ["   "] }, "destaques.0: Destaque vazio."],
      ["13 fotos", { fotos: uuids(13) }, "fotos: Um lugar pode ter no máximo 12 fotos."],
      ["foto que não é uuid", { fotos: ["foto-1"] }, "fotos.0: Foto inválida."],
    ])("deve recusar %s", async (_caso, campos, mensagem) => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido(campos));

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ error: mensagem });
      expect(banco.lugares()).toHaveLength(0);
    });

    it("deve recusar a mesma foto citada duas vezes", async () => {
      const foto = await enviarFoto(app);

      const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [foto, foto] }));

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ error: "fotos: A mesma foto não pode aparecer duas vezes." });
      expect(banco.lugares()).toHaveLength(0);
    });

    it("deve recusar a mesma foto citada com maiúsculas e com minúsculas", async () => {
      const foto = await enviarFoto(app);

      const resposta = await request(app)
        .post("/api/lugares")
        .send(lugarValido({ fotos: [foto.toLowerCase(), foto.toUpperCase()] }));

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ error: "fotos: A mesma foto não pode aparecer duas vezes." });
      expect(banco.lugares()).toHaveLength(0);
    });

    it.each([
      ["nome", { nome: "Hotel\u0000Roma" }],
      ["resumo", { resumo: "perto\u0000" }],
      ["preco", { preco: "\u0000€ 10" }],
      ["link", { link: "https://exemplo.com/\u0000" }],
      ["descricao", { descricao: "linha\u0000linha" }],
      ["destaques", { destaques: ["ok", "ru\u0000im"] }],
    ])("deve recusar o byte NUL em %s (o Postgres não aceita e viraria erro 500)", async (campo, campos) => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido(campos));

      expect(resposta.status).toBe(400);
      expect(resposta.body.error).toContain(campo);
      expect(resposta.body.error).toContain("O texto contém um caractere inválido.");
      expect(banco.lugares()).toHaveLength(0);
    });

    it.each(["trecho", "tipo", "nome", "resumo", "preco", "link", "descricao", "destaques", "fotos"])(
      "deve recusar o corpo sem o campo obrigatório %s",
      async (campo) => {
        const corpo: Record<string, unknown> = lugarValido();
        delete corpo[campo];

        const resposta = await request(app).post("/api/lugares").send(corpo);

        expect(resposta.status).toBe(400);
        expect(resposta.body.error).toMatch(new RegExp(`^${campo}: `));
        expect(banco.lugares()).toHaveLength(0);
      },
    );

    it.each([
      ["nome numérico", { nome: 123 }],
      ["nome nulo", { nome: null }],
      ["destaques como texto", { destaques: "wifi" }],
      ["destaque numérico", { destaques: [1] }],
      ["fotos nulo", { fotos: null }],
      ["fotos como objeto", { fotos: { 0: UUID_INEXISTENTE } }],
    ])("deve recusar %s", async (_caso, campos) => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido(campos));

      expect(resposta.status).toBe(400);
      expect(typeof resposta.body.error).toBe("string");
      expect(banco.lugares()).toHaveLength(0);
    });

    it("deve juntar as mensagens quando há mais de um campo inválido", async () => {
      const resposta = await request(app).post("/api/lugares").send(lugarValido({ trecho: "x", nome: "" }));

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ error: "trecho: Trecho inválido. | nome: Informe o nome do lugar." });
    });

    it.each([
      ["corpo ausente", undefined],
      ["objeto vazio", {}],
      ["lista", [lugarValido()]],
    ])("deve recusar %s", async (_caso, corpo) => {
      const requisicao = request(app).post("/api/lugares");

      const resposta = corpo === undefined ? await requisicao : await requisicao.send(corpo);

      expect(resposta.status).toBe(400);
      expect(typeof resposta.body.error).toBe("string");
      expect(banco.lugares()).toHaveLength(0);
    });
  });

  describe("teto de 300 lugares", () => {
    it("deve responder 409 quando já existem 300 lugares", async () => {
      for (let i = 0; i < 300; i++) banco.semearLugar({ nome: `Lugar ${i}` });

      const resposta = await request(app).post("/api/lugares").send(lugarValido());

      expect(resposta.status).toBe(409);
      expect(resposta.body).toEqual({
        error: "O limite de lugares salvos foi atingido. Apague algum antes de adicionar outro.",
      });
      expect(banco.lugares()).toHaveLength(300);
    });

    it("deve deixar órfã a foto citada quando a criação é recusada pelo teto", async () => {
      for (let i = 0; i < 300; i++) banco.semearLugar();
      const foto = await enviarFoto(app);

      const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [foto] }));

      expect(resposta.status).toBe(409);
      expect(banco.fotosOrfas().map((f) => f.id)).toEqual([foto]);
    });

    it("deve aceitar o 300º lugar", async () => {
      for (let i = 0; i < 299; i++) banco.semearLugar();

      const resposta = await request(app).post("/api/lugares").send(lugarValido());

      expect(resposta.status).toBe(201);
      expect(banco.lugares()).toHaveLength(300);
    });

    it("deve voltar a aceitar depois que um lugar é apagado", async () => {
      const semeados = Array.from({ length: 300 }, () => banco.semearLugar());
      await request(app).delete(`/api/lugares/${semeados[0].id}`);

      const resposta = await request(app).post("/api/lugares").send(lugarValido());

      expect(resposta.status).toBe(201);
    });

    it("deve continuar permitindo editar um lugar com o teto atingido", async () => {
      const semeados = Array.from({ length: 300 }, () => banco.semearLugar());

      const resposta = await request(app).put(`/api/lugares/${semeados[0].id}`).send(lugarValido({ nome: "Editado" }));

      expect(resposta.status).toBe(200);
      expect(resposta.body.nome).toBe("Editado");
    });
  });
});

describe("GET /api/lugares", () => {
  it("deve responder 200 com lista vazia quando não há lugares", async () => {
    const resposta = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  it("deve ordenar do mais antigo para o mais novo por criadoEm, e não pela ordem de gravação", async () => {
    banco.semearLugar({ nome: "Terceiro", criadoEm: new Date("2026-03-01T10:00:00Z") });
    banco.semearLugar({ nome: "Primeiro", criadoEm: new Date("2026-01-01T10:00:00Z") });
    banco.semearLugar({ nome: "Segundo", criadoEm: new Date("2026-02-01T10:00:00Z") });

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.body.map((lugar: any) => lugar.nome)).toEqual(["Primeiro", "Segundo", "Terceiro"]);
  });

  it("deve manter a posição do lugar na lista depois de editado", async () => {
    const antigo = banco.semearLugar({ nome: "Antigo", criadoEm: new Date("2026-01-01T10:00:00Z") });
    banco.semearLugar({ nome: "Novo", criadoEm: new Date("2026-02-01T10:00:00Z") });
    await request(app).put(`/api/lugares/${antigo.id}`).send(lugarValido({ nome: "Antigo editado" }));

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.body.map((lugar: any) => lugar.nome)).toEqual(["Antigo editado", "Novo"]);
  });

  it("deve trazer os lugares de todos os trechos", async () => {
    await criarLugar(app, { trecho: "roma" });
    await criarLugar(app, { trecho: "veneza" });

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.body.map((lugar: any) => lugar.trecho)).toEqual(["roma", "veneza"]);
  });

  it("deve trazer as fotos só como ids, sem nenhum campo `dados`", async () => {
    const foto = await enviarFoto(app);
    await criarLugar(app, { fotos: [foto] });

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.body[0].fotos).toEqual([foto]);
    expect(Object.keys(resposta.body[0]).sort()).toEqual([...CAMPOS_DA_RESPOSTA].sort());
    expect(resposta.text).not.toContain("dados");
    expect(resposta.text).not.toContain("tipoMime");
  });

  it("não deve ler os bytes das fotos no banco para montar a listagem", async () => {
    for (let i = 0; i < 3; i++) {
      const lugar = banco.semearLugar();
      banco.semearFoto({ lugarId: lugar.id, ordem: 0 });
      banco.semearFoto({ lugarId: lugar.id, ordem: 1 });
    }
    const leiturasAntes = banco.leiturasDeDados;

    const resposta = await request(app).get("/api/lugares");

    expect(resposta.body).toHaveLength(3);
    expect(banco.leiturasDeDados - leiturasAntes).toBe(0);
  });

  it("não deve ler os bytes das fotos ao criar ou editar um lugar", async () => {
    const foto = await enviarFoto(app);
    const leiturasAntes = banco.leiturasDeDados;

    const lugar = await criarLugar(app, { fotos: [foto] });
    await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [foto] }));

    expect(banco.leiturasDeDados - leiturasAntes).toBe(0);
  });
});

describe("PUT /api/lugares/:id", () => {
  it("deve responder 200 com o lugar atualizado", async () => {
    const lugar = await criarLugar(app);
    const novo = lugarValido({
      trecho: "amalfi",
      tipo: "Restaurante",
      nome: "Da Vincenzo",
      resumo: "Positano",
      preco: "€€€",
      link: "",
      descricao: "Reservar com antecedência.",
      destaques: ["Vista"],
    });

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(novo);

    expect(resposta.status).toBe(200);
    expect(resposta.body).toMatchObject({ ...novo, id: lugar.id });
  });

  it("deve manter id e criadoEm e gravar a alteração", async () => {
    const lugar = await criarLugar(app);

    await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ nome: "Novo nome" }));
    const lista = await request(app).get("/api/lugares");

    expect(lista.body).toHaveLength(1);
    expect(lista.body[0]).toMatchObject({ id: lugar.id, criadoEm: lugar.criadoEm, nome: "Novo nome" });
  });

  it("deve alterar só o lugar do id informado", async () => {
    const alvo = await criarLugar(app, { nome: "Alvo" });
    const outro = await criarLugar(app, { nome: "Outro" });

    await request(app).put(`/api/lugares/${alvo.id}`).send(lugarValido({ nome: "Alvo editado" }));
    const lista = await request(app).get("/api/lugares");

    expect(lista.body.find((l: any) => l.id === outro.id)).toEqual(outro);
  });

  it("deve responder 404 quando o id não existe", async () => {
    const resposta = await request(app).put(`/api/lugares/${UUID_INEXISTENTE}`).send(lugarValido());

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ error: "Lugar não encontrado." });
    expect(banco.lugares()).toHaveLength(0);
  });

  it("deve responder 400 quando o id não é um uuid", async () => {
    const resposta = await request(app).put("/api/lugares/123").send(lugarValido());

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: "id: Identificador inválido." });
  });

  it("deve responder 400 e não alterar nada quando o corpo é inválido", async () => {
    const lugar = await criarLugar(app);

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ nome: "" }));
    const lista = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual({ error: "nome: Informe o nome do lugar." });
    expect(lista.body).toEqual([lugar]);
  });

  it("deve exigir todos os campos também na edição (não é atualização parcial)", async () => {
    const lugar = await criarLugar(app);

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send({ nome: "Só o nome" });
    const lista = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(400);
    expect(lista.body).toEqual([lugar]);
  });
});

describe("DELETE /api/lugares/:id", () => {
  it("deve responder 204 sem corpo e tirar o lugar da listagem", async () => {
    const lugar = await criarLugar(app);

    const resposta = await request(app).delete(`/api/lugares/${lugar.id}`);
    const lista = await request(app).get("/api/lugares");

    expect(resposta.status).toBe(204);
    expect(resposta.text).toBe("");
    expect(lista.body).toEqual([]);
  });

  it("deve apagar só o lugar do id informado", async () => {
    const alvo = await criarLugar(app, { nome: "Alvo" });
    const outro = await criarLugar(app, { nome: "Outro" });

    await request(app).delete(`/api/lugares/${alvo.id}`);
    const lista = await request(app).get("/api/lugares");

    expect(lista.body).toEqual([outro]);
  });

  it("deve responder 404 quando o id não existe", async () => {
    const resposta = await request(app).delete(`/api/lugares/${UUID_INEXISTENTE}`);

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ error: "Lugar não encontrado." });
  });

  it("deve responder 404 ao apagar pela segunda vez", async () => {
    const lugar = await criarLugar(app);
    await request(app).delete(`/api/lugares/${lugar.id}`);

    const resposta = await request(app).delete(`/api/lugares/${lugar.id}`);

    expect(resposta.status).toBe(404);
  });

  it.each(["123", "nao-e-uuid", "3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5", "3f2b8c1e5d4a4c7b9e1f0a1b2c3d4e5f"])(
    "deve responder 400 quando o id é %s",
    async (id) => {
      const resposta = await request(app).delete(`/api/lugares/${id}`);

      expect(resposta.status).toBe(400);
      expect(resposta.body).toEqual({ error: "id: Identificador inválido." });
    },
  );

  it("não deve apagar nada quando o id é malformado", async () => {
    await criarLugar(app);

    await request(app).delete("/api/lugares/%27%20OR%201%3D1--");

    expect(banco.lugares()).toHaveLength(1);
  });
});
