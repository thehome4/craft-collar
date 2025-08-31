// DOM Elements
const productsGrid = document.getElementById('products-grid');
const productCount = document.getElementById('product-count');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const filterModalBtn = document.getElementById('filter-modal-btn');
const filterModal = document.getElementById('filter-modal');
const applyFilter = document.getElementById('apply-filter');
const resetFilter = document.getElementById('reset-filter');
const productModal = document.getElementById('product-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');
const minPriceInput = document.getElementById('min-price');
const maxPriceInput = document.getElementById('max-price');
const loadingSpinner = document.getElementById('loading-spinner');
const discountText = document.getElementById('discount-text');

// Global products array
let products = [];
let filteredProducts = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Fetch products from Google Sheets
    fetchProductsFromGoogleSheets();
    
    // Set up event listeners
    setupEventListeners();
});

// Set up all event listeners
function setupEventListeners() {
    searchInput.addEventListener('input', filterProducts);
    searchBtn.addEventListener('click', filterProducts);

    filterModalBtn.addEventListener('click', () => {
        filterModal.style.display = 'flex';
    });

    applyFilter.addEventListener('click', filterProducts);
    resetFilter.addEventListener('click', resetFilters);

    closeModal.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
        if (e.target === filterModal) {
            filterModal.style.display = 'none';
        }
    });
}

// Function to update the discount banner with the highest discount
function updateDiscountBanner() {
    // Find the product with the highest discount
    let highestDiscountProduct = null;
    let highestDiscount = 0;
    
    for (const product of products) {
        if (product.discountValue > highestDiscount) {
            highestDiscount = product.discountValue;
            highestDiscountProduct = product;
        }
    }
    
    // Update the banner text
    if (highestDiscountProduct) {
        discountText.textContent = `${highestDiscountProduct.name} - ${highestDiscountProduct.discount}`;
    } else {
        discountText.textContent = "Special Offers Available - Shop Now!";
    }
}

// Display products
function displayProducts(productsArray) {
    productsGrid.innerHTML = '';
    productCount.textContent = productsArray.length;
    
    if (productsArray.length === 0) {
        productsGrid.innerHTML = '<p>No products found. Try adjusting your search filters.</p>';
        return;
    }
    
    productsArray.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            ${product.discountValue > 0 ? `<div class="discount-badge">${product.discount}</div>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-price">BDT ${product.price} ${product.discountValue > 0 ? `<span class="product-discount">${product.discount}</span>` : ''}</div>
            </div>
        `;
        
        productCard.addEventListener('click', () => {
            showProductDetails(product);
        });
        
        productsGrid.appendChild(productCard);
    });
}

