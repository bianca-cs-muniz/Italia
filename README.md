# Itália Plano

Site pessoal de planejamento de uma viagem pela Itália:

- **Lugares** — hospedagens, atrações, restaurantes e experiências salvos por trecho da viagem
  (Roma, Toscana, Cinque Terre, Veneza, Norte, Nápoles e Costa Amalfitana), com resumo, preço,
  link, descrição, destaques e **fotos**.
- **Checklist** — os preparativos da viagem (passaportes, seguro, passagens, trens...), com o que
  já foi marcado.

Os dados ficam num banco na nuvem, então dá para abrir de qualquer aparelho.

> **Não há login.** Quem tem a URL do site vê e edita tudo: lugares, fotos e checklist.
> Compartilhe o endereço só com quem vai planejar a viagem junto, e não guarde aqui nada
> sensível (documentos, senhas, dados de cartão). Ver [Limites e proteções](#limites-e-proteções).

O projeto segue a mesma divisão do `caderno`, em duas pastas independentes:

```
Italia-plano/
├── webApi/   → back-end (Node + Express + TypeScript + Prisma + Zod), roda com tsx
├── webApp/   → front-end (Next.js + TypeScript + MUI/emotion)
└── docs/     → protótipo original (prototipo.html)
```

> `docs/prototipo.html` é a versão de arquivo único que serviu de referência de
> comportamento e de visual.

## Como rodar

Precisa de um PostgreSQL. O caminho mais simples é um banco gratuito no [Neon](https://neon.tech).

### 1) Back-end (webApi)

```bash
cd webApi
npm install
cp .env.example .env      # preencha DATABASE_URL e DIRECT_URL
npm run prisma:deploy     # aplica a migração (cria as tabelas e as regras do banco)
npm run dev
```

A API sobe em `http://localhost:4000/api` (teste em `/api/saude`).

### 2) Front-end (webApp)

Em outro terminal:

```bash
cd webApp
npm install
npm run dev
```

O front sobe em `http://localhost:3000` e encaminha `/api/*` para o back-end
(configurado em `next.config.ts`).

## Contrato da API

Todas as rotas ficam sob `/api`. Erros voltam sempre como `{ "error": "mensagem" }`.

| Rota | Entrada | Resposta |
|---|---|---|
| `GET /saude` | — | `200` `{ ok: true }` |
| `GET /lugares` | — | `200` `Lugar[]`, do mais antigo para o mais novo |
| `POST /lugares` | `SalvarLugar` | `201` `Lugar` |
| `PUT /lugares/:id` | `SalvarLugar` | `200` `Lugar` |
| `DELETE /lugares/:id` | — | `204` (apaga as fotos do lugar junto) |
| `POST /fotos` | corpo binário cru, `Content-Type` `image/jpeg`, `image/png` ou `image/webp`, até 2 MB | `201` `{ id }` |
| `GET /fotos/:id` | — | `200` com os bytes da imagem e `Cache-Control: public, max-age=31536000, immutable` |
| `GET /checklist` | — | `200` `{ marcados: string[] }` |
| `PUT /checklist/:itemId` | `{ marcado: boolean }` | `200` `{ itemId, marcado }` |

`Lugar` (resposta):

```
{ id, trecho, tipo, nome, resumo, preco, link, descricao,
  destaques: string[], fotos: string[], criadoEm, atualizadoEm }
```

`fotos` é a lista de ids, na ordem de exibição; a imagem de cada uma sai em `GET /api/fotos/:id`.
A listagem nunca traz os bytes das fotos.

`SalvarLugar` (entrada, todos os campos obrigatórios):

| Campo | Regra |
|---|---|
| `trecho` | `roma`, `toscana`, `cinque`, `veneza`, `norte`, `napoles` ou `amalfi` |
| `tipo` | `Hospedagem`, `Atração`, `Restaurante`, `Experiência` ou `Outro` |
| `nome` | 1 a 120 caracteres |
| `resumo` | até 200 caracteres |
| `preco` | até 80 caracteres |
| `link` | vazio ou URL `http://`/`https://`, até 500 caracteres |
| `descricao` | até 5.000 caracteres |
| `destaques` | até 20 textos de 1 a 80 caracteres |
| `fotos` | até 12 ids de foto, sem repetição |

Itens do checklist (`:itemId`): `passaportes`, `regras-schengen`, `etias`, `seguro-viagem`,
`passagens`, `hoteis`, `trens`, `ingressos`, `vendemmia`, `transporte-cinque-terre`,
`barco-amalfi`, `reserva-emergencia`, `esim`, `adaptador`, `bagagem`. A lista fica em
`webApi/src/modules/checklist/checklist.constantes.ts` e o front usa os mesmos ids.

### Como as fotos são salvas

1. O front envia **uma foto por requisição** em `POST /api/fotos` e guarda o `id` devolvido.
   Nesse momento a foto ainda não pertence a nenhum lugar (está "órfã").
2. Ao salvar o lugar (`POST` ou `PUT /api/lugares`), o front manda em `fotos` a lista de ids na
   ordem escolhida. Na mesma transação, a API liga essas fotos ao lugar, grava a ordem e apaga
   as fotos do lugar que saíram da lista.
3. Cada foto citada precisa existir e estar órfã ou já ser daquele lugar; senão a API responde
   `400` e nada é gravado.
4. Fotos órfãs há mais de 24 horas (formulário abandonado) são apagadas a cada novo envio.

### Códigos de erro

| Código | Quando |
|---|---|
| `400` | entrada inválida (Zod), id que não é uuid, foto inexistente ou de outro lugar |
| `404` | lugar, foto ou item do checklist não encontrado; rota inexistente |
| `409` | limite de lugares atingido |
| `413` | foto com mais de 2 MB |
| `415` | tipo de arquivo não aceito, ou arquivo que não é uma imagem do tipo informado |
| `429` | muitas requisições em pouco tempo, ou fotos demais enviadas e ainda não salvas |
| `500` | erro interno |

## Limites e proteções

Como não há login, estes limites são o que impede alguém com a URL de encher o banco ou de
subir arquivos indevidos. Os valores ficam em `webApi/src/config/app.config.ts`.

| Limite | Valor | Onde é garantido |
|---|---|---|
| Tamanho de cada foto | 2 MB | leitura do corpo na API e `CHECK` no banco |
| Tipos de foto | JPEG, PNG e WebP | `Content-Type` + assinatura dos primeiros bytes na API; `CHECK` no banco |
| Fotos por lugar | 12 | Zod |
| Lugares salvos | 300 | service (`409`) |
| Fotos enviadas e ainda sem lugar | 200 | service (`429`) |
| Escritas (criar, editar, apagar, marcar) | 60 por minuto, por IP | `express-rate-limit` |
| Envios de foto | 30 por minuto, por IP | `express-rate-limit` |
| Corpo JSON | 100 kb | `express.json` |

- O tipo da foto é conferido pelos **primeiros bytes do arquivo**, não só pelo header: um
  arquivo qualquer renomeado para `.jpg` é recusado.
- As fotos são servidas com o tipo gravado no banco e com `X-Content-Type-Options: nosniff`
  (helmet), para o navegador nunca interpretá-las como outra coisa.
- O link de um lugar só aceita `http://` e `https://`.
- Toda entrada é validada com Zod no servidor; o React escapa o texto na tela.
- CORS liberado só para as origens de `URL_FRONTEND`, sem credenciais. Isso restringe outros
  sites no navegador, mas **não substitui um login**: a API continua aberta para quem a chamar
  diretamente.
- Os logs registram só a mensagem do erro, nunca o corpo da requisição.
- O limite por minuto fica desligado quando `NODE_ENV=test` (testes automatizados).

As regras do banco estão em `webApi/prisma/migrations/*_init/migration.sql` (o que o
Prisma não descreve no schema foi acrescentado no fim do arquivo).

> **Ao criar novas migrações** com `prisma migrate dev`, confira o SQL gerado: o Prisma não
> enxerga os `CHECK` da tabela `fotos`. Se aparecer um `DROP CONSTRAINT` deles, remova essa
> linha antes de aplicar.

## Padrão de código (back-end)

Cada módulo em `webApi/src/modules/<modulo>` segue a mesma estrutura do `caderno`:

```
<modulo>.controller.ts   → recebe a requisição, chama o service, devolve a resposta
<modulo>.service.ts      → regras de negócio
<modulo>.repository.ts   → acesso ao banco (Prisma)
<modulo>.routes.ts       → define as rotas Express
<modulo>.validator.ts    → validação de entrada com Zod
<modulo>.constantes.ts   → listas fixas (trechos, tipos, itens do checklist)
dtos/*.dto.ts            → schemas Zod + tipos TypeScript
```

Módulos: `lugares`, `fotos`, `checklist`.

Infraestrutura compartilhada: `config/` (variáveis de ambiente e limites), `database/data-source.ts`
(instância única do Prisma), `errors/`, `shared/middlewares/limite-requisicoes.ts`,
`shared/helpers/imagem.helper.ts` (**assinatura dos arquivos de imagem**), `utils/` (validator
base, `@TryCatch()`).

`src/app.ts` exporta o app Express sem abrir porta (é o que os testes importam); quem chama
`listen` é `src/server.ts`.

## Publicar

- **Banco:** Neon. Use a conexão *pooled* em `DATABASE_URL` (com `pgbouncer=true`) e a direta em `DIRECT_URL`.
- **webApi:** qualquer host Node (ex: Render). `npm install && npm run build`, depois
  `npm run prisma:deploy` e `npm start`. Defina `DATABASE_URL`, `DIRECT_URL` e `URL_FRONTEND`
  (a URL do front, para o CORS). Atrás de um proxy defina também `PROXIES_CONFIAVEIS` (no Render,
  `1`), para o limite de requisições contar pelo IP de quem chamou e não pelo do proxy.
- **webApp:** Vercel. Defina `API_URL` com a URL pública da API.
- Lembre que o site publicado fica aberto para qualquer pessoa que tenha o endereço.
