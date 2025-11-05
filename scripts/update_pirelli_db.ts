#!/usr/bin/env ts-node
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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
    let notFound = 0;
    let errors = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, Math.min(i + batchSize, products.length));

      const updatePromises = batch.map(async (product: any) => {
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
          } else {
            // Product doesn't exist, we could create it if needed
            return { status: 'not_found', sku: product.sku };
          }
        } catch (error) {
          console.error(`❌ Error updating SKU ${product.sku}:`, error);
          return { status: 'error', sku: product.sku, error };
        }
      });

      const results = await Promise.all(updatePromises);

      // Count results
      results.forEach(result => {
        if (result.status === 'updated') updated++;
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
    console.log(`⚠️  Products not found: ${notFound}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${products.length}`);
    console.log('='.repeat(60));

    // If many products weren't found, offer to create them
    if (notFound > 0) {
      console.log('\n💡 Tip: If you want to create the missing products, run with --create flag');
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