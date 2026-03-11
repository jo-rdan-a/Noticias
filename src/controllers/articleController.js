const { Op } = require('sequelize');
const { Article, Category, Tag, User } = require('../models');
const { queueViewIncrement } = require('../jobs/viewCounter');

// ==================== HELPERS ====================

const buildWhere = (queryParams) => {
  const { search, category, tag, status, startDate, endDate } = queryParams;
  const where = {};

  if (search) {
    const term = `%${search}%`;
    where[Op.or] = [
      { title: { [Op.like]: term } },
      { subtitle: { [Op.like]: term } },
      { content: { [Op.like]: term } }
    ];
  }
  if (category) where.categoryId = category;
  if (status) where.status = status;
  if (startDate || endDate) {
    where.publishedAt = {};
    if (startDate) where.publishedAt[Op.gte] = new Date(startDate);
    if (endDate) where.publishedAt[Op.lte] = new Date(endDate);
  }
  // tag filter is applied via include with required: true + where on Tag
  return where;
};

const includePublic = [
  { model: User, as: 'author', attributes: ['id', 'name'] },
  { model: Category, as: 'category', attributes: { exclude: [] } },
  { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
];

const includeAdmin = [
  { model: User, as: 'author', attributes: ['id', 'name'] },
  { model: Category, as: 'category' },
  { model: Tag, as: 'tags', through: { attributes: [] } }
];

// ==================== PUBLIC WEB CONTROLLERS ====================

exports.home = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;
    const where = { status: 'published', ...buildWhere(req.query) };
    const sortField = req.query.sort || 'publishedAt';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';

    const include = [...includePublic];
    if (req.query.tag) {
      include[2] = { model: Tag, as: 'tags', where: { id: req.query.tag }, required: true, through: { attributes: [] }, attributes: ['id', 'name', 'slug'] };
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      include,
      order: [[sortField, sortOrder]],
      offset,
      limit,
      distinct: true
    });
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    const totalPages = Math.ceil(count / limit);

    res.render('public/home', {
      title: 'Notícias',
      articles,
      categories,
      currentPage: page,
      totalPages,
      total: count,
      query: req.query,
      layout: 'layouts/main'
    });
  } catch (error) {
    next(error);
  }
};

// GET /artigos/:slug
exports.showPublic = async (req, res, next) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    if (!article) {
      return next({ statusCode: 404, message: 'Artigo não encontrado' });
    }

    queueViewIncrement(article.id);

    const related = await Article.findAll({
      where: { status: 'published', categoryId: article.categoryId, id: { [Op.ne]: article.id } },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name'] },
        { model: Category, as: 'category' }
      ],
      limit: 3,
      order: [['publishedAt', 'DESC']]
    });

    res.render('public/article', {
      title: article.title,
      article,
      related,
      layout: 'layouts/main'
    });
  } catch (error) {
    next(error);
  }
};

