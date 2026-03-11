const { Sequelize } = require('sequelize');

const dbUrl = process.env.DATABASE_URL || process.env.MYSQL_URI;
const isTest = process.env.NODE_ENV === 'test';
const connectionUrl = isTest
  ? (process.env.MYSQL_TEST_URI || dbUrl || 'mysql://root:@localhost:3306/mini_cms_test')
  : (dbUrl || 'mysql://root:@localhost:3306/mini_cms_noticias');

const sequelize = new Sequelize(connectionUrl, {
  dialect: 'mysql',
  logging: isTest ? false : false,
  define: {
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL conectado:', sequelize.config.database);
    if (!isTest && process.env.SYNC_DB === 'true') {
      await sequelize.sync({ alter: true });
      console.log('Tabelas sincronizadas');
    }
  } catch (error) {
    console.error('Erro MySQL:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
