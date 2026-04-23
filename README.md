# Pudim Cardapio

Sistema de cardapio, pre-encomenda e painel administrativo para `Priscila Siqueira Pudim Gourmet`.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variaveis de ambiente

Crie um `.env.local` com base no `.env.example`.

```env
ADMIN_PASSWORD=troque-por-uma-senha-forte
ADMIN_SESSION_SECRET=troque-por-um-segredo-longo
SQLITE_DB_PATH=./data/orders.sqlite
```

## Banco de dados

O projeto usa SQLite local para salvar:

- pedidos
- itens do pedido
- status
- dados de retirada ou entrega

Por padrao, o banco fica em `./data/orders.sqlite`.

Se a hospedagem usar disco/volume persistente, configure `SQLITE_DB_PATH` apontando para esse caminho persistente.

Exemplo:

```env
SQLITE_DB_PATH=/data/orders.sqlite
```

## Deploy recomendado

Como o projeto salva pedidos em SQLite, o ideal e usar uma hospedagem com:

- Node.js
- disco persistente

### Railway

Boa opcao para esta versao atual do projeto.

Passos gerais:

1. Suba o projeto para o GitHub.
2. Crie um novo projeto no Railway.
3. Conecte o repositorio.
4. Adicione as variaveis:

```env
ADMIN_PASSWORD=sua-senha
ADMIN_SESSION_SECRET=seu-segredo-longo
SQLITE_DB_PATH=/data/orders.sqlite
```

5. Crie um `Volume` e monte em `/data`.
6. Faça o deploy.

Documentacao oficial usada:

- Next.js deploy Node server: https://nextjs.org/docs/pages/getting-started/deploying
- Railway volumes: https://docs.railway.com/guides/volumes

### Render

Tambem funciona, mas o ideal e usar um `Persistent Disk`.

Documentacao oficial:

- Render persistent disks: https://render.com/docs/disks

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
