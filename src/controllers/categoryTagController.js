const { Category, Tag } = require('../models');

// ==================== CATEGORY CONTROLLERS ====================

exports.listCategories = async (req, res, next) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const category = await Category.create({ name, description, color });
    res.status(201).json({ success: true, message: 'Categoria criada com sucesso', data: { category } });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.color !== undefined) updates.color = req.body.color;
    await category.update(updates);
    res.json({ success: true, data: { category } });
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Categoria não encontrada' });
    await category.destroy();
    res.json({ success: true, message: 'Categoria removida com sucesso' });
  } catch (error) {
    next(error);
  }
};

// ==================== TAG CONTROLLERS ====================

exports.listTags = async (req, res, next) => {
  try {
    const tags = await Tag.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: { tags } });
  } catch (error) {
    next(error);
  }
};

exports.createTag = async (req, res, next) => {
  try {
    const { name } = req.body;
    const tag = await Tag.create({ name });
    res.status(201).json({ success: true, message: 'Tag criada com sucesso', data: { tag } });
  } catch (error) {
    next(error);
  }
};

exports.deleteTag = async (req, res, next) => {
  try {
    const tag = await Tag.findByPk(req.params.id);
    if (!tag) return res.status(404).json({ success: false, message: 'Tag não encontrada' });
    await tag.destroy();
    res.json({ success: true, message: 'Tag removida com sucesso' });
  } catch (error) {
    next(error);
  }
};
