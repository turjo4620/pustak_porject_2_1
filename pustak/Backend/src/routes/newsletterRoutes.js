const express = require('express');
const newsletterController = require('../controllers/newsletterController');
const { verifyAdmin } = require('../middlewares/adminAuth');

const router = express.Router();

router.post('/subscribe', newsletterController.subscribe);
router.post('/campaigns', verifyAdmin, newsletterController.sendCampaign);

module.exports = router;