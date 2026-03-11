const slugify = require('slugify');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Tag = sequelize.define('Tag', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { len: [1, 50] }
  },
  slug: {
    type: DataTypes.STRING(80),
    unique: true
  }
}, {
  tableName: 'tags',
  timestamps: true,
  hooks: {
    beforeValidate: (tag) => {
      if (tag.changed('name') && tag.name) {
        tag.slug = slugify(tag.name, { lower: true, strict: true, locale: 'pt' });
      }
    }
  }
});

module.exports = Tag;
