import Product from '../models/Product.js'

// GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, category, brand, search, sort = '-createdAt', minPrice, maxPrice } = req.query
    const query = { status: { $ne: 'inactive' } }

    if (category) query.category = category
    if (brand) query.brand = brand
    if (search) query.$text = { $search: search }
    if (minPrice || maxPrice) {
      query.price = {}
      if (minPrice) query.price.$gte = Number(minPrice)
      if (maxPrice) query.price.$lte = Number(maxPrice)
    }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .populate('brand', 'name logo')
      .populate('category', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ products, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) { next(err) }
}

// GET /api/products/:id
export const getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('brand', 'name logo shippingFee freeShippingMin')
      .populate('category', 'name slug')
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ product })
  } catch (err) { next(err) }
}

// POST /api/products (brand only)
export const createProduct = async (req, res, next) => {
  try {
    const { category, ...rest } = req.body
    let categoryId = null

    if (category) {
      // Try to find category by name or use as ObjectId
      const Category = (await import('../models/Category.js')).default
      let cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } })
      if (!cat) {
        // Create it if doesn't exist
        const slug = category.toLowerCase().replace(/\s+/g, '-')
        cat = await Category.create({ name: category, slug })
      }
      categoryId = cat._id
    }

    const product = await Product.create({
      ...rest,
      brand: req.brand._id,
      ...(categoryId ? { category: categoryId } : {}),
    })

    await product.populate('brand', 'name logo')
    if (categoryId) await product.populate('category', 'name slug')

    res.status(201).json({ product })
  } catch (err) { next(err) }
}

// PUT /api/products/:id (brand only)
export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, brand: req.brand._id },
      req.body,
      { new: true, runValidators: true }
    )
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ product })
  } catch (err) { next(err) }
}

// DELETE /api/products/:id (brand only)
export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, brand: req.brand._id })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deleted' })
  } catch (err) { next(err) }
}

// GET /api/brand/products (brand's own products)
export const getBrandProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query
    const query = { brand: req.brand._id }
    if (status) query.status = status
    if (search) query.$text = { $search: search }

    const total = await Product.countDocuments(query)
    const products = await Product.find(query)
      .populate('category', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ products, total })
  } catch (err) { next(err) }
}
