// api.js - Frontend API Client
class ProductAPI {
    constructor() {
        // Automatically detect if we're in development or production
        this.baseURL = window.location.origin + "/api";
        
        // For development, you can override this
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          this.baseURL = "http://localhost:3000/api";
        }
        
        console.log('Using API base URL:', this.baseURL); // Debug log
      }

  // Generic fetch method
  async fetchAPI(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Get products with pagination
  async getProducts(page = 1, limit = 4) {
    return this.fetchAPI(`/products?page=${page}&limit=${limit}`);
  }

  // Get single product
  async getProduct(id) {
    return this.fetchAPI(`/products/${id}`);
  }
  async filterByPrice(minPrice, maxPrice) {
    let url = `/products/filter/price?minPrice=${minPrice}`;
    if (maxPrice && maxPrice !== Infinity) {
      url += `&maxPrice=${maxPrice}`;
    }
    return this.fetchAPI(url);
  }
  async filterCombined(minPopularity, minPrice, maxPrice) {
    let url = `/products/filter/combined?minPopularity=${minPopularity}&minPrice=${minPrice}`;
    if (maxPrice && maxPrice !== Infinity) {
      url += `&maxPrice=${maxPrice}`;
    }
    return this.fetchAPI(url);
  }

  // Get popular products
  async getPopularProducts(minScore = 3.5) {
    return this.fetchAPI(`/products/filter/popular?minScore=${minScore}`);
  }
}

const productAPI = new ProductAPI();

class ProductManager {
    constructor() {
      this.currentPage = 1;
      this.totalPages = 1;
      this.products = [];
      this.allProducts = []; 
      this.selectedColors = {};
      this.currentFilters = {  
        popularity: 'all',
        price: 'all'
      };
      this.init();
    }

  async init() {
    try {
      await this.loadAllProducts();
      this.setupEventListeners();
      this.setupFilterListeners();
    } catch (error) {
      console.error("Failed to initialize products:", error);
      this.showError("Failed to load products. Please try again later.");
    }
  }

