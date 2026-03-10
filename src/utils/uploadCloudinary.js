// src/utils/uploadCloudinary.js
// Upload client logo photos to Cloudinary (unsigned preset)

const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

/**
 * Upload a single File to Cloudinary
 * Returns the secure_url string
 */
export async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error('Cloudinary env vars missing: VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET')
  }

  const fd = new FormData()
  fd.append('file',         file)
  fd.append('upload_preset', UPLOAD_PRESET)
  fd.append('folder',        'brandpack-logos')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body:   fd,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || 'Cloudinary upload failed')
  }

  const data = await res.json()
  return data.secure_url
}

/**
 * Upload multiple files, returns array of secure_urls
 */
export async function uploadMultipleToCloudinary(files) {
  return Promise.all(Array.from(files).map(uploadToCloudinary))
}