# Notícias

Sistema de gerenciamento de conteúdo para blog de notícias, desenvolvido em Node.js com **MySQL** e Sequelize. Oferece interface para jornalistas publicarem e gerenciarem artigos e site dinâmico para o público.

## Requisitos

- **Node.js** 18+
- **MySQL** 8.0+ (ou MariaDB compatível)

## Instalação

1. Clone o repositório e entre na pasta do projeto:
   ```bash
   cd noticias
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie o banco de dados no MySQL:
   ```sql
   CREATE DATABASE mini_cms_noticias CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
   Para testes (opcional):
   ```sql
   CREATE DATABASE mini_cms_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. Configure as variáveis de ambiente. Crie um arquivo `.env` na raiz do projeto:
   ```env
   # Banco de dados (use uma URL completa ou variáveis separadas)
   MYSQL_URI=mysql://usuario:senha@localhost:3306/mini_cms_noticias
   # Ou: DATABASE_URL=mysql://usuario:senha@localhost:3306/mini_cms_noticias

   # Para testes (opcional)
   MYSQL_TEST_URI=mysql://usuario:senha@localhost:3306/mini_cms_test

   # Segurança
   SESSION_SECRET=uma_chave_secreta_forte
   JWT_SECRET=outra_chave_secreta_forte

   # Opcional: sincronizar schema ao subir (cria/altera tabelas)
   # SYNC_DB=true
   ```

5. Popule o banco com dados iniciais (cria tabelas e insere usuários, categorias, tags e artigos de exemplo):
   ```bash
   npm run seed
   ```

6. Inicie o servidor:
   ```bash
   npm start
   ```
   Ou em modo desenvolvimento (recarrega ao alterar arquivos):
   ```bash
   npm run dev
   ```

O servidor sobe em **http://localhost:3000** (ou na porta definida em `PORT` no `.env`).

## Uso

- **Site público:** http://localhost:3000 — listagem, busca, filtros por categoria e leitura de artigos.
- **Área administrativa:** http://localhost:3000/admin — requer login (session).
- **API REST:** base em http://localhost:3000/api — autenticação via JWT (Bearer).

### Usuários de exemplo (após `npm run seed`)

| Perfil     | Email          | Senha    |
|-----------|----------------|----------|
| Editor    | editor@noticias.com | 12345 |
| Jornalista| joao@noticias.com   | 12345 |
| Jornalista| maria@noticias.com  | 12345 |

## Scripts

| Comando     | Descrição                          |
|------------|-------------------------------------|
| `npm start`| Inicia o servidor                   |
| `npm run dev` | Inicia com nodemon (reload)      |
| `npm run seed` | Recria tabelas e popula dados   |
| `npm test` | Executa testes (Jest)               |

## Testes

Os testes usam um banco separado quando `MYSQL_TEST_URI` está definido (ou `mini_cms_test` por padrão em ambiente de teste).

```bash
NODE_ENV=test npm test
```

## Documentação da API

Consulte **[docs/API.md](docs/API.md)** para descrição dos endpoints, parâmetros e exemplos de requisição e resposta.

## Estrutura do projeto

```
src/
├── app.js              # Entrada, middlewares, rotas
├── config/
│   ├── database.js     # Conexão MySQL/Sequelize
│   ├── logger.js
│   └── seed.js         # Script de seed
├── controllers/
├── jobs/               # Tarefas assíncronas (agendador, contador de views)
├── middlewares/
├── models/             # Sequelize (User, Category, Tag, Article)
├── routes/
├── tests/
└── views/              # EJS (páginas públicas e admin)
```

## Funcionalidades atendidas (requisitos)

- **Perfis e autenticação:** visitante (só leitura), jornalista (CRUD dos próprios artigos, rascunhos e agendamento), editor (gerencia todos os artigos).
- **Artigos:** título, slug único, subtítulo, conteúdo, imagem de capa, status (draft/scheduled/published), data de publicação, autor, categoria, tags, contador de visualizações, datas de criação/atualização.
- **Regras:** slug automático, publicação automática de agendados (job), contagem de visualizações assíncrona (job).
- **Busca, filtros (categoria, tags), paginação e ordenação.**
- **Rotas e views públicas** + **API REST** para operações administrativas.
- **Persistência em MySQL.**
- **Tarefas assíncronas:** publicação automática de agendados; contagem de visualizações em background.
- **Documentação da API**, **segurança** (Helmet, rate limit, CORS, validação, senhas hasheadas, JWT/session).
- **Banco inicial** com usuários, categorias, tags e artigos de exemplo.
- **Testes** de autenticação e CRUD de artigos.

## Licença

Uso educacional / Programação Web II
