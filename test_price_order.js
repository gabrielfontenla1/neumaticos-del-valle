const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navegar a la página de productos
  await page.goto('http://localhost:6001/productos', {
    waitUntil: 'networkidle2',
    timeout: 30000
  });

  // Esperar a que los productos se carguen
  await page.waitForSelector('[data-testid="product-card"]', { timeout: 10000 }).catch(() => {
    console.log('No se encontraron cards con data-testid, buscando alternativas...');
  });

  // Esperar un poco más para asegurar que todo esté cargado
  await page.waitForTimeout(2000);

  // Extraer información de los productos
  const products = await page.evaluate(() => {
    // Intentar encontrar las tarjetas de productos
    const productCards = document.querySelectorAll('article, [class*="product"], [class*="card"]');
    const productData = [];

    productCards.forEach((card, index) => {
      // Buscar el precio en diferentes formatos posibles
      const priceElement = card.querySelector('[class*="price"], [class*="precio"], .text-2xl, .font-bold');
      const nameElement = card.querySelector('h3, h2, [class*="title"], [class*="name"]');

      if (priceElement) {
        const priceText = priceElement.textContent || '';
        // Extraer número del precio
        const priceMatch = priceText.match(/[\d,]+(?:\.\d+)?/);
        if (priceMatch) {
          const price = parseFloat(priceMatch[0].replace(/,/g, ''));
          const name = nameElement ? nameElement.textContent.trim() : `Producto ${index + 1}`;
          productData.push({
            name: name,
            priceText: priceText.trim(),
            price: price,
            index: index + 1
          });
        }
      }
    });

    return productData;
  });

  console.log('\n=== VERIFICACIÓN DE ORDEN DE PRECIOS ===\n');
  console.log(`Se encontraron ${products.length} productos con precio visible:\n`);

  // Mostrar los primeros 10 productos
  const productsToShow = products.slice(0, 10);
  productsToShow.forEach((product, i) => {
    console.log(`${product.index}. ${product.name}`);
    console.log(`   Precio: ${product.priceText} (${product.price})`);
  });

  // Verificar si están ordenados de menor a mayor
  let isOrdered = true;
  for (let i = 1; i < products.length; i++) {
    if (products[i].price < products[i-1].price) {
      isOrdered = false;
      console.log(`\n⚠️ Desorden encontrado:`);
      console.log(`   Producto ${products[i-1].index}: $${products[i-1].price}`);
      console.log(`   Producto ${products[i].index}: $${products[i].price}`);
      break;
    }
  }

  if (isOrdered && products.length > 0) {
    console.log('\n✅ ¡CORRECTO! Los productos están ordenados de menor a mayor precio.');
    console.log(`   Precio mínimo: $${products[0].price}`);
    console.log(`   Precio máximo: $${products[products.length - 1].price}`);
  } else if (products.length === 0) {
    console.log('\n❌ No se pudieron encontrar productos con precios.');
  } else {
    console.log('\n❌ Los productos NO están ordenados correctamente por precio.');
  }

  // Tomar screenshot
  await page.screenshot({ path: 'productos-verificacion.png', fullPage: false });
  console.log('\n📸 Screenshot guardado como productos-verificacion.png');

  await browser.close();
})();