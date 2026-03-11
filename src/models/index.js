const { sequelize } = require('../config/database');
const User = require('./User');
const Category = require('./Category');
const Tag = require('./Tag');
const Article = require('./Article');

// Associações
User.hasMany(Article, { foreignKey: 'authorId' });
Article.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Article, { foreignKey: 'categoryId' });
Article.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

Article.belongsToMany(Tag, { through: 'ArticleTags', foreignKey: 'articleId', otherKey: 'tagId', as: 'tags' });
Tag.belongsToMany(Article, { through: 'ArticleTags', foreignKey: 'tagId', otherKey: 'articleId', as: 'articles' });

module.exports = {
  sequelize,
  User,
  Category,
  Tag,
  Article
};
