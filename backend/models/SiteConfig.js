const mongoose = require('mongoose');

const siteConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

const SiteConfig = mongoose.model('SiteConfig', siteConfigSchema);
module.exports = SiteConfig;
