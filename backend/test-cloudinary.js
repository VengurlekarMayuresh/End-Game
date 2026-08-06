require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY);
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? '***set***' : '***MISSING***');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test by pinging the API usage endpoint
cloudinary.api.usage()
  .then(result => {
    console.log('\n✅ Cloudinary credentials are VALID!');
    console.log('Plan:', result.plan);
    console.log('Used:', result.credits?.usage);
  })
  .catch(err => {
    console.log('\n❌ Cloudinary credentials are INVALID!');
    console.log('Error:', err.message);
    console.log('HTTP Code:', err.http_code);
  });
