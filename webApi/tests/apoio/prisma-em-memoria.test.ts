// Todos os testes de rota dependem do dublê do Prisma. Estes aqui conferem os
// comportamentos dele em que a suíte se apoia (rollback, P2025, cascade...).
import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import DataSource from "@database/data-source";
import { banco, prismaFalso } from "./prisma-em-memoria";

describe("dublê em memória do Prisma", () => {
  it("deve estar no lugar do data-source real em todos os testes", () => {
    expect(DataSource).toBe(prismaFalso);
  });

  it("deve desfazer tudo o que a transação gravou quando a função lança", async () => {
    const lugar = banco.semearLugar({ nome: "Antes" });
    const foto = banco.semearFoto({ lugarId: lugar.id });

    const transacao = prismaFalso.$transaction(async (tx: typeof prismaFalso) => {
      await tx.lugar.update({ where: { id: lugar.id }, data: { nome: "Depois" } });
      await tx.foto.deleteMany({ where: { lugarId: lugar.id } });
      await tx.lugar.create({ data: { trecho: "roma", tipo: "Outro", nome: "Novo" } });
      throw new Error("falhou no meio");
    });

    await expect(transacao).rejects.toThrow("falhou no meio");
    expect(banco.lugares().map((l) => l.nome)).toEqual(["Antes"]);
    expect(banco.fotos().map((f) => f.id)).toEqual([foto.id]);
  });

  it("deve manter o que a transação gravou quando a função termina sem erro", async () => {
    const resultado = await prismaFalso.$transaction(async (tx: typeof prismaFalso) => {
      await tx.lugar.create({ data: { trecho: "roma", tipo: "Outro", nome: "Novo" } });
      return "ok";
    });

    expect(resultado).toBe("ok");
    expect(banco.lugares()).toHaveLength(1);
  });

  it("deve lançar o erro P2025 do Prisma quando o update não encontra o id", async () => {
    const atualizacao = prismaFalso.lugar.update({
      where: { id: "3f2b8c1e-5d4a-4c7b-9e1f-0a1b2c3d4e5f" },
      data: { nome: "x" },
    });

    await expect(atualizacao).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(atualizacao).rejects.toMatchObject({ code: "P2025" });
  });

  it("deve alterar só as linhas que atendem à condição no updateMany e devolver a contagem", async () => {
    const lugarA = banco.semearLugar();
    const lugarB = banco.semearLugar();
    const orfa = banco.semearFoto();
    const deOutroLugar = banco.semearFoto({ lugarId: lugarB.id });

    const where = (id: string) => ({ id, OR: [{ lugarId: null }, { lugarId: lugarA.id }] });
    const daOrfa = await prismaFalso.foto.updateMany({ where: where(orfa.id), data: { lugarId: lugarA.id, ordem: 3 } });
    const daOutra = await prismaFalso.foto.updateMany({
      where: where(deOutroLugar.id),
      data: { lugarId: lugarA.id, ordem: 4 },
    });

    expect(daOrfa).toEqual({ count: 1 });
    expect(daOutra).toEqual({ count: 0 });
    expect(banco.fotosDoLugar(lugarA.id)).toMatchObject([{ id: orfa.id, ordem: 3 }]);
    expect(banco.fotosDoLugar(lugarB.id)).toMatchObject([{ id: deOutroLugar.id, ordem: 0 }]);
  });

  it("deve devolver só as colunas do select, na ordem do orderBy", async () => {
    const lugar = banco.semearLugar();
    const segunda = banco.semearFoto({ lugarId: lugar.id, ordem: 1 });
    const primeira = banco.semearFoto({ lugarId: lugar.id, ordem: 0 });

    const fotos = await prismaFalso.foto.findMany({
      where: { lugarId: lugar.id },
      select: { id: true },
      orderBy: { ordem: "asc" },
    });

    expect(fotos).toEqual([{ id: primeira.id }, { id: segunda.id }]);
  });

  it("deve ignorar o item repetido no createMany com skipDuplicates", async () => {
    const primeira = await prismaFalso.checklistMarcado.createMany({ data: [{ itemId: "trens" }], skipDuplicates: true });
    const segunda = await prismaFalso.checklistMarcado.createMany({ data: [{ itemId: "trens" }], skipDuplicates: true });

    expect(primeira).toEqual({ count: 1 });
    expect(segunda).toEqual({ count: 0 });
    expect(banco.marcados()).toHaveLength(1);
  });

  it("deve falhar com P2002 no createMany de item repetido sem skipDuplicates", async () => {
    banco.semearMarcado("trens");

    const repetido = prismaFalso.checklistMarcado.createMany({ data: [{ itemId: "trens" }] });

    await expect(repetido).rejects.toMatchObject({ code: "P2002" });
  });

  it("deve apagar as fotos do lugar junto com ele (ON DELETE CASCADE)", async () => {
    const lugar = banco.semearLugar();
    banco.semearFoto({ lugarId: lugar.id });
    const orfa = banco.semearFoto();

    const resultado = await prismaFalso.lugar.deleteMany({ where: { id: lugar.id } });

    expect(resultado).toEqual({ count: 1 });
    expect(banco.fotos().map((f) => f.id)).toEqual([orfa.id]);
  });

  it("deve recusar o byte NUL em colunas de texto, como o Postgres", async () => {
    const criacao = prismaFalso.lugar.create({ data: { trecho: "roma", tipo: "Outro", nome: "a\u0000b" } });

    await expect(criacao).rejects.toThrow(/0x00/);
  });

  it("deve lançar em vez de ignorar um operador que não conhece", async () => {
    banco.semearLugar();

    const busca = prismaFalso.lugar.findMany({ where: { nome: { contains: "x" } } });

    await expect(busca).rejects.toThrow(/não implementado/);
  });
});
