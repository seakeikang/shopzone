// =====================================================
//  APP LOGIC — cart, rendering, search, filter, modal
// =====================================================

let cart = [];           // Stores cart items
let editingProductId = null;   // Which product name is being edited

// ── RENDER PRODUCTS ──────────────────────────────────
function renderProducts(list) {
  const grid = document.getElementById("productGrid");
  const noResults = document.getElementById("noResults");
  const resultCount = document.getElementById("resultCount");

  grid.innerHTML = "";

  if (list.length === 0) {
    noResults.style.display = "block";
    resultCount.textContent = "";
    return;
  }

  noResults.style.display = "none";
  resultCount.textContent = `Showing ${list.length} product${list.length !== 1 ? "s" : ""}`;

  list.forEach((product, index) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.style.animationDelay = `${index * 0.04}s`;

    card.innerHTML = `
      <div class="product-img-wrap">
        <img src="${product.image}" alt="${product.name}" loading="lazy"
             onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80'" />
        <span class="category-badge">${product.category}</span>
      </div>
      <div class="product-info">
        <h3 class="product-name" title="Click to rename" onclick="openModal(${product.id})">
          ${product.emoji} ${product.name}
          <span class="edit-hint">✏️</span>
        </h3>
        <div class="product-price">$${product.price.toFixed(2)}</div>
        <button class="add-btn" onclick="addToCart(${product.id})">Add to Cart 🛒</button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ── FILTER & SEARCH ───────────────────────────────────
function applyFilters() {
  const searchVal  = document.getElementById("searchInput").value.toLowerCase().trim();
  const catVal     = document.getElementById("categoryFilter").value;
  const priceVal   = document.getElementById("priceFilter").value;

  let filtered = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchVal);
    const matchCat  = catVal === "" || p.category === catVal;

    let matchPrice = true;
    if (priceVal) {
      const [min, max] = priceVal.split("-").map(Number);
      matchPrice = p.price >= min && p.price <= max;
    }

    return matchName && matchCat && matchPrice;
  });

  renderProducts(filtered);
}

function resetFilters() {
  document.getElementById("searchInput").value = "";
  document.getElementById("categoryFilter").value = "";
  document.getElementById("priceFilter").value = "";
  renderProducts(products);
}

// ── CART FUNCTIONS ────────────────────────────────────
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(c => c.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  showAddedFeedback(id);
}

function removeFromCart(id) {
  cart = cart.filter(c => c.id !== id);
  updateCartUI();
}

function changeQty(id, delta) {
  const item = cart.find(c => c.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  updateCartUI();
}

function updateCartUI() {
  const cartItems = document.getElementById("cartItems");
  const cartCount = document.getElementById("cartCount");
  const cartTotal = document.getElementById("cartTotal");

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);
  const totalPrice = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  cartCount.textContent = totalItems;
  cartTotal.textContent = "$" + totalPrice.toFixed(2);

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="cart-empty">Your cart is empty 🛍️</p>';
    return;
  }

  cartItems.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400&q=80'" />
      <div class="cart-item-info">
        <p class="cart-item-name">${item.emoji} ${item.name}</p>
        <p class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</p>
        <div class="qty-control">
          <button onclick="changeQty(${item.id}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${item.id})">🗑️</button>
    </div>
  `).join("");
}

function toggleCart() {
  const sidebar = document.getElementById("cartSidebar");
  const overlay = document.getElementById("cartOverlay");
  sidebar.classList.toggle("open");
  overlay.classList.toggle("show");
}

// ── VISUAL FEEDBACK when item added ──────────────────
function showAddedFeedback(id) {
  const allCards = document.querySelectorAll(".product-card");
  const allNames = document.querySelectorAll(".product-name");
  allNames.forEach(el => {
    const btn = el.closest(".product-card")?.querySelector(".add-btn");
    if (btn) {
      const cardId = parseInt(btn.getAttribute("onclick").match(/\d+/)[0]);
      if (cardId === id) {
        btn.textContent = "✓ Added!";
        btn.style.background = "var(--green)";
        setTimeout(() => {
          btn.textContent = "Add to Cart 🛒";
          btn.style.background = "";
        }, 1200);
      }
    }
  });
}

// ── MODAL — rename product ────────────────────────────
function openModal(id) {
  editingProductId = id;
  const product = products.find(p => p.id === id);
  document.getElementById("modalInput").value = product.name;
  document.getElementById("modalOverlay").style.display = "flex";
  setTimeout(() => document.getElementById("modalInput").focus(), 100);
}

function closeModal() {
  editingProductId = null;
  document.getElementById("modalOverlay").style.display = "none";
}

function saveModal() {
  const newName = document.getElementById("modalInput").value.trim();
  if (!newName) return;

  const product = products.find(p => p.id === editingProductId);
  if (product) {
    product.name = newName;
    // Also update in cart if present
    const cartItem = cart.find(c => c.id === editingProductId);
    if (cartItem) cartItem.name = newName;

    applyFilters();   // Re-render with current filters
    updateCartUI();
  }
  closeModal();
}

// Allow pressing Enter in modal input to save
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("modalInput").addEventListener("keydown", e => {
    if (e.key === "Enter") saveModal();
    if (e.key === "Escape") closeModal();
  });

  // Initial render of all 50 products
  renderProducts(products);
});
