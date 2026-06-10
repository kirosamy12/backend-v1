import Order from '../models/Order.js'
import Product from '../models/Product.js'
import Coupon from '../models/Coupon.js'
import Cart from '../models/Cart.js'

// ─── Shared order builder ─────────────────────────────────────
async function buildOrder({ items, shippingAddress, paymentMethod, couponCode, userId, guestInfo }) {
  let subtotal = 0
  const orderItems = []

  for (const item of items) {
    const product = await Product.findById(item.product).populate('brand', '_id')
    if (!product) throw { status: 404, message: `Product ${item.product} not found` }
    if (product.stock < item.quantity) throw { status: 400, message: `Insufficient stock for ${product.name}` }

    orderItems.push({
      product: product._id,
      brand: product.brand._id,
      name: product.name,
      image: product.images[0] || '',
      price: product.price,
      size: item.size || '',
      color: item.color || '',
      quantity: item.quantity,
    })

    subtotal += product.price * item.quantity
    await Product.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity, sold: item.quantity } })
  }

  // Coupon
  let discount = 0
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true })
    if (coupon && (!coupon.expiresAt || coupon.expiresAt > new Date()) && subtotal >= coupon.minOrder) {
      discount = coupon.type === 'percentage' ? (subtotal * coupon.value) / 100 : coupon.value
      await Coupon.findByIdAndUpdate(coupon._id, { $inc: { usedCount: 1 } })
    }
  }

  const shippingFee = subtotal - discount >= 200 ? 0 : 15
  const total = subtotal - discount + shippingFee

  const orderData = {
    items: orderItems,
    shippingAddress,
    subtotal,
    discount,
    shippingFee,
    total,
    coupon: couponCode || '',
    paymentMethod: paymentMethod || 'cash',
  }

  if (userId) orderData.user = userId
  if (guestInfo) orderData.guestInfo = guestInfo

  return Order.create(orderData)
}

// POST /api/orders  (authenticated user)
export const createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body
    const order = await buildOrder({ items, shippingAddress, paymentMethod, couponCode, userId: req.user._id })
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] })
    res.status(201).json({ order })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// POST /api/orders/guest  (no auth required)
export const createGuestOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode, guestInfo } = req.body

    if (!guestInfo?.name || !guestInfo?.phone) {
      return res.status(400).json({ message: 'Name and phone are required' })
    }
    if (!items?.length) {
      return res.status(400).json({ message: 'No items in order' })
    }

    const order = await buildOrder({ items, shippingAddress, paymentMethod, couponCode, guestInfo })
    res.status(201).json({ order })
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message })
    next(err)
  }
}

// GET /api/orders (user's orders)
export const getUserOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const total = await Order.countDocuments({ user: req.user._id })
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ orders, total })
  } catch (err) { next(err) }
}

// GET /api/orders/:id
export const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
      .populate('items.product', 'name images')
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ order })
  } catch (err) { next(err) }
}

// GET /api/brand/orders
export const getBrandOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const query = { 'items.brand': req.brand._id }
    if (status) query.status = status

    const total = await Order.countDocuments(query)
    const orders = await Order.find(query)
      .populate('user', 'name email')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))

    res.json({ orders, total })
  } catch (err) { next(err) }
}

// PUT /api/brand/orders/:id/status
export const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, 'items.brand': req.brand._id },
      { status },
      { new: true }
    )
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json({ order })
  } catch (err) { next(err) }
}
