const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');

router.get('/', publicationController.getPublications);
router.get('/by-title/:title', publicationController.getPublicationByTitle);
router.get('/:id', publicationController.getPublication);
router.post('/', publicationController.createPublication);
router.put('/:id', publicationController.updatePublication);
router.delete('/:id', publicationController.deletePublication);

module.exports = router;
