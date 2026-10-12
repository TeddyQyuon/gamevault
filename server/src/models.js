import { DataTypes } from 'sequelize'

// Table names are frozen (no pluralisation surprises) and match the migrations.
// NEVER call sequelize.sync() — schema changes go through migrations only.

export function defineModels(sequelize) {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Singapore' },
    // Public registration can never select this (see authController) — the
    // first admin is created with the documented server script.
    role: { type: DataTypes.ENUM('customer', 'admin'), allowNull: false, defaultValue: 'customer' },
    // Server-owned Stripe customer id. The browser NEVER sends this — the server
    // looks it up from the logged-in user on every billing request.
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: true, unique: true },
  }, { tableName: 'users' })

  const Session = sequelize.define('Session', {
    // SHA-256 hash of the random session token (the raw token only lives in the cookie).
    tokenHash: { type: DataTypes.CHAR(64), primaryKey: true },
    userId: { type: DataTypes.UUID, allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
  }, { tableName: 'sessions', updatedAt: false })

  const Product = sequelize.define('Product', {
    id: { type: DataTypes.STRING(48), primaryKey: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    brand: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    // Union of the catalogue enum (004) and the storefront's own values
    // ('games', 'subscriptions' — see 009). The seed mirrors the frontend
    // fixture data, so the model must accept those values too.
    category: { type: DataTypes.ENUM('streaming', 'music', 'gaming-membership', 'gift-cards', 'game-keys', 'mobile-topup', 'software', 'games', 'subscriptions'), allowNull: false },
    productType: { type: DataTypes.ENUM('gift_card', 'prepaid_voucher', 'game_key', 'direct_topup', 'recurring_service'), allowNull: false, defaultValue: 'gift_card' },
    tagline: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    shortDesc: { type: DataTypes.STRING(280), allowNull: false, defaultValue: '' },
    description: { type: DataTypes.TEXT, allowNull: false, defaultValue: '' },
    artKey: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'default' },
    region: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Singapore' },
    fulfilment: { type: DataTypes.ENUM('code_inventory', 'supplier', 'manual', 'demo_test'), allowNull: false, defaultValue: 'code_inventory' },
    supplierSku: { type: DataTypes.STRING(120), allowNull: true },
    publication: { type: DataTypes.ENUM('draft', 'published', 'archived'), allowNull: false, defaultValue: 'draft' },
    availability: { type: DataTypes.ENUM('available', 'out_of_stock', 'coming_soon'), allowNull: false, defaultValue: 'coming_soon' },
    redeemCountry: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Singapore' },
    redeemCurrency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'SGD' },
    redeemSteps: { type: DataTypes.JSON, allowNull: true },
    eligibility: { type: DataTypes.TEXT, allowNull: true },
    expiryInfo: { type: DataTypes.STRING(280), allowNull: false, defaultValue: '' },
    officialRefUrl: { type: DataTypes.STRING(500), allowNull: true },
    verifiedAt: { type: DataTypes.DATEONLY, allowNull: true },
    adminNote: { type: DataTypes.TEXT, allowNull: true },
    artworkPath: { type: DataTypes.STRING(255), allowNull: true },
    artworkFit: { type: DataTypes.ENUM('cover', 'contain'), allowNull: false, defaultValue: 'cover' },
    artworkSource: { type: DataTypes.STRING(280), allowNull: false, defaultValue: '' },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    trending: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    ratingsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  }, { tableName: 'products' })

  const Variant = sequelize.define('Variant', {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    productId: { type: DataTypes.STRING(48), allowNull: false },
    label: { type: DataTypes.STRING(120), allowNull: false },
    priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    compareAtCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    // Face value (what the code is worth) vs selling price (what we charge).
    // A USD-denominated card must never be labelled as SGD credit.
    faceValueCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    faceCurrency: { type: DataTypes.CHAR(3), allowNull: true },
    durationLabel: { type: DataTypes.STRING(60), allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 999 },
    // One-time (payment mode) vs genuine recurring (subscription mode).
    // Fixed-duration vouchers (e.g. prepaid 3-month codes) are ONE-TIME.
    billingType: { type: DataTypes.ENUM('one_time', 'recurring'), allowNull: false, defaultValue: 'one_time' },
    billingInterval: { type: DataTypes.ENUM('month', 'year'), allowNull: true },
    // Optional pre-created Stripe Price id. When null the server builds
    // price_data from the DB price at session time (zero dashboard setup).
    stripePriceId: { type: DataTypes.STRING(64), allowNull: true },
    supplierSku: { type: DataTypes.STRING(120), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // When true, purchase quantity is limited by available inventory codes.
    trackInventory: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  }, { tableName: 'variants' })

  const PromoCode = sequelize.define('PromoCode', {
    code: { type: DataTypes.STRING(32), primaryKey: true },
    description: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    discountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    minSubtotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    // Lazily created Stripe Coupon id, cached here so we create it exactly once.
    stripeCouponId: { type: DataTypes.STRING(64), allowNull: true },
  }, { tableName: 'promo_codes' })

  const Order = sequelize.define('Order', {
    // Human-readable public id, e.g. GV-8F3K2A.
    id: { type: DataTypes.STRING(16), primaryKey: true },
    // Nullable for guest checkout (no login). Guest rows are claimed via the
    // Stripe session id on the success page; logged-in rows use owner scoping.
    userId: { type: DataTypes.UUID, allowNull: true },
    mode: { type: DataTypes.ENUM('payment', 'subscription'), allowNull: false },
    // Payment state (from verified Stripe webhooks ONLY) is separate from
    // fulfilment state (did the customer get their codes/entitlement?).
    payStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'failed', 'expired', 'canceled'),
      allowNull: false, defaultValue: 'pending',
    },
    fulfilStatus: {
      type: DataTypes.ENUM('pending', 'fulfilled', 'unfulfilled'),
      allowNull: false, defaultValue: 'pending',
    },
    subtotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    discountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    totalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'SGD' },
    promoCode: { type: DataTypes.STRING(32), allowNull: true },
    contactName: { type: DataTypes.STRING(160), allowNull: false, defaultValue: '' },
    contactEmail: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
    paidAt: { type: DataTypes.DATE, allowNull: true },
    contactCountry: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    stripeSessionId: { type: DataTypes.STRING(128), allowNull: true, unique: true },
    stripePaymentIntentId: { type: DataTypes.STRING(64), allowNull: true },
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: true },
    stripeSubscriptionId: { type: DataTypes.STRING(64), allowNull: true },
    // Connect hold-and-release (007): null = legacy direct platform sale.
    connectPattern: { type: DataTypes.STRING(16), allowNull: true },
    connectTransferStatus: { type: DataTypes.STRING(24), allowNull: true },
    platformFeeCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  }, { tableName: 'orders' })

  const OrderItem = sequelize.define('OrderItem', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: { type: DataTypes.STRING(16), allowNull: false },
    // No FK to variants on purpose: the snapshot must survive catalogue edits.
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    productTitle: { type: DataTypes.STRING(160), allowNull: false },
    variantLabel: { type: DataTypes.STRING(120), allowNull: false },
    unitCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    lineTotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    // Snapshots: historical orders never change when catalogue art edits.
    imagePath: { type: DataTypes.STRING(255), allowNull: true },
    productType: { type: DataTypes.STRING(32), allowNull: false, defaultValue: 'gift_card' },
    playerRef: { type: DataTypes.STRING(120), allowNull: true },
    fulfilment: { type: DataTypes.STRING(32), allowNull: true },
    region: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    deliveryWindowMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    deliveredAt: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'order_items' })

  const CheckoutAttempt = sequelize.define('CheckoutAttempt', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // Nullable for guests. Logged-in rows keep the (userId, fingerprint)
    // unique pair; guest rows (NULL userId) dedupe by fingerprint alone since
    // the fingerprint already embeds the contact email.
    userId: { type: DataTypes.UUID, allowNull: true },
    orderId: { type: DataTypes.STRING(16), allowNull: false, unique: true },
    // sha256(mode | sorted variantId:qty | promo | email). Same cart + same
    // promo = same attempt → we reuse the open Stripe session instead of
    // creating duplicates. A changed cart yields a new fingerprint → new attempt.
    fingerprint: { type: DataTypes.CHAR(64), allowNull: false },
    stripeSessionId: { type: DataTypes.STRING(128), allowNull: true },
    version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM('open', 'superseded', 'completed', 'expired'),
      allowNull: false, defaultValue: 'open',
    },
  }, {
    tableName: 'checkout_attempts',
    indexes: [{ unique: true, fields: ['userId', 'fingerprint'] }],
  })

  const Subscription = sequelize.define('Subscription', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    // Nullable so a guest can buy a recurring plan without an account.
    userId: { type: DataTypes.UUID, allowNull: true },
    planName: { type: DataTypes.STRING(160), allowNull: false },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    stripeSubscriptionId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: false },
    stripePriceId: { type: DataTypes.STRING(64), allowNull: true },
    interval: { type: DataTypes.ENUM('month', 'year'), allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled'),
      allowNull: false, defaultValue: 'incomplete',
    },
    // Paid access follows PAID INVOICE PERIODS (see subscriptionService).
    currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
    currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
    cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastInvoiceId: { type: DataTypes.STRING(64), allowNull: true },
  }, {
    tableName: 'subscriptions',
    indexes: [{ fields: ['userId'] }],
  })

  const StripeEvent = sequelize.define('StripeEvent', {
    // Stripe event id (evt_...) — PRIMARY KEY gives us duplicate detection free.
    eventId: { type: DataTypes.STRING(128), primaryKey: true },
    type: { type: DataTypes.STRING(80), allowNull: false },
    status: {
      type: DataTypes.ENUM('received', 'processed', 'failed'),
      allowNull: false, defaultValue: 'received',
    },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    // Short error summary only — never full payloads or secrets.
    lastError: { type: DataTypes.STRING(500), allowNull: true },
    receivedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'stripe_events', updatedAt: false })

  const CodeAllocation = sequelize.define('CodeAllocation', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderItemId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    // DEMO/TEST plaintext (test path) or INV-<id> placeholder (live path —
    // the code resolves from the encrypted inventory row at read time).
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    inventoryCodeId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    isRevealed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    revealedAt: { type: DataTypes.DATE, allowNull: true },
    revealIp: { type: DataTypes.STRING(45), allowNull: true },
    revealUserAgent: { type: DataTypes.STRING(255), allowNull: true },
  }, { tableName: 'code_allocations', updatedAt: false })

  // --- catalogue operations tables (migration 004) ---

  const InventoryCode = sequelize.define('InventoryCode', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    // AES-256-GCM ciphertext (see services/codeCrypto.js). Plaintext is never
    // stored, logged, or returned except to the paying order owner on delivery.
    codeCipher: { type: DataTypes.TEXT, allowNull: false },
    codeHash: { type: DataTypes.CHAR(64), allowNull: false, unique: true },
    codeMasked: { type: DataTypes.STRING(32), allowNull: false },
    status: {
      type: DataTypes.ENUM('available', 'reserved', 'delivered', 'invalidated'),
      allowNull: false, defaultValue: 'available',
    },
    reservedByAttemptId: { type: DataTypes.UUID, allowNull: true },
    reservedUntil: { type: DataTypes.DATE, allowNull: true },
    orderItemId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    batchId: { type: DataTypes.UUID, allowNull: true },
  }, {
    tableName: 'inventory_codes',
    indexes: [{ fields: ['variantId', 'status'] }, { fields: ['reservedUntil'] }],
  })

  const CodeImport = sequelize.define('CodeImport', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    filename: { type: DataTypes.STRING(200), allowNull: false },
    totalRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    importedRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    duplicateRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    errorRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    errors: { type: DataTypes.JSON, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
  }, { tableName: 'code_imports', updatedAt: false })

  const ProductAsset = sequelize.define('ProductAsset', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    productId: { type: DataTypes.STRING(48), allowNull: true },
    slot: { type: DataTypes.STRING(80), allowNull: true },
    kind: { type: DataTypes.ENUM('thumbnail', 'gallery', 'banner'), allowNull: false, defaultValue: 'gallery' },
    path: { type: DataTypes.STRING(255), allowNull: false },
    thumbPath: { type: DataTypes.STRING(255), allowNull: true },
    alt: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    isPrimary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    width: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    height: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    sizeBytes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    focalX: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    focalY: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 50 },
    source: { type: DataTypes.STRING(280), allowNull: false, defaultValue: '' },
  }, {
    tableName: 'product_assets',
    indexes: [{ fields: ['productId'] }, { fields: ['slot'] }],
  })

  const SupplierOrder = sequelize.define('SupplierOrder', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderItemId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    adapter: { type: DataTypes.STRING(40), allowNull: false, defaultValue: 'manual' },
    extRef: { type: DataTypes.STRING(160), allowNull: true },
    status: {
      type: DataTypes.ENUM('pending', 'placed', 'fulfilled', 'failed', 'cancelled'),
      allowNull: false, defaultValue: 'pending',
    },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lastError: { type: DataTypes.STRING(500), allowNull: true },
    nextRetryAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'supplier_orders',
    indexes: [{ fields: ['orderItemId'] }],
  })

  const AdminAudit = sequelize.define('AdminAudit', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    adminUserId: { type: DataTypes.UUID, allowNull: true },
    entity: { type: DataTypes.STRING(40), allowNull: false },
    entityId: { type: DataTypes.STRING(120), allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    diff: { type: DataTypes.JSON, allowNull: true },
  }, {
    tableName: 'admin_audit',
    updatedAt: false,
    indexes: [{ fields: ['entity', 'entityId'] }],
  })

  const SupportRequest = sequelize.define('SupportRequest', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    orderReference: { type: DataTypes.STRING(32), allowNull: false, defaultValue: '' },
    topic: { type: DataTypes.STRING(32), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('open', 'resolved'), allowNull: false, defaultValue: 'open' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
  }, { tableName: 'support_requests', indexes: [{ fields: ['status', 'createdAt'] }] })

  const ConnectedAccount = sequelize.define('ConnectedAccount', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerUserId: { type: DataTypes.UUID, allowNull: true },
    stripeAccountId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    dashboard: { type: DataTypes.ENUM('express', 'full', 'none'), allowNull: false, defaultValue: 'express' },
    feesCollector: { type: DataTypes.ENUM('stripe', 'application'), allowNull: false, defaultValue: 'application' },
    lossesCollector: { type: DataTypes.ENUM('stripe', 'application'), allowNull: false, defaultValue: 'application' },
    chargePattern: { type: DataTypes.ENUM('destination', 'direct', 'separate'), allowNull: false, defaultValue: 'destination' },
    status: { type: DataTypes.ENUM('onboarding', 'active', 'restricted', 'closed'), allowNull: false, defaultValue: 'onboarding' },
  }, {
    tableName: 'connected_accounts',
    indexes: [{ fields: ['sellerUserId'] }],
  })

  const OrderTransfer = sequelize.define('OrderTransfer', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: { type: DataTypes.STRING(16), allowNull: false },
    stripeAccountId: { type: DataTypes.STRING(64), allowNull: false },
    amountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'SGD' },
    status: {
      type: DataTypes.ENUM('pending', 'released', 'reversed', 'failed'),
      allowNull: false, defaultValue: 'pending',
    },
    stripeTransferId: { type: DataTypes.STRING(64), allowNull: true },
    lastError: { type: DataTypes.STRING(500), allowNull: true },
  }, {
    tableName: 'order_transfers',
    indexes: [{ fields: ['orderId'] }, { fields: ['stripeAccountId'] }],
  })

  // Associations (ownership checks use these).
  User.hasMany(Session, { foreignKey: 'userId', onDelete: 'CASCADE' })
  Session.belongsTo(User, { foreignKey: 'userId' })
  User.hasMany(Order, { foreignKey: 'userId' })
  Order.belongsTo(User, { foreignKey: 'userId' })
  User.hasMany(Subscription, { foreignKey: 'userId' })
  Subscription.belongsTo(User, { foreignKey: 'userId' })
  User.hasMany(CheckoutAttempt, { foreignKey: 'userId' })
  Product.hasMany(Variant, { foreignKey: 'productId', onDelete: 'CASCADE' })
  Variant.belongsTo(Product, { foreignKey: 'productId' })
  Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' })
  OrderItem.belongsTo(Order, { foreignKey: 'orderId' })
  OrderItem.hasMany(CodeAllocation, { foreignKey: 'orderItemId', onDelete: 'CASCADE' })
  CodeAllocation.belongsTo(OrderItem, { foreignKey: 'orderItemId' })
  Product.hasMany(ProductAsset, { foreignKey: 'productId', onDelete: 'CASCADE' })
  OrderItem.hasMany(SupplierOrder, { foreignKey: 'orderItemId', onDelete: 'CASCADE' })
  Order.hasMany(OrderTransfer, { foreignKey: 'orderId', onDelete: 'CASCADE' })
  OrderTransfer.belongsTo(Order, { foreignKey: 'orderId' })

  return { User, Session, Product, Variant, PromoCode, Order, OrderItem, CheckoutAttempt, Subscription, StripeEvent, CodeAllocation, InventoryCode, CodeImport, ProductAsset, SupplierOrder, AdminAudit, SupportRequest, ConnectedAccount, OrderTransfer }
}
