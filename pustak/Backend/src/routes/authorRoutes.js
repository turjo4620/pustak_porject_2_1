const express = require('express');
const router = express.Router();
const authorController = require('../controllers/authorController');
const { verifyAdmin } = require('../middlewares/adminAuth');

router.get('/', authorController.getAuthors);
router.get('/by-name/:name', authorController.getAuthorByName);
router.get('/:id', authorController.getAuthor);
router.post('/', verifyAdmin, authorController.createAuthor);
router.put('/:id', verifyAdmin, authorController.updateAuthor);
router.delete('/:id', verifyAdmin, authorController.deleteAuthor);

module.exports = router;