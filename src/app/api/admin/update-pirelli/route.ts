import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/client';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Read the JSON file with product data
    const jsonPath = path.join(process.cwd(), 'scripts', 'pirelli_products.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
    const products = JSON.parse(jsonData);

    console.log(`Processing ${products.length} products...`);

    let updated = 0;
    let created = 0;
    let notFound = 0;
    let errors = 0;
    const errorDetails: any[] = [];

    // Get mode from query params
    const { searchParams } = new URL(request.url);
    const shouldCreate = searchParams.get('create') === 'true';

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
                stock: product.stock || 0,
                price: product.price || 0,
                priceList: product.price_list || product.list_price || product.price || 0,
                width: product.width || null,
                aspectRatio: product.aspect_ratio || null,
                rimDiameter: product.rim_diameter || null,
                category: product.category || existing.category || 'otro',
                updatedAt: new Date()
              }
            });
            return { status: 'updated', sku: product.sku };
          } else if (shouldCreate) {
            // Create new product if flag is set
            await prisma.product.create({
              data: {
                sku: product.sku,
                supplierCode: product.supplier_code || product.sku,
                name: product.name,
                brand: 'PIRELLI',
                stock: product.stock || 0,
                price: product.price || 0,
                priceList: product.price_list || product.list_price || product.price || 0,
                width: product.width || null,
                aspectRatio: product.aspect_ratio || null,
                rimDiameter: product.rim_diameter || null,
                category: product.category || 'otro',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            });
            return { status: 'created', sku: product.sku };
          } else {
            // Product doesn't exist and not creating
            return { status: 'not_found', sku: product.sku };
          }
        } catch (error: any) {
          errorDetails.push({ sku: product.sku, error: error.message });
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
    }

    const summary = {
      total: products.length,
      updated,
      created,
      notFound,
      errors,
      mode: shouldCreate ? 'update_and_create' : 'update_only',
      errorDetails: errorDetails.slice(0, 10) // Only show first 10 errors
    };

    return NextResponse.json({
      success: true,
      summary,
      message: `Successfully processed ${products.length} products`
    });

  } catch (error: any) {
    console.error('Fatal error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An error occurred during update'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Use POST method to update Pirelli products',
    usage: {
      updateOnly: 'POST /api/admin/update-pirelli',
      createAndUpdate: 'POST /api/admin/update-pirelli?create=true'
    }
  });
}