  async loadAllProducts() {
    try {
      this.showLoading();
     
      let allProductsData = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const data = await productAPI.getProducts(page, 4);
        allProductsData = allProductsData.concat(data.products);
        hasMore = page < data.totalPages;
        page++;
      }
      
      this.allProducts = allProductsData;
      this.applyFilters();
      this.hideLoading();
    } catch (error) {
      console.error("Error loading all products:", error);
      this.showError("Failed to load products");
      this.hideLoading();
    }
  }

  applyFilters() {
    let filteredProducts = [...this.allProducts];
    
    // Apply popularity filter
    if (this.currentFilters.popularity !== 'all') {
      const minPopularity = parseFloat(this.currentFilters.popularity);
      filteredProducts = filteredProducts.filter(product => 
        product.popularityScore >= minPopularity
      );
    }
    
    // Apply price filter
    if (this.currentFilters.price !== 'all') {
      const [minPrice, maxPrice] = this.currentFilters.price.split('-').map(Number);
      filteredProducts = filteredProducts.filter(product => {
        if (maxPrice) {
          return product.price >= minPrice && product.price <= maxPrice;
        } else {
          return product.price >= minPrice; 
        }
      });
    }
    
    // Update products and pagination
    this.updateFilteredProducts(filteredProducts);
    this.updateFilterResults(filteredProducts.length);
  }

  updateFilteredProducts(filteredProducts) {
    const productsPerPage = 4;
    this.totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    this.currentPage = 1; // Reset to first page
    
    // Get products for current page
    const startIndex = (this.currentPage - 1) * productsPerPage;
    const endIndex = this.currentPage * productsPerPage;
    this.products = filteredProducts.slice(startIndex, endIndex);
    
    this.renderProducts();
    this.updateNavigation();
  }

  updateFilterResults(totalResults) {
    const resultsText = document.getElementById('filterResults');
    if (resultsText) {
      if (this.currentFilters.popularity === 'all' && this.currentFilters.price === 'all') {
        resultsText.textContent = `Showing all products (${totalResults} items)`;
      } else {
        resultsText.textContent = `Showing ${totalResults} filtered products`;
      }
    }
  }

  setupFilterListeners() {
    // Popularity filter
    const popularityFilter = document.getElementById('popularityFilter');
    if (popularityFilter) {
      popularityFilter.addEventListener('change', (e) => {
        this.currentFilters.popularity = e.target.value;
        this.applyFilters();
      });
    }

    // Price filter
    const priceFilter = document.getElementById('priceFilter');
    if (priceFilter) {
      priceFilter.addEventListener('change', (e) => {
        this.currentFilters.price = e.target.value;
        this.applyFilters();
      });
    }

    // Clear filters button
    const clearFilters = document.getElementById('clearFilters');
    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        this.clearAllFilters();
      });
    }
  }

  clearAllFilters() {
    this.currentFilters = {
      popularity: 'all',
      price: 'all'
    };
    
    // Reset filter dropdowns
    const popularityFilter = document.getElementById('popularityFilter');
    const priceFilter = document.getElementById('priceFilter');
    
    if (popularityFilter) popularityFilter.value = 'all';
    if (priceFilter) priceFilter.value = 'all';
    
    this.applyFilters();
  }

  async loadProducts(page = 1) {
    // For filtered results, handle pagination differently
    const productsPerPage = 4;
    let filteredProducts = [...this.allProducts];
    
    // Apply current filters
    if (this.currentFilters.popularity !== 'all') {
      const minPopularity = parseFloat(this.currentFilters.popularity);
      filteredProducts = filteredProducts.filter(product => 
        product.popularityScore >= minPopularity
      );
    }
    
    if (this.currentFilters.price !== 'all') {
      const [minPrice, maxPrice] = this.currentFilters.price.split('-').map(Number);
      filteredProducts = filteredProducts.filter(product => {
        if (maxPrice) {
          return product.price >= minPrice && product.price <= maxPrice;
        } else {
          return product.price >= minPrice;
        }
      });
    }
    
    // Calculate pagination
    this.totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    this.currentPage = page;
    
    // Get products for current page
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = page * productsPerPage;
    this.products = filteredProducts.slice(startIndex, endIndex);
    
    this.renderProducts();
    this.updateNavigation();
  }

  renderProducts() {
    const container = document.querySelector(".cards-row");
    if (!container) return;

    container.innerHTML = "";

    this.products.forEach((product) => {
      const defaultColor = this.selectedColors[product.id] || "yellow";
      const currentImage = product.images[defaultColor];

      const cardHTML = `
                <div class="card" data-product-id="${product.id}">
                    <div class="image-container">
                        <img src="${currentImage}" class="card-img-top" alt="${
        product.name
      }" loading="lazy">
                    </div>
                    <div class="card-body">
                        <h5 class="product-title">${product.name}</h5>
                        <p class="product-price">$${product.price.toFixed(
                          2
                        )}</p>
                        <div class="color-options">
                            <button class="color-picker ${
                              defaultColor === "yellow" ? "active" : ""
                            }" 
                                    data-color="yellow" 
                                    data-product-id="${product.id}"
                                    aria-label="Pick Yellow Gold"></button>
                            <button class="color-picker ${
                              defaultColor === "white" ? "active" : ""
                            }" 
                                    data-color="white" 
                                    data-product-id="${product.id}"
                                    aria-label="Pick White Gold"></button>
                            <button class="color-picker ${
                              defaultColor === "rose" ? "active" : ""
                            }" 
                                    data-color="rose" 
                                    data-product-id="${product.id}"
                                    aria-label="Pick Rose Gold"></button>
                        </div>
                        <p class="picked-color">${this.formatColorName(
                          defaultColor
                        )} Gold</p>
                        <div class="rating">
                            <span class="stars">${this.generateStars(
                              product.popularityScore
                            )}</span>
                            <span class="rating-text">${
                              (product.popularityScore * 100) / 20
                            }/5</span>
                        </div>
                    </div>
                </div>
            `;
      container.insertAdjacentHTML("beforeend", cardHTML);
    });

    // Setup color picker event listeners
    this.setupColorPickers();
  }

  setupColorPickers() {
    document.querySelectorAll(".color-picker").forEach((button) => {
      button.addEventListener("click", (e) => {
        const productId = parseInt(e.target.dataset.productId);
        const color = e.target.dataset.color;
        const product = this.products.find((p) => p.id === productId);

        if (product && product.images[color]) {
          // Update selected color for this product
          this.selectedColors[productId] = color;

          // Update active state
          const card = e.target.closest(".card");
          card
            .querySelectorAll(".color-picker")
            .forEach((btn) => btn.classList.remove("active"));
          e.target.classList.add("active");

          // Update image
          const img = card.querySelector(".card-img-top");
          img.src = product.images[color];

          // Update color text
          const colorText = card.querySelector(".picked-color");
          colorText.textContent = this.formatColorName(color) + " Gold";
        }
      });
    });
  }

  setupEventListeners() {
    // Previous button
    const prevBtn = document.getElementById("prevBtn");
    if (prevBtn) {
      prevBtn.addEventListener("click", () => this.previousPage());
    }

    // Next button
    const nextBtn = document.getElementById("nextBtn");
    if (nextBtn) {
      nextBtn.addEventListener("click", () => this.nextPage());
    }

    // Navigation indicators
    document.querySelectorAll(".nav-indicator").forEach((indicator, index) => {
      indicator.addEventListener("click", () => this.goToPage(index + 1));
    });
  }

  async previousPage() {
    if (this.currentPage > 1) {
      await this.loadProducts(this.currentPage - 1);
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      await this.loadProducts(this.currentPage + 1);
    }
  }

  async goToPage(page) {
    if (page >= 1 && page <= this.totalPages) {
      await this.loadProducts(page);
    }
  }

  updateNavigation() {
    document.querySelectorAll(".nav-indicator").forEach((indicator, index) => {
      indicator.classList.toggle("active", index + 1 === this.currentPage);
    });

    // Update arrow buttons
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");

    if (prevBtn) prevBtn.disabled = this.currentPage === 1;
    if (nextBtn) nextBtn.disabled = this.currentPage === this.totalPages;
  }

  generateStars(productPopularityScore) {
    const rating = (productPopularityScore * 100) / 20;
    const stars = [];
    const uniqueId = Date.now() + Math.random();

    for (let i = 1; i <= 5; i++) {
      let fillPercentage;

      if (i <= rating) {
        fillPercentage = 100;
      } else if (i - 1 < rating) {
        fillPercentage = Math.round((rating - (i - 1)) * 100);
      } else {
        fillPercentage = 0;
      }

      stars.push(`
        <svg width="14" height="14" viewBox="0 0 24 24" class="star-svg">
          <defs>
            <linearGradient id="star-gradient-${uniqueId}-${i}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="${fillPercentage}%" stop-color="#ffd700"/>
              <stop offset="${fillPercentage}%" stop-color="#e0e0e0"/>
            </linearGradient>
          </defs>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" 
                fill="url(#star-gradient-${uniqueId}-${i})" 
                stroke="#ddd" 
                stroke-width="0.5"/>
        </svg>
      `);
    }

    return stars.join("");
  }

  formatColorName(color) {
    return color.charAt(0).toUpperCase() + color.slice(1);
  }

  showLoading() {
    const container = document.querySelector(".cards-row");
    if (container) {
      container.innerHTML = '<div class="loading">Loading products...</div>';
    }
  }

  hideLoading() {
    const loading = document.querySelector(".loading");
    if (loading) {
      loading.remove();
    }
  }

  showError(message) {
    const container = document.querySelector(".cards-row");
    if (container) {
      container.innerHTML = `<div class="error">${message}</div>`;
    }
  }


  async getPopularProducts() {
    try {
      const data = await productAPI.getPopularProducts(0.8);
      this.products = data.products;
      this.currentPage = 1;
      this.totalPages = 1;
      this.renderProducts();
      this.updateNavigation();
    } catch (error) {
      this.showError("Failed to load popular products");
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.productManager = new ProductManager();
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ProductAPI, ProductManager };
}
