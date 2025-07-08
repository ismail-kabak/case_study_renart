const express = require("express");
const fs = require("fs").promises;
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const STRAPI_URL = process.env.STRAPI_URL || "http://localhost:1337";

// Fallback products data (always available)
const fallbackProducts = [
  {
    id: 1,
    name: "Engagement Ring 1",
    weight: 2.1,
    popularityScore: 0.85,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-Y.jpg?v=1696588368",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-R.jpg?v=1696588406",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG085-100P-W.jpg?v=1696588402"
    }
  },
  {
    id: 2,
    name: "Engagement Ring 2",
    weight: 3.4,
    popularityScore: 0.51,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-Y.jpg?v=1707727068",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-R.jpg?v=1707727068",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG012-W.jpg?v=1707727068"
    }
  },
  {
    id: 3,
    name: "Engagement Ring 3",
    weight: 3.8,
    popularityScore: 0.92,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-Y.jpg?v=1683534032",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-R.jpg?v=1683534032",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG020-100P-W.jpg?v=1683534032"
    }
  },
  {
    id: 4,
    name: "Engagement Ring 4",
    weight: 4.5,
    popularityScore: 0.88,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-Y.jpg?v=1683532153",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-R.jpg?v=1683532153",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG022-100P-W.jpg?v=1683532153"
    }
  },
  {
    id: 5,
    name: "Engagement Ring 5",
    weight: 2.5,
    popularityScore: 0.8,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-Y.jpg?v=1696232035",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-R.jpg?v=1696927124",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG074-100P-W.jpg?v=1696927124"
    }
  },
  {
    id: 6,
    name: "Engagement Ring 6",
    weight: 1.8,
    popularityScore: 0.82,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-Y.jpg?v=1696591786",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-R.jpg?v=1696591802",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG075-100P-W.jpg?v=1696591798"
    }
  },
  {
    id: 7,
    name: "Engagement Ring 7",
    weight: 5.2,
    popularityScore: 0.7,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-Y.jpg?v=1696589183",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-R.jpg?v=1696589214",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG094-100P-W.jpg?v=1696589210"
    }
  },
  {
    id: 8,
    name: "Engagement Ring 8",
    weight: 2.9,
    popularityScore: 0.76,
    images: {
      yellow: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-Y.jpg?v=1696589562",
      rose: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-R.jpg?v=1696589594",
      white: "https://cdn.shopify.com/s/files/1/0484/1429/4167/files/EG098-100P-W.jpg?v=1696589589"
    }
  }
];

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Cache for gold price to avoid too many API calls
let goldPriceCache = {
  price: null,
  lastUpdated: null,
  cacheValidMinutes: 15,
};

// Function to fetch real-time gold price
async function fetchGoldPrice() {
  try {
    const now = new Date();
    if (goldPriceCache.price && goldPriceCache.lastUpdated) {
      const timeDiff = (now - goldPriceCache.lastUpdated) / (1000 * 60);
      if (timeDiff < goldPriceCache.cacheValidMinutes) {
        console.log("Using cached gold price:", goldPriceCache.price);
        return goldPriceCache.price;
      }
    }

    const response = await fetch("https://api.gold-api.com/price/XAU");

    if (!response.ok) {
      throw new Error(`Gold price API error: ${response.status}`);
    }

    const data = await response.json();
    const pricePerGram = data.price / 31.1035;

    goldPriceCache.price = pricePerGram;
    goldPriceCache.lastUpdated = now;

    return pricePerGram;
  } catch (error) {
    console.error("Error fetching gold price:", error);
    return 106.93; // Fallback gold price
  }
}

function calculatePrice(popularityScore, weight, goldPrice) {
  const price = (popularityScore + 1) * weight * goldPrice;
  return Math.round(price * 100) / 100;
}

