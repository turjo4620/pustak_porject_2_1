const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyAdmin } = require('../middlewares/adminAuth');

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.post('/', verifyAdmin, categoryController.createCategory);
router.put('/:id', verifyAdmin, categoryController.updateCategory);
router.delete('/:id', verifyAdmin, categoryController.deleteCategory);

module.exports = router;