// Show product details in modal
function showProductDetails(product) {
    modalBody.innerHTML = `
        <div class="product-detail">
            <div>
                <img src="${product.image}" alt="${product.name}" class="product-detail-image">
            </div>
            <div class="detail-info">
                <h2>${product.name}</h2>
                <div class="detail-price">BDT ${product.price} ${product.discountValue > 0 ? `<span class="product-discount">${product.discount}</span>` : ''}</div>
                
                <div class="size-options">
                    <h3>Select Size:</h3>
                    <div class="size-buttons">
                        ${Object.entries(product.sizes).map(([size, quantity]) => 
                            `<button class="size-btn ${quantity === 0 ? 'unavailable' : ''}" 
                             ${quantity === 0 ? 'disabled' : ''}>${size} ${quantity === 0 ? '(Out of Stock)' : `(${quantity} available)`}</button>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="product-description">
                    <h3>Description</h3>
                    <p>${product.description}</p>
                </div>
                
                <a href="https://wa.me/8801515270062?text=Hi, I'm interested in ${encodeURIComponent(product.name)} (Product ID: ${product.id})" 
                   class="whatsapp-chat" target="_blank">
                   <i class="fab fa-whatsapp"></i> Chat on WhatsApp
                </a>
            </div>
        </div>
    `;
    
    productModal.style.display = 'flex';
}

// Filter products based on search and price range
function filterProducts() {
    const searchText = searchInput.value.toLowerCase();
    const minPrice = minPriceInput.value ? parseInt(minPriceInput.value) : 0;
    const maxPrice = maxPriceInput.value ? parseInt(maxPriceInput.value) : Number.MAX_SAFE_INTEGER;
    
    filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchText);
        const matchesPrice = product.price >= minPrice && product.price <= maxPrice;
        return matchesSearch && matchesPrice;
    });
    
    displayProducts(filteredProducts);
    filterModal.style.display = 'none';
}

// Reset filters and show all products
function resetFilters() {
    searchInput.value = '';
    minPriceInput.value = '';
    maxPriceInput.value = '';
    filteredProducts = [...products];
    displayProducts(filteredProducts);
    filterModal.style.display = 'none';
}

// Function to fetch products from Google Sheets (CSV)
async function fetchProductsFromGoogleSheets() {
    try {
        // Replace this URL with your published Google Sheets CSV URL
        const sheetUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRMjPUnZhjqGo_x1tElyuFPK225MhFBJjrqk01VoSEPqEU0zyxhI3488q7hv_nR2FxwunItQDcP_Y6a/pub?gid=0&single=true&output=csv';
        
        const response = await fetch(sheetUrl);
        const csvData = await response.text();
        
        // Parse CSV data
        products = parseCSVData(csvData);
        filteredProducts = [...products];
        
        // Update UI
        updateDiscountBanner();
        displayProducts(filteredProducts);
        
        // Hide loading spinner
        loadingSpinner.style.display = 'none';
    } catch (error) {
        console.error('Error fetching product data:', error);
        
        // Fallback to sample data if Google Sheets fails
        useSampleData();
    }
}

// Use sample data if Google Sheets is not available
function useSampleData() {
    const sampleProducts = [
        {
            id: 1,
            name: "Premium Cotton Formal Shirt",
            price: 2499,
            discount: "10% off",
            discountValue: 10,
            image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            description: "Experience unparalleled comfort with our premium cotton formal shirt. Perfect for office wear and formal occasions, this shirt features a classic cut with modern detailing.",
            sizes: { M: 5, L: 8, XL: 3, XXL: 2 }
        },
        {
            id: 2,
            name: "Slim Fit Linen Shirt",
            price: 2299,
            discount: "5% off",
            discountValue: 5,
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            description: "Our slim fit linen shirt is perfect for summer. Made from high-quality linen, it keeps you cool while maintaining a sharp, professional appearance.",
            sizes: { M: 2, L: 4, XL: 6, XXL: 0 }
        },
        {
            id: 3,
            name: "Classic White Office Shirt",
            price: 1999,
            discount: "7% off",
            discountValue: 7,
            image: "https://images.unsplash.com/photo-1602810317536-5d5e8a493a55?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
            description: "The essential white office shirt every professional needs. Crisp, clean, and perfectly tailored for a polished look in any business setting.",
            sizes: { M: 10, L: 7, XL: 5, XXL: 4 }
        }
    ];
    
    products = sampleProducts;
    filteredProducts = [...products];
    
    updateDiscountBanner();
    displayProducts(filteredProducts);
    loadingSpinner.style.display = 'none';
    
    console.log("Using sample data as Google Sheets is not accessible");
}

// Parse CSV data into product objects
function parseCSVData(csvData) {
    const products = [];
    const rows = csvData.split('\n');
    
    // Skip header row and process each row
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.trim() === '') continue;
        
        // Handle CSV with quotes and commas inside values
        const columns = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
        
        // Parse sizes from CSV (format: "M:5;L:8;XL:3;XXL:2")
        const sizes = {};
        if (columns[6]) {
            const sizePairs = columns[6].replace(/"/g, '').split(';');
            for (const pair of sizePairs) {
                const [size, quantity] = pair.split(':');
                if (size && quantity) {
                    sizes[size.trim()] = parseInt(quantity.trim());
                }
            }
        }
        
        // Extract discount value from discount string (e.g., "10% off" -> 10)
        const discountString = columns[3] ? columns[3].replace(/"/g, '') : '0% off';
        const discountValue = parseInt(discountString) || 0;
        
        // Create product object
        const product = {
            id: columns[0] ? parseInt(columns[0].replace(/"/g, '')) : i,
            name: columns[1] ? columns[1].replace(/"/g, '') : 'Unnamed Product',
            price: columns[2] ? parseInt(columns[2].replace(/"/g, '')) : 0,
            discount: discountString,
            discountValue: discountValue,
            image: columns[4] ? columns[4].replace(/"/g, '') : 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80',
            description: columns[5] ? columns[5].replace(/"/g, '') : 'No description available.',
            sizes: sizes
        };
        
        products.push(product);
    }
    
    return products;
}