// Function to fetch products from Strapi with fallback
async function fetchProductsFromStrapi() {
  try {
    console.log('Connecting to Strapi at:', STRAPI_URL);
    const response = await fetch(`${STRAPI_URL}/api/products?populate=*`);
    
    if (!response.ok) {
      throw new Error(`Strapi API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Strapi response data:', data);
    
    // Check if we got products from Strapi
    if (data.data && data.data.length > 0) {
      console.log(`Using ${data.data.length} products from Strapi`);
      // Transform Strapi data to match your existing format
      return data.data.map(item => ({
        id: item.id,
        name: item.name,
        weight: item.weight,
        popularityScore: item.popularityScore,
        images: item.images,
      }));
    } else {
      console.log('No products in Strapi, using fallback products');
      return fallbackProducts;
    }
  } catch (error) {
    console.error("Error fetching from Strapi:", error);
    console.log("Using fallback products");
    // Always return fallback products if Strapi fails
    return fallbackProducts;
  }
}

async function loadProductsFromFile() {
  try {
    const data = await fs.readFile(
      path.join(__dirname, "products.json"),
      "utf8"
    );
    return JSON.parse(data);
  } catch (error) {
    console.log("No products.json file found, using fallback products");
    return fallbackProducts;
  }
}

async function addDynamicPricing(products) {
  try {
    const goldPrice = await fetchGoldPrice();

    return products.map((product) => ({
      ...product,
      price: calculatePrice(product.popularityScore, product.weight, goldPrice),
      goldPriceUsed: goldPrice,
      priceCalculation: {
        formula: "(popularityScore + 1) * weight * goldPrice",
        popularityScore: product.popularityScore,
        weight: product.weight,
        goldPrice: goldPrice,
        calculatedPrice: calculatePrice(
          product.popularityScore,
          product.weight,
          goldPrice
        ),
      },
    }));
  } catch (error) {
    console.error("Error adding dynamic pricing:", error);
    return products;
  }
}

// API Routes

// GET /api/gold-price - Get current gold price
app.get("/api/gold-price", async (req, res) => {
  try {
    const goldPrice = await fetchGoldPrice();
    res.json({
      pricePerGram: goldPrice,
      currency: "USD",
      lastUpdated: goldPriceCache.lastUpdated,
      source: "metals.live",
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch gold price", error: error.message });
  }
});

// GET /api/products - Get all products with dynamic pricing
app.get("/api/products", async (req, res) => {
  try {
    const products = await fetchProductsFromStrapi();
    const productsWithPricing = await addDynamicPricing(products);

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 4;

    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const result = {};

    if (endIndex < productsWithPricing.length) {
      result.next = {
        page: page + 1,
        limit: limit,
      };
    }

    if (startIndex > 0) {
      result.previous = {
        page: page - 1,
        limit: limit,
      };
    }

    result.totalProducts = productsWithPricing.length;
    result.totalPages = Math.ceil(productsWithPricing.length / limit);
    result.currentPage = page;
    result.products = productsWithPricing.slice(startIndex, endIndex);
    result.goldPriceInfo = {
      currentGoldPrice: goldPriceCache.price,
      lastUpdated: goldPriceCache.lastUpdated,
      currency: "USD",
      unit: "per gram",
    };

    res.json(result);
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/products/:id - Get single product with dynamic pricing
app.get("/api/products/:id", async (req, res) => {
  try {
    const products = await fetchProductsFromStrapi();
    const productsWithPricing = await addDynamicPricing(products);
    const product = productsWithPricing.find(
      (p) => p.id === parseInt(req.params.id)
    );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get("/api/products/filter/popular", async (req, res) => {
  try {
    const products = await fetchProductsFromStrapi();
    const productsWithPricing = await addDynamicPricing(products);
    const minScore = parseFloat(req.query.minScore);

    const popularProducts = productsWithPricing
      .filter((product) => product.popularityScore >= minScore)
      .sort((a, b) => b.popularityScore - a.popularityScore);

    res.json({
      minPopularityScore: minScore,
      totalResults: popularProducts.length,
      products: popularProducts,
      goldPriceInfo: {
        currentGoldPrice: goldPriceCache.price,
        lastUpdated: goldPriceCache.lastUpdated,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/filter/price', async (req, res) => {
  try {
    const products = await fetchProductsFromStrapi();
    const productsWithPricing = await addDynamicPricing(products);
    
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    
    const filteredProducts = productsWithPricing
      .filter(product => product.price >= minPrice && product.price <= maxPrice)
      .sort((a, b) => a.price - b.price);
    
    res.json({
      priceRange: { min: minPrice, max: maxPrice === Infinity ? 'unlimited' : maxPrice },
      totalResults: filteredProducts.length,
      products: filteredProducts,
      goldPriceInfo: {
        currentGoldPrice: goldPriceCache.price,
        lastUpdated: goldPriceCache.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/products/filter/combined', async (req, res) => {
  try {
    const products = await fetchProductsFromStrapi();
    const productsWithPricing = await addDynamicPricing(products);
    
    const minPopularity = parseFloat(req.query.minPopularity) || 0;
    const minPrice = parseFloat(req.query.minPrice) || 0;
    const maxPrice = parseFloat(req.query.maxPrice) || Infinity;
    
    const filteredProducts = productsWithPricing
      .filter(product => 
        product.popularityScore >= minPopularity &&
        product.price >= minPrice && 
        product.price <= maxPrice
      )
      .sort((a, b) => b.popularityScore - a.popularityScore);
    
    res.json({
      filters: {
        minPopularity,
        priceRange: { min: minPrice, max: maxPrice === Infinity ? 'unlimited' : maxPrice }
      },
      totalResults: filteredProducts.length,
      products: filteredProducts,
      goldPriceInfo: {
        currentGoldPrice: goldPriceCache.price,
        lastUpdated: goldPriceCache.lastUpdated
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Initialize gold price cache on server start
async function initializeServer() {
  console.log("Initializing server...");
  try {
    await fetchGoldPrice();
    console.log("Gold price cache initialized");
    
    // Test product loading
    const products = await fetchProductsFromStrapi();
    console.log(`Products loaded: ${products.length} items`);
  } catch (error) {
    console.error("Failed to initialize server:", error);
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeServer();
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Strapi CMS available at ${STRAPI_URL}/admin`);
  console.log(`💎 Products: Always available (Strapi + fallback)`);
});