// GET /categoria/:slug
exports.byCategory = async (req, res, next) => {
  try {
    const category = await Category.findOne({ where: { slug: req.params.slug } });
    if (!category) return next({ statusCode: 404, message: 'Categoria não encontrada' });

    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const offset = (page - 1) * limit;

    const { count, rows: articles } = await Article.findAndCountAll({
      where: { status: 'published', categoryId: category.id },
      include: includePublic,
      order: [['publishedAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });
    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    res.render('public/home', {
      title: `Categoria: ${category.name}`,
      articles,
      categories,
      currentCategory: category,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      total: count,
      query: req.query,
      layout: 'layouts/main'
    });
  } catch (error) {
    next(error);
  }
};

// ==================== ADMIN WEB CONTROLLERS ====================

exports.adminIndex = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const baseWhere = ['editor'].includes(req.user.role) ? {} : { authorId: req.user.id };
    const where = { ...baseWhere, ...buildWhere(req.query) };

    const include = [...includeAdmin];
    if (req.query.tag) {
      include[2] = { model: Tag, as: 'tags', where: { id: req.query.tag }, required: true, through: { attributes: [] } };
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      include,
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });
    const categories = await Category.findAll({ order: [['name', 'ASC']] });

    res.render('admin/articles/index', {
      title: 'Gerenciar Artigos',
      articles,
      categories,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      total: count,
      query: req.query,
      layout: 'layouts/admin'
    });
  } catch (error) {
    next(error);
  }
};

exports.adminNew = async (req, res, next) => {
  try {
    const [categories, tags] = await Promise.all([
      Category.findAll({ order: [['name', 'ASC']] }),
      Tag.findAll({ order: [['name', 'ASC']] })
    ]);
    res.render('admin/articles/form', {
      title: 'Novo Artigo',
      article: null,
      categories,
      tags,
      layout: 'layouts/admin'
    });
  } catch (error) {
    next(error);
  }
};

exports.adminCreate = async (req, res, next) => {
  try {
    const { title, subtitle, content, category, tags, status, publishedAt } = req.body;
    const tagIds = tags ? (Array.isArray(tags) ? tags : [tags]).filter(Boolean) : [];

    const articleData = {
      title,
      subtitle,
      content,
      categoryId: category,
      status: status || 'draft',
      authorId: req.user.id
    };
    if (req.file) articleData.coverImage = `/uploads/${req.file.filename}`;
    if (status === 'scheduled' && publishedAt) articleData.publishedAt = new Date(publishedAt);
    else if (status === 'published') articleData.publishedAt = new Date();

    const article = await Article.create(articleData);
    if (tagIds.length) await article.setTags(tagIds);

    req.flash('success', 'Artigo criado com sucesso!');
    res.redirect('/admin/artigos');
  } catch (error) {
    next(error);
  }
};

exports.adminEdit = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id, { include: [{ model: Tag, as: 'tags', through: { attributes: [] } }] });
    if (!article) return next({ statusCode: 404, message: 'Artigo não encontrado' });

    if (!['editor'].includes(req.user.role) && article.authorId !== req.user.id) {
      req.flash('error', 'Você não tem permissão para editar este artigo.');
      return res.redirect('/admin/artigos');
    }

    const [categories, tags] = await Promise.all([
      Category.findAll({ order: [['name', 'ASC']] }),
      Tag.findAll({ order: [['name', 'ASC']] })
    ]);
    res.render('admin/articles/form', {
      title: 'Editar Artigo',
      article,
      categories,
      tags,
      layout: 'layouts/admin'
    });
  } catch (error) {
    next(error);
  }
};

exports.adminUpdate = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return next({ statusCode: 404, message: 'Artigo não encontrado' });

    if (!['editor'].includes(req.user.role) && article.authorId !== req.user.id) {
      req.flash('error', 'Permissão negada.');
      return res.redirect('/admin/artigos');
    }

    const { title, subtitle, content, category, tags, status, publishedAt } = req.body;
    article.title = title;
    article.subtitle = subtitle;
    article.content = content;
    article.categoryId = category;
    article.status = status;
    const tagIds = tags ? (Array.isArray(tags) ? tags : [tags]).filter(Boolean) : [];
    await article.setTags(tagIds);

    if (req.file) article.coverImage = `/uploads/${req.file.filename}`;
    if (status === 'scheduled' && publishedAt) article.publishedAt = new Date(publishedAt);
    else if (status === 'published' && !article.publishedAt) article.publishedAt = new Date();

    await article.save();
    req.flash('success', 'Artigo atualizado com sucesso!');
    res.redirect('/admin/artigos');
  } catch (error) {
    next(error);
  }
};

exports.adminDelete = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) return next({ statusCode: 404, message: 'Artigo não encontrado' });

    if (!['editor'].includes(req.user.role) && article.authorId !== req.user.id) {
      req.flash('error', 'Permissão negada.');
      return res.redirect('/admin/artigos');
    }

    await article.destroy();
    req.flash('success', 'Artigo removido com sucesso!');
    res.redirect('/admin/artigos');
  } catch (error) {
    next(error);
  }
};

// ==================== API CONTROLLERS ====================

