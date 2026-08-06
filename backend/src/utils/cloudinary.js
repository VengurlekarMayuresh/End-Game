const cloudinary = require('cloudinary').v2;
const env = require('../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: env.CLOUDINARY_API_KEY || 'demo',
  api_secret: env.CLOUDINARY_API_SECRET || 'demo',
});

module.exports = {
  cloudinary,
};
