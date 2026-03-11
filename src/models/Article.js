const slugify = require('slugify');
const { DataTypes, Op } = require('sequelize');
const { sequelize } = require('../config/database');

const Article = sequelize.define('Article', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: { len: [1, 200] }
  },
  slug: {
    type: DataTypes.STRING(220),
    unique: true
  },
  subtitle: {
    type: DataTypes.STRING(300),
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  coverImage: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'scheduled', 'published'),
    defaultValue: 'draft'
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' }
  },
  categoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'categories', key: 'id' }
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'articles',
  timestamps: true,
  indexes: [
    { fields: ['status', 'publishedAt'] },
    { fields: ['authorId'] },
    { fields: ['categoryId'] },
    { fields: ['slug'], unique: true }
  ],
  hooks: {
    beforeValidate: async (article) => {
      if (article.changed('title') || !article.slug) {
        const baseSlug = slugify(article.title || 'artigo', { lower: true, strict: true, locale: 'pt' });
        let slug = baseSlug;
        let counter = 1;
        const ArticleModel = article.constructor;
        const whereId = article.id ? { id: { [Op.ne]: article.id } } : {};
        while (await ArticleModel.findOne({ where: { slug, ...whereId } })) {
          slug = `${baseSlug}-${counter}`;
          counter++;
        }
        article.slug = slug;
      }
      if (article.changed('status') && article.status === 'published' && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }
  }
});

module.exports = Article;
