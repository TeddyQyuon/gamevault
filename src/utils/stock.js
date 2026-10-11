export function variantInStock(variant) {
  return variant?.inStock !== undefined ? Boolean(variant.inStock) : Number(variant?.stock) > 0
}

export function variantQuantityLimit(variant) {
  if (!variantInStock(variant)) return 0
  return variant.stockMode === 'on_demand' || variant.stock === 999 ? 5 : Math.min(5, Number(variant.stock))
}
