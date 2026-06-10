const express = require('express');
const router = express.Router();
const SiteConfig = require('../models/SiteConfig');

// Public endpoint to get homepage config (no auth)
router.get('/homepage', async (req, res, next) => {
  try {
    const doc = await SiteConfig.findOne({ key: 'homepage' }).lean();
    res.json({ success: true, data: doc?.data || {} });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
