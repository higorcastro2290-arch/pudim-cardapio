# Deploy no Railway

## O que ja esta pronto

- app configurado para `Next.js standalone`
- `railway.toml` criado
- banco SQLite configuravel por `SQLITE_DB_PATH`
- `.env.local` fora do versionamento
- arquivo do banco `.sqlite` fora do versionamento

## O que voce precisa fazer no computador

### 1. Instalar Git

Se o comando `git` nao funcionar no terminal, instale:

- Git for Windows: https://git-scm.com/download/win

Depois feche e abra o terminal novamente.

### 2. Criar o repositorio local e enviar para o GitHub

Na pasta do projeto:

```powershell
cd "c:\Users\higor\OneDrive\Documentos\Projeto pudim\pudim-cardapio"
git init
git add .
git commit -m "Primeira versao do site"
git branch -M main
```

### 3. Criar um repositorio no GitHub

No GitHub:

1. clique em `New repository`
2. escolha um nome, por exemplo `pudim-cardapio`
3. crie o repositorio vazio

Depois copie a URL do repositorio e rode:

```powershell
git remote add origin SUA_URL_DO_GITHUB
git push -u origin main
```

## O que voce precisa fazer no Railway

### 1. Criar o projeto

1. entre em `https://railway.app`
2. clique em `New Project`
3. escolha `Deploy from GitHub repo`
4. selecione o repositorio

### 2. Configurar variaveis

Em `Variables`, adicione:

```env
ADMIN_PASSWORD=sua-senha-forte
ADMIN_SESSION_SECRET=um-segredo-longo-e-aleatorio
SQLITE_DB_PATH=/data/orders.sqlite
```

Nao coloque credenciais reais em arquivos versionados no projeto. Configure esses valores apenas no painel do Railway.

### 3. Criar o volume

1. clique em `New`
2. escolha `Volume`
3. monte em:

```txt
/data
```

### 4. Gerar dominio publico

1. abra o servico
2. va em `Networking`
3. clique em `Generate Domain`

## Testes depois do deploy

1. abrir a pagina inicial
2. adicionar produto ao carrinho
3. salvar pedido
4. entrar em `/admin`
5. conferir se o pedido aparece
