const express = require('express');
const router = express.Router();

const { getBooks, searchBooks, getBooksByAuthor, getBooksByPublication, getBooksByCategory, getBookById, getBestsellers, getNewArrivals, getOffers, getCatalog } = require('../controllers/bookController');

router.get('/search',        searchBooks);
router.get('/catalog',       getCatalog);
router.get('/bestsellers',   getBestsellers);
router.get('/new-arrivals',  getNewArrivals);
router.get('/offers',        getOffers);
router.get('/author/:id',       getBooksByAuthor);
router.get('/publication/:id',  getBooksByPublication);
router.get('/category/:id',     getBooksByCategory);
router.get('/',              getBooks);
router.get('/:id',           getBookById);

module.exports = router;