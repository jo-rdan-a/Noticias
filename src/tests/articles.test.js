const request = require('supertest');
const { connectDB, sequelize } = require('../config/database');
const { User, Category, Tag, Article } = require('../models');

process.env.NODE_ENV = 'test';
if (!process.env.MYSQL_TEST_URI) {
  process.env.MYSQL_TEST_URI = process.env.DATABASE_URL || process.env.MYSQL_URI || 'mysql://root:@localhost:3306/mini_cms_test';
}

const app = require('../app');

let journalistToken, editorToken;
let categoryId, tagId;
let createdArticleId, createdArticleSlug;

beforeAll(async () => {
  await connectDB();
  await sequelize.sync({ force: true });

  const journalist = await User.create({
    name: 'Jornalista Teste',
    email: 'journalist@crudtest.com',
    password: 'senha123',
    role: 'journalist'
  });
  const editor = await User.create({
    name: 'Editor Teste',
    email: 'editor@crudtest.com',
    password: 'senha123',
    role: 'editor'
  });

  const jRes = await request(app).post('/api/auth/login')
    .send({ email: 'journalist@crudtest.com', password: 'senha123' });
  journalistToken = jRes.body.data.token;

  const eRes = await request(app).post('/api/auth/login')
    .send({ email: 'editor@crudtest.com', password: 'senha123' });
  editorToken = eRes.body.data.token;

  const cat = await Category.create({ name: 'Teste CRUD', description: 'Test' });
  categoryId = cat.id;

  const tag = await Tag.create({ name: 'tag-crud-test' });
  tagId = tag.id;
});

afterAll(async () => {
  await User.destroy({ where: { email: ['journalist@crudtest.com', 'editor@crudtest.com', 'outro@crudtest.com'] } });
  await Category.destroy({ where: { name: 'Teste CRUD' } });
  await Tag.destroy({ where: { name: 'tag-crud-test' } });
  await Article.destroy({ where: { categoryId } });
  await sequelize.close();
});

describe('📄 CRUD de Artigos - API', () => {

  describe('GET /api/artigos (público)', () => {
    it('deve listar artigos publicados sem autenticação', async () => {
      const res = await request(app).get('/api/artigos');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.articles).toBeDefined();
      expect(Array.isArray(res.body.data.articles)).toBe(true);
    });

    it('deve suportar paginação', async () => {
      const res = await request(app).get('/api/artigos?page=1&limit=5');
      expect(res.statusCode).toBe(200);
      expect(res.body.data.pagination).toBeDefined();
      expect(res.body.data.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/artigos', () => {
    it('deve criar um artigo como rascunho (jornalista autenticado)', async () => {
      const res = await request(app)
        .post('/api/artigos')
        .set('Authorization', `Bearer ${journalistToken}`)
        .send({
          title: 'Artigo de Teste CRUD',
          subtitle: 'Subtítulo de teste',
          content: 'Conteúdo completo do artigo de teste para verificar criação.',
          category: categoryId,
          tags: [tagId],
          status: 'draft'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.article.status).toBe('draft');
      expect(res.body.data.article.slug).toBeDefined();

      createdArticleId = res.body.data.article.id;
      createdArticleSlug = res.body.data.article.slug;
    });

    it('deve rejeitar criação sem autenticação', async () => {
      const res = await request(app)
        .post('/api/artigos')
        .send({ title: 'Sem auth', content: 'Conteúdo', category: categoryId, status: 'draft' });
      expect(res.statusCode).toBe(401);
    });

    it('deve rejeitar artigo sem título', async () => {
      const res = await request(app)
        .post('/api/artigos')
        .set('Authorization', `Bearer ${journalistToken}`)
        .send({ content: 'Sem título', category: categoryId, status: 'draft' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('PUT /api/artigos/:id', () => {
    it('deve atualizar artigo do próprio autor', async () => {
      const res = await request(app)
        .put(`/api/artigos/${createdArticleId}`)
        .set('Authorization', `Bearer ${journalistToken}`)
        .send({ title: 'Artigo de Teste CRUD - Atualizado', status: 'published' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.article.title).toBe('Artigo de Teste CRUD - Atualizado');
      expect(res.body.data.article.status).toBe('published');
    });

    it('editor deve poder atualizar qualquer artigo', async () => {
      const res = await request(app)
        .put(`/api/artigos/${createdArticleId}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ subtitle: 'Subtítulo alterado pelo editor' });

      expect(res.statusCode).toBe(200);
    });

    it('deve retornar 404 para artigo inexistente', async () => {
      const fakeId = 999999;
      const res = await request(app)
        .put(`/api/artigos/${fakeId}`)
        .set('Authorization', `Bearer ${journalistToken}`)
        .send({ title: 'Nope' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/artigos/:slug', () => {
    it('deve retornar artigo publicado pelo slug', async () => {
      const res = await request(app).get(`/api/artigos/${createdArticleSlug}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.article.slug).toBe(createdArticleSlug);
    });
  });

  describe('DELETE /api/artigos/:id', () => {
    it('deve deletar artigo do próprio autor', async () => {
      const res = await request(app)
        .delete(`/api/artigos/${createdArticleId}`)
        .set('Authorization', `Bearer ${journalistToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('deve retornar 404 após exclusão', async () => {
      const res = await request(app).get(`/api/artigos/${createdArticleSlug}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('🔒 Controle de Acesso', () => {
    let articleId;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/artigos')
        .set('Authorization', `Bearer ${journalistToken}`)
        .send({
          title: 'Artigo para teste de permissão',
          content: 'Conteúdo de teste',
          category: categoryId,
          status: 'draft'
        });
      articleId = res.body.data?.article?.id;
    });

    it('outro jornalista não deve poder deletar artigo alheio', async () => {
      await User.create({
        name: 'Outro Jornalista',
        email: 'outro@crudtest.com',
        password: 'senha123',
        role: 'journalist'
      });
      const loginRes = await request(app).post('/api/auth/login')
        .send({ email: 'outro@crudtest.com', password: 'senha123' });
      const otherToken = loginRes.body.data.token;

      const res = await request(app)
        .delete(`/api/artigos/${articleId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toBe(403);
    });

    it('editor deve poder deletar qualquer artigo', async () => {
      const res = await request(app)
        .delete(`/api/artigos/${articleId}`)
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.statusCode).toBe(200);
    });

    afterAll(async () => {
      await User.destroy({ where: { email: 'outro@crudtest.com' } });
    });
  });
});
