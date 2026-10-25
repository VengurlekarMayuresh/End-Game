const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'ds20dwlrs';
const API_KEY = process.env.CLOUDINARY_API_KEY || '352138977813842';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '6E-paKyWXggniEdu_AQS97IJJcA';

const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || '';
const SERVER_PORT = process.env.PORT || 3000;

const LOCAL_UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
try {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
} catch (_) {}

/**
 * Uploads an image (base64 data URI or buffer) to Cloudinary.
 * Supports both unsigned preset uploads and API Key signed uploads.
 * Falls back to local public storage if Cloudinary is unreachable or fails.
 */
async function uploadToCloudinary(fileInput, options = {}) {
  const { folder = 'hiresense_calibration', publicId = `id_${Date.now()}_${crypto.randomBytes(3).toString('hex')}` } = options;

  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (typeof fileInput === 'string') {
    if (fileInput.startsWith('data:')) {
      const match = fileInput.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      } else {
        base64Data = fileInput;
      }
    } else {
      base64Data = fileInput;
    }
  } else if (Buffer.isBuffer(fileInput)) {
    base64Data = fileInput.toString('base64');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const dataUri = `data:${mimeType};base64,${base64Data}`;

  // 1. If an unsigned upload preset is provided, try unsigned upload first
  if (CLOUD_NAME && UPLOAD_PRESET) {
    try {
      const formData = new URLSearchParams();
      formData.append('file', dataUri);
      formData.append('upload_preset', UPLOAD_PRESET);
      if (folder) formData.append('folder', folder);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Cloudinary Unsigned] Uploaded ${publicId} -> ${data.secure_url}`);
        return {
          success: true,
          url: data.secure_url || data.url,
          publicId: data.public_id,
          provider: 'cloudinary'
        };
      } else {
        const errText = await response.text();
        console.warn(`[Cloudinary Unsigned HTTP ${response.status}]:`, errText.slice(0, 200));
      }
    } catch (e) {
      console.warn('[Cloudinary Unsigned Warning]:', e.message);
    }
  }

  // 2. Attempt Cloudinary signed upload
  if (CLOUD_NAME && API_KEY && API_SECRET) {
    try {
      const paramsToSign = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
      const signature = crypto.createHash('sha1').update(paramsToSign).digest('hex');

      const formData = new URLSearchParams();
      formData.append('file', dataUri);
      formData.append('api_key', API_KEY);
      formData.append('timestamp', String(timestamp));
      formData.append('folder', folder);
      formData.append('public_id', publicId);
      formData.append('signature', signature);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(15000)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[Cloudinary Signed] Uploaded ${publicId} -> ${data.secure_url}`);
        return {
          success: true,
          url: data.secure_url || data.url,
          publicId: data.public_id,
          provider: 'cloudinary'
        };
      } else {
        const errText = await response.text();
        console.error(`\n❌ [Cloudinary HTTP ${response.status} Error]:`, errText);
        console.error(`👉 Tip: The Cloudinary key '${API_KEY}' on cloud '${CLOUD_NAME}' lacks upload/create permissions. Enable 'Upload' permission or configure an unsigned preset.\n`);
      }
    } catch (netErr) {
      console.warn('[Cloudinary network error]:', netErr.message);
    }
  }

  // 3. Fallback to local file storage under /public/uploads/ (Absolute URL)
  try {
    const ext = mimeType.includes('png') ? 'png' : mimeType.includes('pdf') ? 'pdf' : 'jpg';
    const filename = `${publicId}.${ext}`;
    const filePath = path.join(LOCAL_UPLOADS_DIR, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);

    const localUrl = `http://localhost:${SERVER_PORT}/uploads/${filename}`;
    console.log(`[LocalStorage] Saved calibration file -> ${localUrl}`);
    return {
      success: true,
      url: localUrl,
      publicId,
      provider: 'local'
    };
  } catch (fsErr) {
    console.error('[LocalStorage error]', fsErr);
    return {
      success: true,
      url: dataUri,
      publicId,
      provider: 'data_uri'
    };
  }
}

module.exports = {
  uploadToCloudinary
};
