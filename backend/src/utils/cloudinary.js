const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const env = require('../config/env');

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: env.CLOUDINARY_API_KEY || 'demo',
  api_secret: env.CLOUDINARY_API_SECRET || 'demo',
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'hiresense/misc';
    if (file.mimetype === 'application/pdf') {
      folder = 'hiresense/resumes';
    } else if (file.mimetype.startsWith('image/')) {
      folder = 'hiresense/profiles';
    }

    return {
      folder: folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'pdf'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
