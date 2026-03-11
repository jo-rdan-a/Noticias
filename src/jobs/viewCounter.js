const { Article } = require('../models');

// Incremento assíncrono simples (não bloqueia a resposta)
function incrementView(articleId) {
  const id = Number(articleId);
  if (!id) return;
  setImmediate(() => {
    Article.increment({ viewCount: 1 }, { where: { id } }).catch(err => console.error('View count:', err));
  });
}

module.exports = { queueViewIncrement: incrementView };
