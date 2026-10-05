// Reconciliação das fotos ao salvar um lugar: a lista `fotos` do corpo passa a
// ser exatamente o conjunto (e a ordem) das fotos do lugar.
import request from "supertest";
import { describe, expect, it } from "vitest";
import app from "../../src/app";
import { banco } from "../apoio/prisma-em-memoria";
import { UUID_INEXISTENTE, criarLugar, enviarFoto, lugarValido, obterFoto, pngMinimo } from "../apoio/fabricas";

const FOTO_INDISPONIVEL = { error: "Uma das fotos não existe ou pertence a outro lugar." };

async function enviarFotos(quantas: number) {
  const ids: string[] = [];
  for (let i = 0; i < quantas; i++) ids.push(await enviarFoto(app));
  return ids;
}

async function listarLugares() {
  return (await request(app).get("/api/lugares")).body as Array<Record<string, any>>;
}

describe("criar lugar com fotos", () => {
  it("deve ligar as fotos órfãs ao lugar, na ordem enviada", async () => {
    const [a, b, c] = await enviarFotos(3);

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [c, a, b] }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.fotos).toEqual([c, a, b]);
    expect(banco.fotosOrfas()).toHaveLength(0);
    expect(banco.fotosDoLugar(resposta.body.id)).toMatchObject([
      { id: c, ordem: 0 },
      { id: a, ordem: 1 },
      { id: b, ordem: 2 },
    ]);
  });

  it("deve devolver as fotos na mesma ordem em GET /api/lugares", async () => {
    const [a, b, c] = await enviarFotos(3);
    await criarLugar(app, { fotos: [b, c, a] });

    const [lugar] = await listarLugares();

    expect(lugar.fotos).toEqual([b, c, a]);
  });

  it("deve continuar servindo a imagem depois de ligada ao lugar", async () => {
    const foto = await enviarFoto(app, "image/png", pngMinimo());
    await criarLugar(app, { fotos: [foto] });

    const resposta = await obterFoto(app, foto);

    expect(resposta.status).toBe(200);
    expect(Buffer.compare(resposta.body, pngMinimo())).toBe(0);
  });

  it("deve aceitar 12 fotos", async () => {
    const fotos = await enviarFotos(12);

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.fotos).toEqual(fotos);
  });

  it("deve aceitar o id da foto em maiúsculas e devolver em minúsculas", async () => {
    const foto = await enviarFoto(app);

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [foto.toUpperCase()] }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.fotos).toEqual([foto]);
  });

  it("deve deixar órfãs as fotos enviadas que não entraram na lista", async () => {
    const [usada, esquecida] = await enviarFotos(2);

    await criarLugar(app, { fotos: [usada] });

    expect(banco.fotosOrfas().map((f) => f.id)).toEqual([esquecida]);
  });

  it("deve responder 400 e não criar o lugar quando uma foto não existe", async () => {
    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [UUID_INEXISTENTE] }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(FOTO_INDISPONIVEL);
    expect(await listarLugares()).toEqual([]);
  });

  it("deve desfazer o vínculo das fotos válidas quando outra da lista não existe (rollback)", async () => {
    const [a, b] = await enviarFotos(2);

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [a, b, UUID_INEXISTENTE] }));

    expect(resposta.status).toBe(400);
    expect(banco.lugares()).toHaveLength(0);
    expect(banco.fotosOrfas().map((f) => f.id).sort()).toEqual([a, b].sort());
  });

  it("deve responder 400 e não criar o lugar quando a foto é de outro lugar", async () => {
    const foto = await enviarFoto(app);
    const dono = await criarLugar(app, { nome: "Dono", fotos: [foto] });

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ nome: "Intruso", fotos: [foto] }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(FOTO_INDISPONIVEL);
    expect(await listarLugares()).toEqual([dono]);
  });

  it("deve permitir tentar de novo com as mesmas fotos depois de um 400", async () => {
    const [a, b] = await enviarFotos(2);
    await request(app).post("/api/lugares").send(lugarValido({ fotos: [a, b, UUID_INEXISTENTE] }));

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [a, b] }));

    expect(resposta.status).toBe(201);
    expect(resposta.body.fotos).toEqual([a, b]);
  });
});

