import Cart from '../models/Cart.js'
import Product from '../models/Product.js'

// GET /api/cart
export const getCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name images price stock brand')
    res.json({ cart: cart || { items: [] } })
  } catch (err) { next(err) }
}

// POST /api/cart/items
export const addToCart = async (req, res, next) => {
  try {
    const { product: productId, quantity = 1, size, color } = req.body

    const product = await Product.findById(productId)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.stock < quantity) return res.status(400).json({ message: 'Insufficient stock' })

    let cart = await Cart.findOne({ user: req.user._id })
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] })

    const existingIdx = cart.items.findIndex(
      i => i.product.toString() === productId && i.size === size && i.color === color
    )

    if (existingIdx > -1) {
      cart.items[existingIdx].quantity += quantity
    } else {
      cart.items.push({ product: productId, quantity, size: size || '', color: color || '' })
    }

    await cart.save()
    await cart.populate('items.product', 'name images price stock')
    res.json({ cart })
  } catch (err) { next(err) }
}

// PUT /api/cart/items/:itemId
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ message: 'Cart not found' })

    const item = cart.items.id(req.params.itemId)
    if (!item) return res.status(404).json({ message: 'Item not found' })

    if (quantity <= 0) {
      item.deleteOne()
    } else {
      item.quantity = quantity
    }

    await cart.save()
    await cart.populate('items.product', 'name images price stock')
    res.json({ cart })
  } catch (err) { next(err) }
}

// DELETE /api/cart/items/:itemId
export const removeCartItem = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
    if (!cart) return res.status(404).json({ message: 'Cart not found' })

    cart.items = cart.items.filter(i => i._id.toString() !== req.params.itemId)
    await cart.save()
    res.json({ cart })
  } catch (err) { next(err) }
}

// DELETE /api/cart
export const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })
    res.json({ message: 'Cart cleared' })
  } catch (err) { next(err) }
}
