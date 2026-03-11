const request = require('supertest');
const { connectDB, sequelize } = require('../config/database');
const { User } = require('../models');

process.env.NODE_ENV = 'test';
if (!process.env.MYSQL_TEST_URI) {
  process.env.MYSQL_TEST_URI = process.env.DATABASE_URL || process.env.MYSQL_URI || 'mysql://root:@localhost:3306/mini_cms_test';
}

const app = require('../app');

beforeAll(async () => {
  await connectDB();
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await User.destroy({ where: { email: ['teste@test.com', 'nao_existe@test.com'] } });
  await sequelize.close();
});

describe('🔐 Autenticação - API', () => {
  const testUser = {
    name: 'Teste Usuário',
    email: 'teste@test.com',
    password: 'senha123',
    role: 'journalist'
  };

  describe('POST /api/auth/register', () => {
    it('deve registrar um novo usuário', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('deve rejeitar email duplicado', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('deve rejeitar dados inválidos', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'X', email: 'invalido', password: '123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('deve fazer login com credenciais válidas', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('deve rejeitar senha incorreta', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'senhaerrada' });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('deve rejeitar email inexistente', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nao_existe@test.com', password: 'senha123' });

      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });
      token = res.body.data.token;
    });

    it('deve retornar dados do usuário autenticado', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('deve rejeitar requisição sem token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('deve rejeitar token inválido', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido_aqui');
      expect(res.statusCode).toBe(401);
    });
  });
});
