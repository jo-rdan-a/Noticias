const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');

// Home / news list
router.get('/', articleController.home);

// Article by slug
router.get('/artigos/:slug', articleController.showPublic);

// By category
router.get('/categoria/:slug', articleController.byCategory);

module.exports = router;
