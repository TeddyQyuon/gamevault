import { DataTypes } from 'sequelize'

// 004 — real-world catalogue: product types, publication workflow, regions,
// fulfilment sources, encrypted inventory, assets, audit, admin roles.
// Additive only: historical orders and fixtures keep working.

export const name = '004_catalogue'

export async function up(qi) {
  // --- roles: public registration can never select admin (see authController) ---
  await qi.sequelize.query(`ALTER TABLE \`users\` ADD COLUMN \`role\` ENUM('customer','admin') NOT NULL DEFAULT 'customer' AFTER \`country\``)

  // --- products: richer merchandising + workflow state ---
  await qi.sequelize.query(`ALTER TABLE \`products\`
    MODIFY COLUMN \`category\` ENUM('streaming','music','gaming-membership','gift-cards','game-keys','mobile-topup','software') NOT NULL`)
  await qi.sequelize.query(`ALTER TABLE \`products\`
    ADD COLUMN \`brand\` VARCHAR(80) NOT NULL DEFAULT '' AFTER \`title\`,
    ADD COLUMN \`shortDesc\` VARCHAR(280) NOT NULL DEFAULT '' AFTER \`tagline\`,
    ADD COLUMN \`productType\` ENUM('gift_card','prepaid_voucher','game_key','direct_topup','recurring_service') NOT NULL DEFAULT 'gift_card' AFTER \`category\`,
    ADD COLUMN \`region\` VARCHAR(80) NOT NULL DEFAULT 'Singapore' AFTER \`artKey\`,
    ADD COLUMN \`fulfilment\` ENUM('code_inventory','supplier','manual','demo_test') NOT NULL DEFAULT 'code_inventory' AFTER \`region\`,
    ADD COLUMN \`supplierSku\` VARCHAR(120) NULL AFTER \`fulfilment\`,
    ADD COLUMN \`publication\` ENUM('draft','published','archived') NOT NULL DEFAULT 'draft' AFTER \`supplierSku\`,
    ADD COLUMN \`availability\` ENUM('available','out_of_stock','coming_soon') NOT NULL DEFAULT 'coming_soon' AFTER \`publication\`,
    ADD COLUMN \`redeemCountry\` VARCHAR(80) NOT NULL DEFAULT 'Singapore' AFTER \`availability\`,
    ADD COLUMN \`redeemCurrency\` CHAR(3) NOT NULL DEFAULT 'SGD' AFTER \`redeemCountry\`,
    ADD COLUMN \`redeemSteps\` JSON NULL AFTER \`redeemCurrency\`,
    ADD COLUMN \`eligibility\` TEXT NULL AFTER \`redeemSteps\`,
    ADD COLUMN \`expiryInfo\` VARCHAR(280) NOT NULL DEFAULT '' AFTER \`eligibility\`,
    ADD COLUMN \`officialRefUrl\` VARCHAR(500) NULL AFTER \`expiryInfo\`,
    ADD COLUMN \`verifiedAt\` DATE NULL AFTER \`officialRefUrl\`,
    ADD COLUMN \`adminNote\` TEXT NULL AFTER \`verifiedAt\`,
    ADD COLUMN \`artworkPath\` VARCHAR(255) NULL AFTER \`adminNote\`,
    ADD COLUMN \`artworkFit\` ENUM('cover','contain') NOT NULL DEFAULT 'cover' AFTER \`artworkPath\`,
    ADD COLUMN \`artworkSource\` VARCHAR(280) NOT NULL DEFAULT '' AFTER \`artworkFit\``)
  await qi.sequelize.query('CREATE INDEX `products_pub_idx` ON `products` (`publication`, `category`)')
  await qi.sequelize.query('CREATE INDEX `products_brand_idx` ON `products` (`brand`)')

  // --- variants: face value vs selling price, durations, inventory tracking ---
  await qi.sequelize.query(`ALTER TABLE \`variants\`
    ADD COLUMN \`faceValueCents\` INT UNSIGNED NULL AFTER \`compareAtCents\`,
    ADD COLUMN \`faceCurrency\` CHAR(3) NULL AFTER \`faceValueCents\`,
    ADD COLUMN \`durationLabel\` VARCHAR(60) NULL AFTER \`faceCurrency\`,
    ADD COLUMN \`supplierSku\` VARCHAR(120) NULL AFTER \`billingInterval\`,
    ADD COLUMN \`trackInventory\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`active\``)

  // --- encrypted code inventory (redeemable codes NEVER in plaintext) ---
  await qi.createTable('inventory_codes', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
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
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('inventory_codes', ['variantId', 'status'])
  await qi.addIndex('inventory_codes', ['reservedUntil'])

  await qi.createTable('code_imports', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    filename: { type: DataTypes.STRING(200), allowNull: false },
    totalRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    importedRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    duplicateRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    errorRows: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    errors: { type: DataTypes.JSON, allowNull: true },
    createdBy: { type: DataTypes.UUID, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  })

  // --- product assets (thumbnails, gallery, banners) ---
  await qi.createTable('product_assets', {
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
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('product_assets', ['productId'])
  await qi.addIndex('product_assets', ['slot'])

  // --- supplier fulfilment jobs (async boundary, retryable) ---
  await qi.createTable('supplier_orders', {
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
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('supplier_orders', ['orderItemId'])

  // --- audit log: price, inventory, publication, fulfilment changes ---
  await qi.createTable('admin_audit', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    adminUserId: { type: DataTypes.UUID, allowNull: true },
    entity: { type: DataTypes.STRING(40), allowNull: false },
    entityId: { type: DataTypes.STRING(120), allowNull: false },
    action: { type: DataTypes.STRING(80), allowNull: false },
    diff: { type: DataTypes.JSON, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('admin_audit', ['entity', 'entityId'])
}
