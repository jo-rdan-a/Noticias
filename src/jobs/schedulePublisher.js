const cron = require('node-cron');
const { Op } = require('sequelize');
const { Article } = require('../models');

const schedulePublisher = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const [n] = await Article.update(
        { status: 'published' },
        { where: { status: 'scheduled', publishedAt: { [Op.lte]: new Date() } } }
      );
      if (n > 0) console.log('[Job] Publicados', n, 'artigo(s) agendado(s)');
    } catch (err) {
      console.error('[Job] Erro:', err.message);
    }
  });
};

module.exports = schedulePublisher;
