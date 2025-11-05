const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function updatePirelliProducts() {
  console.log('🚀 Starting Pirelli products database update...\n');

  try {
    // Read the JSON file with product data
    const jsonPath = path.join(__dirname, 'pirelli_products.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const products = JSON.parse(jsonData);

    console.log(`📦 Processing ${products.length} products...\n`);

    let updated = 0;
    let created = 0;
    let notFound = 0;
    let errors = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));

      const updatePromises = batch.map(async (product) => {
        try {
          // First check if product exists
          const existing = await prisma.product.findFirst({
            where: {
              sku: product.sku,
              brand: 'PIRELLI'
            }
          });

          if (existing) {
            // Update existing product
            await prisma.product.update({
              where: {
                id: existing.id
              },
              data: {
                name: product.name,
                stock: product.stock,
                price: product.price,
                priceList: product.price_list || product.list_price,
                width: product.width || undefined,
                aspectRatio: product.aspect_ratio || undefined,
                rimDiameter: product.rim_diameter || undefined,
                category: product.category || existing.category,
                updatedAt: new Date()
              }
            });
            return { status: 'updated', sku: product.sku };
          } else if (process.argv.includes('--create')) {
            // Create new product if flag is set
            await prisma.product.create({
              data: {
                sku: product.sku,
                supplierCode: product.supplier_code || product.sku,
                name: product.name,
                brand: 'PIRELLI',
                stock: product.stock,
                price: product.price,
                priceList: product.price_list || product.list_price,
                width: product.width || null,
                aspectRatio: product.aspect_ratio || null,
                rimDiameter: product.rim_diameter || null,
                category: product.category || 'otro',
                isActive: true,
                updatedAt: new Date()
              }
            });
            return { status: 'created', sku: product.sku };
          } else {
            // Product doesn't exist and not creating
            return { status: 'not_found', sku: product.sku };
          }
        } catch (error) {
          console.error(`❌ Error with SKU ${product.sku}:`, error.message);
          return { status: 'error', sku: product.sku, error };
        }
      });

      const results = await Promise.all(updatePromises);

      // Count results
      results.forEach(result => {
        if (result.status === 'updated') updated++;
        else if (result.status === 'created') created++;
        else if (result.status === 'not_found') notFound++;
        else if (result.status === 'error') errors++;
      });

      // Progress indicator
      const progress = Math.min(i + batchSize, products.length);
      console.log(`Progress: ${progress}/${products.length} (${Math.round(progress * 100 / products.length)}%)`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('                   UPDATE SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${updated} products`);
    if (created > 0) {
      console.log(`✨ Created new: ${created} products`);
    }
    if (notFound > 0) {
      console.log(`⚠️  Products not found: ${notFound}`);
    }
    if (errors > 0) {
      console.log(`❌ Errors: ${errors}`);
    }
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // If many products weren't found, offer to create them
    if (notFound > 0 && !process.argv.includes('--create')) {
      console.log('\n💡 Tip: Run with --create flag to create missing products');
      console.log('   Example: node scripts/update_pirelli_db.js --create');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Check if we should create missing products
const shouldCreate = process.argv.includes('--create');

if (shouldCreate) {
  console.log('🔄 Mode: Update existing and CREATE missing products\n');
} else {
  console.log('🔄 Mode: Update existing products only\n');
}

// Run the update
updatePirelliProducts()
  .then(() => {
    console.log('\n✨ Database update completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Update failed:', error);
    process.exit(1);
  });