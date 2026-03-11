# Documentação da API – Notícias

Base URL: `http://localhost:3000/api` (ou a URL do seu servidor).

A API retorna JSON. Endpoints protegidos exigem o header:

```
Authorization: Bearer <token_jwt>
```

O token é obtido em `POST /api/auth/login` ou `POST /api/auth/register`.

---

## Autenticação

### POST /api/auth/register

Registra um novo usuário (jornalista ou editor).

**Body (JSON):**

| Campo    | Tipo   | Obrigatório | Descrição        |
|----------|--------|-------------|------------------|
| name     | string | Sim         | Nome             |
| email    | string | Sim         | E-mail único     |
| password | string | Sim         | Mín. 6 caracteres|
| role     | string | Não         | `journalist` ou `editor` (default: `journalist`) |

**Exemplo de resposta (201):**

```json
{
  "success": true,
  "message": "Usuário criado com sucesso",
  "data": {
    "user": { "id": 1, "name": "João", "email": "joao@email.com", "role": "journalist" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Erros:** 400 (dados inválidos), 409 (e-mail já cadastrado).

---

### POST /api/auth/login

Autentica e retorna um token JWT.

**Body (JSON):**

| Campo    | Tipo   | Obrigatório |
|----------|--------|-------------|
| email    | string | Sim         |
| password | string | Sim         |

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": { "id": 1, "name": "João", "email": "joao@email.com", "role": "journalist" },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Erros:** 401 (credenciais inválidas).

---

### GET /api/auth/me

Retorna o usuário autenticado. **Requer token.**

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "João", "email": "joao@email.com", "role": "journalist" }
  }
}
```

**Erros:** 401 (token ausente ou inválido).

---

## Artigos (público)

### GET /api/artigos

Lista **apenas artigos publicados**, com paginação, ordenação e filtros.

**Query params:**

| Param   | Tipo   | Descrição                          |
|---------|--------|------------------------------------|
| page    | number | Página (default: 1)                |
| limit   | number | Itens por página (default: 10, máx: 50) |
| sort    | string | Campo para ordenar: `publishedAt`, `viewCount`, `title` |
| order   | string | `asc` ou `desc` (default: `desc`) |
| search  | string | Busca em título, subtítulo e conteúdo |
| category| number | ID da categoria                    |
| tag     | number | ID da tag                          |
| startDate | string | Data início (ISO) para filtro por data de publicação |
| endDate   | string | Data fim (ISO)                     |

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Título do artigo",
        "slug": "titulo-do-artigo",
        "subtitle": "Subtítulo",
        "content": "...",
        "coverImage": "/uploads/...",
        "status": "published",
        "publishedAt": "2025-03-10T12:00:00.000Z",
        "viewCount": 100,
        "author": { "id": 1, "name": "João" },
        "category": { "id": 1, "name": "Tecnologia", "slug": "tecnologia" },
        "tags": [{ "id": 1, "name": "IA", "slug": "ia" }],
        "createdAt": "...",
        "updatedAt": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3
    }
  }
}
```

---

### GET /api/artigos/:slug

Retorna um **artigo publicado** pelo slug. Incrementa o contador de visualizações de forma assíncrona.

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "data": {
    "article": {
      "id": 1,
      "title": "Título",
      "slug": "titulo",
      "subtitle": "...",
      "content": "...",
      "coverImage": "/uploads/...",
      "status": "published",
      "publishedAt": "...",
      "viewCount": 101,
      "author": { "id": 1, "name": "João", "avatar": null },
      "category": { "id": 1, "name": "Tecnologia", "slug": "tecnologia" },
      "tags": [...],
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Erros:** 404 (artigo não encontrado ou não publicado).

---

## Artigos (protegidos – requer autenticação)

### GET /api/admin/artigos

Lista **todos** os artigos do sistema (incluindo rascunhos e agendados). Jornalistas veem apenas os próprios; editores e admins veem todos.

**Query params:** os mesmos de `GET /api/artigos` (page, limit, sort, order, search, category, tag, status, startDate, endDate).

**Resposta:** mesmo formato de `GET /api/artigos`, com `articles` podendo ter `status` `draft`, `scheduled` ou `published`.

---

### POST /api/artigos

Cria um novo artigo. **Requer token** (jornalista ou editor).

**Body (JSON ou multipart/form-data):**

| Campo      | Tipo   | Obrigatório | Descrição |
|------------|--------|-------------|-----------|
| title      | string | Sim         | Título (máx. 200) |
| content    | string | Sim         | Conteúdo |
| category   | number | Sim         | ID da categoria |
| subtitle   | string | Não         | Subtítulo |
| tags       | array  | Não         | IDs das tags |
| status     | string | Não         | `draft`, `scheduled` ou `published` (default: `draft`) |
| publishedAt| string | Se agendado | Data/hora ISO para publicação |
| coverImage | file   | Não         | Envio via multipart como arquivo |

**Exemplo de resposta (201):**

```json
{
  "success": true,
  "message": "Artigo criado com sucesso",
  "data": {
    "article": { "id": 7, "title": "...", "slug": "...", "status": "draft", "author": {...}, "category": {...}, "tags": [...] }
  }
}
```

**Erros:** 400 (validação), 401 (não autenticado).

---

### PUT /api/artigos/:id

Atualiza um artigo. **Requer token.** Jornalista só pode editar os próprios; editor pode editar qualquer um.

**Body:** mesmos campos de `POST /api/artigos` (parcialmente permitido).

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "message": "Artigo atualizado com sucesso",
  "data": { "article": { ... } }
}
```

**Erros:** 403 (sem permissão), 404 (artigo não encontrado).

---

### DELETE /api/artigos/:id

Remove um artigo. **Requer token.** Mesmas regras de permissão do PUT.

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "message": "Artigo removido com sucesso"
}
```

**Erros:** 403 (sem permissão), 404 (artigo não encontrado).

---

## Categorias

### GET /api/categorias

Lista todas as categorias (público).

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "name": "Tecnologia", "slug": "tecnologia", "description": "...", "color": "#3B82F6", "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```

### POST /api/categorias | PUT /api/categorias/:id | DELETE /api/categorias/:id

Cria, atualiza ou remove categoria. **Requer token com role `editor` ou `admin`.**

---

## Tags

### GET /api/tags

Lista todas as tags (público).

**Exemplo de resposta (200):**

```json
{
  "success": true,
  "data": {
    "tags": [
      { "id": 1, "name": "Inteligência Artificial", "slug": "inteligencia-artificial", "createdAt": "...", "updatedAt": "..." }
    ]
  }
}
```

### POST /api/tags | DELETE /api/tags/:id

Cria ou remove tag. **Requer token com role `editor` ou `admin`.**

---

## Respostas de erro

Formato padrão:

```json
{
  "success": false,
  "message": "Descrição do erro"
}
```

Em validação (400), pode haver campo `errors` com detalhes. Códigos HTTP usuais: 400 (validação), 401 (não autenticado), 403 (sem permissão), 404 (não encontrado), 409 (conflito, ex.: e-mail duplicado), 500 (erro interno).