describe("editar as fotos de um lugar (PUT)", () => {
  it("deve reordenar as fotos", async () => {
    const [a, b, c] = await enviarFotos(3);
    const lugar = await criarLugar(app, { fotos: [a, b, c] });

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [c, a, b] }));
    const [listado] = await listarLugares();

    expect(resposta.status).toBe(200);
    expect(resposta.body.fotos).toEqual([c, a, b]);
    expect(listado.fotos).toEqual([c, a, b]);
    expect(banco.fotos()).toHaveLength(3);
  });

  it("deve manter as fotos quando a lista vem igual", async () => {
    const [a, b] = await enviarFotos(2);
    const lugar = await criarLugar(app, { fotos: [a, b] });

    const resposta = await request(app)
      .put(`/api/lugares/${lugar.id}`)
      .send(lugarValido({ nome: "Só o nome mudou", fotos: [a, b] }));

    expect(resposta.status).toBe(200);
    expect(resposta.body.fotos).toEqual([a, b]);
    expect((await obterFoto(app, a)).status).toBe(200);
    expect((await obterFoto(app, b)).status).toBe(200);
  });

  it("deve apagar a foto que saiu da lista", async () => {
    const [a, b, c] = await enviarFotos(3);
    const lugar = await criarLugar(app, { fotos: [a, b, c] });

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [a, c] }));
    const removida = await request(app).get(`/api/fotos/${b}`);

    expect(resposta.body.fotos).toEqual([a, c]);
    expect(removida.status).toBe(404);
    expect(banco.fotos().map((f) => f.id).sort()).toEqual([a, c].sort());
  });

  it("deve fechar o buraco na ordem depois de remover uma foto do meio", async () => {
    const [a, b, c] = await enviarFotos(3);
    const lugar = await criarLugar(app, { fotos: [a, b, c] });

    await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [a, c] }));

    expect(banco.fotosDoLugar(lugar.id)).toMatchObject([
      { id: a, ordem: 0 },
      { id: c, ordem: 1 },
    ]);
  });

  it("deve apagar todas as fotos quando a lista vem vazia", async () => {
    const [a, b] = await enviarFotos(2);
    const lugar = await criarLugar(app, { fotos: [a, b] });

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [] }));

    expect(resposta.body.fotos).toEqual([]);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve acrescentar uma foto órfã nova, na posição enviada", async () => {
    const [a, b] = await enviarFotos(2);
    const lugar = await criarLugar(app, { fotos: [a, b] });
    const nova = await enviarFoto(app);

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [nova, a, b] }));

    expect(resposta.body.fotos).toEqual([nova, a, b]);
    expect(banco.fotosOrfas()).toHaveLength(0);
  });

  it("deve trocar, remover e acrescentar na mesma requisição", async () => {
    const [a, b, c] = await enviarFotos(3);
    const lugar = await criarLugar(app, { fotos: [a, b, c] });
    const nova = await enviarFoto(app);

    const resposta = await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [c, nova, a] }));

    expect(resposta.body.fotos).toEqual([c, nova, a]);
    expect((await request(app).get(`/api/fotos/${b}`)).status).toBe(404);
  });

  it("não deve mexer nas fotos de outros lugares nem nas órfãs", async () => {
    const [a, b, doVizinho, orfa] = await enviarFotos(4);
    const lugar = await criarLugar(app, { fotos: [a, b] });
    const vizinho = await criarLugar(app, { nome: "Vizinho", fotos: [doVizinho] });

    await request(app).put(`/api/lugares/${lugar.id}`).send(lugarValido({ fotos: [] }));

    expect(banco.fotosDoLugar(vizinho.id).map((f) => f.id)).toEqual([doVizinho]);
    expect(banco.fotosOrfas().map((f) => f.id)).toEqual([orfa]);
  });

  it("deve responder 400 quando uma foto não existe, sem gravar nada (rollback)", async () => {
    const [a, b] = await enviarFotos(2);
    const lugar = await criarLugar(app, { nome: "Original", fotos: [a, b] });

    const resposta = await request(app)
      .put(`/api/lugares/${lugar.id}`)
      .send(lugarValido({ nome: "Alterado", fotos: [b, UUID_INEXISTENTE] }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(FOTO_INDISPONIVEL);
    // Nem os campos, nem a ordem, nem a foto `a` (que tinha saído da lista) mudaram.
    expect(await listarLugares()).toEqual([lugar]);
    expect((await obterFoto(app, a)).status).toBe(200);
  });

  it("deve responder 400 quando a foto é de outro lugar, sem tirá-la do dono (rollback)", async () => {
    const [minha, alheia] = await enviarFotos(2);
    const lugar = await criarLugar(app, { nome: "Original", fotos: [minha] });
    const dono = await criarLugar(app, { nome: "Dono", fotos: [alheia] });

    const resposta = await request(app)
      .put(`/api/lugares/${lugar.id}`)
      .send(lugarValido({ nome: "Alterado", fotos: [alheia] }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(FOTO_INDISPONIVEL);
    expect(await listarLugares()).toEqual([lugar, dono]);
    expect((await obterFoto(app, minha)).status).toBe(200);
  });

  it("deve responder 404 e manter a foto órfã quando o lugar não existe", async () => {
    const foto = await enviarFoto(app);

    const resposta = await request(app).put(`/api/lugares/${UUID_INEXISTENTE}`).send(lugarValido({ fotos: [foto] }));

    expect(resposta.status).toBe(404);
    expect(banco.fotosOrfas().map((f) => f.id)).toEqual([foto]);
  });

  it("deve responder 404, e não 400, quando nem o lugar nem a foto existem", async () => {
    const resposta = await request(app)
      .put(`/api/lugares/${UUID_INEXISTENTE}`)
      .send(lugarValido({ fotos: ["11111111-2222-4333-8444-555555555555"] }));

    expect(resposta.status).toBe(404);
    expect(resposta.body).toEqual({ error: "Lugar não encontrado." });
  });
});

describe("apagar um lugar com fotos (DELETE)", () => {
  it("deve apagar as fotos do lugar junto", async () => {
    const [a, b] = await enviarFotos(2);
    const lugar = await criarLugar(app, { fotos: [a, b] });

    const resposta = await request(app).delete(`/api/lugares/${lugar.id}`);

    expect(resposta.status).toBe(204);
    expect((await request(app).get(`/api/fotos/${a}`)).status).toBe(404);
    expect((await request(app).get(`/api/fotos/${b}`)).status).toBe(404);
    expect(banco.fotos()).toHaveLength(0);
  });

  it("deve manter as fotos dos outros lugares e as órfãs", async () => {
    const [doAlvo, doVizinho, orfa] = await enviarFotos(3);
    const alvo = await criarLugar(app, { fotos: [doAlvo] });
    await criarLugar(app, { nome: "Vizinho", fotos: [doVizinho] });

    await request(app).delete(`/api/lugares/${alvo.id}`);

    expect((await obterFoto(app, doVizinho)).status).toBe(200);
    expect((await obterFoto(app, orfa)).status).toBe(200);
    expect(banco.fotos()).toHaveLength(2);
  });

  it("não deve permitir reaproveitar em outro lugar a foto de um lugar apagado", async () => {
    const foto = await enviarFoto(app);
    const lugar = await criarLugar(app, { fotos: [foto] });
    await request(app).delete(`/api/lugares/${lugar.id}`);

    const resposta = await request(app).post("/api/lugares").send(lugarValido({ fotos: [foto] }));

    expect(resposta.status).toBe(400);
    expect(resposta.body).toEqual(FOTO_INDISPONIVEL);
  });
});
