import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import Brand from '../models/Brand.js'
import Category from '../models/Category.js'
import Product from '../models/Product.js'

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Clear existing
  await Promise.all([Brand.deleteMany(), Category.deleteMany(), Product.deleteMany()])

  // Categories
  const categories = await Category.insertMany([
    { name: 'T-Shirts', slug: 't-shirts', order: 1 },
    { name: 'Jeans', slug: 'jeans', order: 2 },
    { name: 'Shirts', slug: 'shirts', order: 3 },
    { name: 'Shorts', slug: 'shorts', order: 4 },
    { name: 'Dresses', slug: 'dresses', order: 5 },
  ])
  console.log('✅ Categories seeded')

  // Brands
  const hashedPassword = await bcrypt.hash('brand123', 12)
  const brands = await Brand.insertMany([
    { name: 'Nike', email: 'nike@shop.co', password: hashedPassword, status: 'active', description: 'Just Do It' },
    { name: 'Zara', email: 'zara@shop.co', password: hashedPassword, status: 'active', description: 'Fashion for all' },
    { name: 'Gucci', email: 'gucci@shop.co', password: hashedPassword, status: 'active', description: 'Luxury fashion' },
  ])
  console.log('✅ Brands seeded')

  // Products
  const tshirts = categories.find(c => c.slug === 't-shirts')
  const jeans = categories.find(c => c.slug === 'jeans')
  const shirts = categories.find(c => c.slug === 'shirts')
  const nike = brands.find(b => b.name === 'Nike')
  const zara = brands.find(b => b.name === 'Zara')

  await Product.insertMany([
    { brand: nike._id, category: tshirts._id, name: 'T-Shirt with Tape Details', price: 120, stock: 45, sizes: ['S', 'M', 'L', 'XL'], colors: ['White', 'Black'] },
    { brand: zara._id, category: jeans._id, name: 'Skinny Fit Jeans', price: 240, originalPrice: 260, stock: 12, sizes: ['28', '30', '32', '34'] },
    { brand: nike._id, category: shirts._id, name: 'Checkered Shirt', price: 180, stock: 0 },
    { brand: zara._id, category: tshirts._id, name: 'Sleeve Striped T-Shirt', price: 130, originalPrice: 160, stock: 67 },
    { brand: nike._id, category: tshirts._id, name: 'Courage Graphic T-Shirt', price: 145, stock: 34 },
    { brand: zara._id, category: jeans._id, name: 'Faded Skinny Jeans', price: 210, stock: 28 },
  ])
  console.log('✅ Products seeded')

  console.log('\n🎉 Seed complete!')
  console.log('Brand login: nike@shop.co / brand123')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