exports.apiList = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;
    const sortField = req.query.sort || 'publishedAt';
    const sortOrder = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const where = { status: 'published', ...buildWhere(req.query) };

    const include = [...includePublic];
    if (req.query.tag) {
      include[2] = { model: Tag, as: 'tags', where: { id: req.query.tag }, required: true, through: { attributes: [] }, attributes: ['id', 'name', 'slug'] };
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      include,
      order: [[sortField, sortOrder]],
      offset,
      limit,
      distinct: true
    });

    const items = articles.map(a => a.get({ plain: true }));

    res.json({
      success: true,
      data: {
        articles: items,
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.apiListAll = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const offset = (page - 1) * limit;

    const baseWhere = ['editor'].includes(req.user.role) ? {} : { authorId: req.user.id };
    const where = { ...baseWhere, ...buildWhere(req.query) };

    const include = [...includeAdmin];
    if (req.query.tag) {
      include[2] = { model: Tag, as: 'tags', where: { id: req.query.tag }, required: true, through: { attributes: [] } };
    }

    const { count, rows: articles } = await Article.findAndCountAll({
      where,
      include,
      order: [['updatedAt', 'DESC']],
      offset,
      limit,
      distinct: true
    });

    res.json({
      success: true,
      data: {
        articles: articles.map(a => a.get({ plain: true })),
        pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.apiShow = async (req, res, next) => {
  try {
    const article = await Article.findOne({
      where: { slug: req.params.slug, status: 'published' },
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'avatar'] },
        { model: Category, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Tag, as: 'tags', attributes: ['id', 'name', 'slug'], through: { attributes: [] } }
      ]
    });

    if (!article) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado' });
    }

    queueViewIncrement(article.id);

    res.json({ success: true, data: { article: article.get({ plain: true }) } });
  } catch (error) {
    next(error);
  }
};

exports.apiCreate = async (req, res, next) => {
  try {
    const { title, subtitle, content, category, tags, status, publishedAt } = req.body;
    const tagIds = tags ? (Array.isArray(tags) ? tags : [tags]).filter(Boolean) : [];

    const articleData = {
      title,
      subtitle,
      content,
      categoryId: category,
      tags: tagIds,
      status: status || 'draft',
      authorId: req.user.id
    };
    if (req.file) articleData.coverImage = `/uploads/${req.file.filename}`;
    if (status === 'scheduled' && publishedAt) articleData.publishedAt = new Date(publishedAt);
    else if (status === 'published') articleData.publishedAt = new Date();

    const article = await Article.create(articleData);
    if (tagIds.length) await article.setTags(tagIds);

    const full = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    res.status(201).json({ success: true, message: 'Artigo criado com sucesso', data: { article: full.get({ plain: true }) } });
  } catch (error) {
    next(error);
  }
};

exports.apiUpdate = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado' });
    }

    if (!['editor'].includes(req.user.role) && article.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    const { title, subtitle, content, category, tags, status, publishedAt } = req.body;
    if (title) article.title = title;
    if (subtitle !== undefined) article.subtitle = subtitle;
    if (content) article.content = content;
    if (category) article.categoryId = category;
    if (tags !== undefined) {
      const tagIds = Array.isArray(tags) ? tags : [tags].filter(Boolean);
      await article.setTags(tagIds);
    }
    if (status) article.status = status;
    if (req.file) article.coverImage = `/uploads/${req.file.filename}`;
    if (status === 'scheduled' && publishedAt) article.publishedAt = new Date(publishedAt);
    else if (status === 'published' && !article.publishedAt) article.publishedAt = new Date();

    await article.save();

    const full = await Article.findByPk(article.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email'] },
        { model: Category, as: 'category' },
        { model: Tag, as: 'tags', through: { attributes: [] } }
      ]
    });

    res.json({ success: true, message: 'Artigo atualizado com sucesso', data: { article: full.get({ plain: true }) } });
  } catch (error) {
    next(error);
  }
};

exports.apiDelete = async (req, res, next) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).json({ success: false, message: 'Artigo não encontrado' });
    }

    if (!['editor'].includes(req.user.role) && article.authorId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Permissão negada' });
    }

    await article.destroy();
    res.json({ success: true, message: 'Artigo removido com sucesso' });
  } catch (error) {
    next(error);
  }
};
