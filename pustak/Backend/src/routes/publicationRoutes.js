const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const { verifyAdmin } = require('../middlewares/adminAuth');

router.get('/', publicationController.getPublications);
router.get('/by-title/:title', publicationController.getPublicationByTitle);
router.get('/:id', publicationController.getPublication);
router.post('/', verifyAdmin, publicationController.createPublication);
router.put('/:id', verifyAdmin, publicationController.updatePublication);
router.delete('/:id', verifyAdmin, publicationController.deletePublication);

module.exports = router;
