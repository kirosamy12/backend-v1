// POST /api/upload/brand-logo
export const uploadBrandLogoHandler = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.json({ url: req.file.path, public_id: req.file.filename })
}

// POST /api/upload/product-images
export const uploadProductImagesHandler = (req, res) => {
  if (!req.files?.length) return res.status(400).json({ message: 'No files uploaded' })
  const urls = req.files.map(f => f.path)
  res.json({ urls })
}

// POST /api/upload/avatar
export const uploadAvatarHandler = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
  res.json({ url: req.file.path })
}
