// strapi-cms/config/functions/bootstrap.js
module.exports = async () => {
    // Check if products exist, if not, recreate them automatically
    const existingProducts = await strapi.db.query('api::product.product').findMany();
    
    if (existingProducts.length === 0) {
      console.log('🔄 No products found, auto-importing default products...');
      
      const defaultProducts = [
        {
          name: "Engagement Ring 1",
          weight: 2.1,
          popularityScore: 0.85,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-Y.jpg?v=1696588368",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-R.jpg?v=1696588406",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-W.jpg?v=1696588402"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 2",
          weight: 3.4,
          popularityScore: 0.51,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-Y.jpg?v=1707727068",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-R.jpg?v=1707727068",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-W.jpg?v=1707727068"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 3",
          weight: 3.8,
          popularityScore: 0.92,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-Y.jpg?v=1683534032",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-R.jpg?v=1683534032",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-W.jpg?v=1683534032"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 4",
          weight: 4.5,
          popularityScore: 0.88,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-Y.jpg?v=1683532153",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-R.jpg?v=1683532153",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-W.jpg?v=1683532153"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 5",
          weight: 2.5,
          popularityScore: 0.8,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-Y.jpg?v=1696232035",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-R.jpg?v=1696927124",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-W.jpg?v=1696927124"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 6",
          weight: 1.8,
          popularityScore: 0.82,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-Y.jpg?v=1696591786",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-R.jpg?v=1696591802",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-W.jpg?v=1696591798"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 7",
          weight: 5.2,
          popularityScore: 0.7,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-Y.jpg?v=1696589183",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-R.jpg?v=1696589214",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-W.jpg?v=1696589210"
          },
          publishedAt: new Date()
        },
        {
          name: "Engagement Ring 8",
          weight: 2.9,
          popularityScore: 0.76,
          images: {
            yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-Y.jpg?v=1696589562",
            rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-R.jpg?v=1696589594",
            white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-W.jpg?v=1696589589"
          },
          publishedAt: new Date()
        }
      ];
      
      // Create all products
      for (const productData of defaultProducts) {
        try {
          await strapi.db.query('api::product.product').create({
            data: productData
          });
          console.log(`✅ Created: ${productData.name}`);
        } catch (error) {
          console.error(`❌ Failed to create ${productData.name}:`, error);
        }
      }
      
      console.log('🎉 Auto-import completed! All products restored.');
    } else {
      console.log(`✅ Found ${existingProducts.length} existing products, no import needed.`);
    }
  };