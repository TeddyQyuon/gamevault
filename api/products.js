import { PRODUCTS } from '../src/data/products.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')
  res.status(200).json({ products: PRODUCTS })
}
