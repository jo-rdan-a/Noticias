const slugify = require('slugify');
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(80),
    allowNull: false,
    unique: true,
    validate: { len: [1, 80] }
  },
  slug: {
    type: DataTypes.STRING(100),
    unique: true
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  color: {
    type: DataTypes.STRING(20),
    defaultValue: '#3B82F6'
  }
}, {
  tableName: 'categories',
  timestamps: true,
  hooks: {
    beforeValidate: (category) => {
      if (category.changed('name') && category.name) {
        category.slug = slugify(category.name, { lower: true, strict: true, locale: 'pt' });
      }
    }
  }
});

module.exports = Category;
