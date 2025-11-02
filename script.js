// script.js - cleaned & merged (preserves all features, inline onclick retained)


/* -------------------------
   Global State & Constants
   ------------------------- */
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00;
document.addEventListener('touchstart', function() {}, { passive: true });



/* -------------------------
   CART FUNCTIONS
   ------------------------- */

// Update navbar + floating cart count (single merged function)
function updateCartCount() {
  const cartData = JSON.parse(localStorage.getItem('cart')) || cart || [];
  const total = cartData.reduce((sum, item) => sum + (item.quantity || 1), 0);

  const cartCountEl = document.getElementById('cart-count');
  const floatingCartCount = document.getElementById('floating-cart-count');

  // Navbar
  if (cartCountEl) {
    cartCountEl.textContent = total;
    cartCountEl.classList.remove('pop');
    void cartCountEl.offsetWidth; // reset animation
    cartCountEl.classList.add('pop');
  }

  // Floating
  if (floatingCartCount) {
    floatingCartCount.textContent = total;
    floatingCartCount.classList.remove('pop');
    void floatingCartCount.offsetWidth; // reset animation
    floatingCartCount.classList.add('pop');
  }
}

// Small floating notification (used when adding items)
function showCartNotification(message) {
  const existing = document.querySelector('.cart-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add('show'), 50);
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

// Optional toast (kept for compatibility)
function showAddedToast(itemName) {
  const toast = document.createElement('div');
  toast.className = 'added-toast';
  toast.textContent = `✅ ${itemName} added to cart!`;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 2000);
}

// Render cart page and compute totals (promo-aware shipping)
function updateCart() {
  // Keep cart in memory synced with localStorage
  cart = JSON.parse(localStorage.getItem('cart')) || cart || [];

  updateCartCount();

  const cartItems = document.getElementById('cart-items');
  const subtotalEl = document.getElementById('cart-subtotal');
  const shippingEl = document.getElementById('shipping-fee');
  const grandTotalEl = document.getElementById('cart-grand-total');
  const emptyMsg = document.getElementById('empty-cart-message');

  if (!cartItems) return;

  let subtotal = 0;
  let totalQuantity = 0;
  cartItems.innerHTML = '';

  if (!cart || cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (shippingEl) shippingEl.textContent = '$0.00';
    if (grandTotalEl) grandTotalEl.textContent = '$0.00';

    if (typeof updateCheckoutButton === 'function') updateCheckoutButton();
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';

  cart.forEach((item, index) => {
    const itemPrice = Number(item.price) || 0;
    const quantity = item.quantity || 1;
    const lineTotal = itemPrice * quantity;
    subtotal += lineTotal;
    totalQuantity += quantity;

    const imageSrc = item.image || 'images/default-supplement.png';

    cartItems.innerHTML += `
      <div class="card mb-3">
        <div class="card-body d-flex align-items-center flex-wrap gap-3">
          <img src="${imageSrc}" alt="${item.name}" class="img-thumbnail" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
          <div class="flex-grow-1">
            <h6 class="mb-1">${item.name}</h6>
            <p class="mb-1 text-muted">$${itemPrice.toFixed(2)} each</p>
          </div>
          <div class="d-flex align-items-center gap-2">
            <input type="number" class="form-control" value="${quantity}" min="1" style="width:70px;" onchange="updateQuantity(${index}, this.value)">
            <strong>$${lineTotal.toFixed(2)}</strong>
            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button>
          </div>
        </div>
      </div>`;
  });

  // Shipping (promo-aware)
  let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
  const promoType = localStorage.getItem("promoType");
  if (promoType === "free-shipping") {
    shipping = Math.max(0, shipping - BASE_SHIPPING_PER_10);
  }

  const grandTotal = subtotal + shipping;

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
  if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

  // Persist and update checkout button
  localStorage.setItem('cart', JSON.stringify(cart));
  if (typeof updateCheckoutButton === 'function') updateCheckoutButton();
}

// Add to cart (supports inline onclick="addToCart(this)")
function addToCart(button) {
  // ensure cart is loaded
  cart = JSON.parse(localStorage.getItem('cart')) || cart || [];

  const name = button.dataset.name || 'Unknown Item';
  const price = Number(button.dataset.price) || 0;
  const id = button.dataset.id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const image = button.dataset.image || 'images/default-supplement.png';

  let existingItem = cart.find(item => item.id === id);
  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cart.push({ id, name, price, quantity: 1, image });
  }

   window.addToCart = addToCart;


  // Save + UI updates
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  updateCart();
  showCartNotification(`✅ ${name} added to cart!`);
}

// Quantity change (inline calls updateQuantity)
function updateQuantity(index, newQty) {
  const qty = parseInt(newQty) || 1;
  if (qty < 1) {
    removeFromCart(index);
    return;
  }
  cart[index].quantity = qty;
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCart();
  updateCartCount();
}

// Remove item
function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCart();
  updateCartCount();
}

/* -------------------------
   CHECKOUT FUNCTIONS
   ------------------------- */

function renderCheckoutSummary() {
  const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
  const checkoutItemsEl = document.getElementById('checkout-items');
  const subtotalEl = document.getElementById('checkout-subtotal');
  const shippingEl = document.getElementById('checkout-shipping');
  const grandTotalEl = document.getElementById('checkout-grand-total');

  if (!checkoutItemsEl) return;

  let subtotal = 0;
  let totalQuantity = 0;
  checkoutItemsEl.innerHTML = '';

  storedCart.forEach(item => {
    const itemPrice = Number(item.price) || 0;
    const quantity = item.quantity || 1;
    const lineTotal = itemPrice * quantity;
    subtotal += lineTotal;
    totalQuantity += quantity;

    const imageSrc = item.image || 'images/default-supplement.png';
    checkoutItemsEl.innerHTML += `
      <div class="d-flex align-items-center mb-2">
        <img src="${imageSrc}" class="img-thumbnail me-2" style="width:50px; height:50px; object-fit:cover;">
        <div class="ms-2">
          <h6 class="mb-0">${item.name}</h6>
          <small class="text-muted">Qty: ${quantity} | $${itemPrice.toFixed(2)} each</small>
        </div>
        <div class="ms-auto"><strong>$${lineTotal.toFixed(2)}</strong></div>
      </div>
      <hr class="my-1">`;
  });

  let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
  const promoType = localStorage.getItem("promoType");
  if (promoType === "free-shipping") {
    shipping = Math.max(0, shipping - BASE_SHIPPING_PER_10);
  }

  if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
  if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
  if (grandTotalEl) grandTotalEl.textContent = `$${(subtotal + shipping).toFixed(2)}`;
}

// Checkout submit handler (EmailJS via fetch)
function handleCheckoutSubmit(event) {
  event.preventDefault();

  const placeOrderBtn = document.querySelector('.btn-primary');
  if (placeOrderBtn) {
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Processing Order...`;
  }

  const form = document.getElementById('checkout-form');
  if (!form || !form.checkValidity()) {
    alert('⚠ Please fill all required fields!');
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Checkout';
    }
    return;
  }

  const formData = new FormData(form);
  const fullName = (formData.get('full-name') || '').toString().trim();
  const customerEmail = (formData.get('email') || '').toString().trim();
  const phone = (formData.get('phone') || '').toString().trim();
  const address = (formData.get('street-address') || '').toString().trim();
  const city = (formData.get('city') || '').toString().trim();
  const state = (formData.get('state') || '').toString().trim();
  const zip = (formData.get('zip-code') || '').toString().trim();
  const country = (formData.get('country') || '').toString().trim();

  if (!fullName || !customerEmail || !phone || !address || !city || !state || !zip || !country) {
    alert("⚠ Please complete all required fields!");
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Checkout';
    }
    return;
  }

  const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
  if (storedCart.length === 0) {
    alert("🛒 Your cart is empty!");
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.textContent = 'Checkout';
    }
    return;
  }

  const subtotal = storedCart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  const totalQuantity = storedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const BASE_SHIPPING = BASE_SHIPPING_PER_10;
  let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING;
  const promoType = localStorage.getItem("promoType");
  if (promoType === "free-shipping") {
    shipping = Math.max(0, shipping - BASE_SHIPPING);
  }
  const grandTotal = subtotal + shipping;
  const orderId = 'ORDER-' + Date.now();

  const itemsTableHTML = storedCart.map(item => {
    const qty = item.quantity || 1;
    const price = Number(item.price).toFixed(2);
    const lineTotal = (Number(item.price) * qty).toFixed(2);
    return `
      <tr>
        <td style="padding:8px; border:1px solid #ddd;">${item.name}</td>
        <td style="padding:8px; border:1px solid #ddd;">${qty}</td>
        <td style="padding:8px; border:1px solid #ddd;">$${price}</td>
        <td style="padding:8px; border:1px solid #ddd;">$${lineTotal}</td>
      </tr>`;
  }).join('');

  const promoCode = localStorage.getItem("appliedPromoCode") || "None";

  const serviceID = "service_uerk41r";
  const userID = "8tIW2RqhekSLKVqLT";

  const customerPayload = {
    service_id: serviceID,
    template_id: "template_0ry9w0v",
    user_id: userID,
    template_params: {
      order_id: orderId,
      customer_name: fullName,
      customer_email: customerEmail,
      full_address: `${address}, ${city}, ${state} ${zip}, ${country}`,
      items_table_html: itemsTableHTML,
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      total: grandTotal.toFixed(2),
      promo_code: promoCode
    }
  };

  const ownerPayload = {
    service_id: serviceID,
    template_id: "template_8x2z86l",
    user_id: userID,
    template_params: {
      order_id: orderId,
      customer_name: fullName,
      customer_email: customerEmail,
      phone: phone,
      full_address: `${address}, ${city}, ${state} ${zip}, ${country}`,
      items_table_html: itemsTableHTML,
      subtotal: subtotal.toFixed(2),
      shipping: shipping.toFixed(2),
      total: grandTotal.toFixed(2),
      promo_code: promoCode,
      to_email: "aasshop100@gmail.com"
    }
  };

  // Send emails
  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customerPayload)
  }).then(res => res.ok ? console.log("📧 Customer email sent") : console.error("❌ Customer email failed", res))
    .catch(err => console.error("❌ Customer email error", err));

  fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ownerPayload)
  })
    .then(res => {
      if (res.ok) {
        console.log("📨 Owner email sent");
        const firstName = fullName.split(" ")[0];
        localStorage.setItem("customerFirstName", firstName);

        // Clear cart & local promo
        localStorage.removeItem("cart");
        localStorage.removeItem("appliedPromoCode");
        updateCartCount();

        setTimeout(() => {
          window.location.href = "order-success.html";
        }, 600);
      } else {
        console.error("❌ Owner email failed", res);
        alert("⚠ Your order email did not send correctly. Please try again.");
        if (placeOrderBtn) {
          placeOrderBtn.disabled = false;
          placeOrderBtn.textContent = 'Checkout';
        }
      }
    })
    .catch(err => {
      console.error("❌ Owner email error", err);
      alert("⚠ Connection issue. Please try again.");
      if (placeOrderBtn) {
        placeOrderBtn.disabled = false;
        placeOrderBtn.textContent = 'Checkout';
      }
    });
}

/* -------------------------
   UI helpers & Checkout button
   ------------------------- */

function updateCheckoutButton() {
  const checkoutBtn = document.querySelector('a.btn.btn-success.w-100');
  const cartData = JSON.parse(localStorage.getItem('cart')) || [];
  if (!checkoutBtn) return;

  if (cartData.length === 0) {
    checkoutBtn.classList.add("disabled");
    checkoutBtn.style.pointerEvents = "none";
    checkoutBtn.style.opacity = "0.6";
    checkoutBtn.textContent = "Cart is Empty";
  } else {
    checkoutBtn.classList.remove("disabled");
    checkoutBtn.style.pointerEvents = "auto";
    checkoutBtn.style.opacity = "1";
    checkoutBtn.textContent = "Checkout";
  }
}

/* -------------------------
   Initialization - single DOMContentLoaded
   ------------------------- */

document.addEventListener("DOMContentLoaded", function () {
  // Ensure cart is loaded
  cart = JSON.parse(localStorage.getItem('cart')) || cart || [];

  // Initial updates
  updateCart();
  updateCartCount();
  updateCheckoutButton();

  // Cart page elements
  if (document.getElementById('cart-items')) {
    updateCart();
  }

  // Checkout setup
  if (document.getElementById('checkout-items')) {
    renderCheckoutSummary();
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
  }

  // Inline add-to-cart support: no JS event binding here to avoid duplicates
  // Modal preview (product image modal)
  (function initProductModal() {
    const modalElement = document.getElementById('productModal');
    if (!modalElement) return;
    const modal = new bootstrap.Modal(modalElement);
    const modalImage = document.getElementById('modalProductImage');
    const modalTitle = document.getElementById('modalProductTitle');
    const modalDesc = document.getElementById('modalProductDescription');

    document.querySelectorAll('.card-img-top').forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        const card = img.closest('.card');
        modalImage.src = img.getAttribute('src') || '';
        modalTitle.textContent = card?.querySelector('.card-title')?.textContent || 'Product';
        modalDesc.innerHTML = card?.querySelector('.card-text')?.innerHTML || '';
        modal.show();
      });
    });
  })();

  // Telegram popup (once per day)
  (function initTelegramPopup() {
    const popup = document.getElementById("telegram-popup");
    if (!popup) return;
    const closeBtn = popup.querySelector(".close-btn");
    const popupKey = "telegramPopupClosedAt";
    const lastClosed = localStorage.getItem(popupKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const shouldShow = !lastClosed || now - lastClosed > oneDay;
    if (shouldShow) {
      setTimeout(() => popup.classList.add("show"), 3000);
    }
    const closePopup = () => {
      popup.classList.remove("show");
      localStorage.setItem(popupKey, Date.now());
    };
    if (closeBtn) closeBtn.addEventListener("click", closePopup);
    popup.addEventListener("click", e => { if (e.target === popup) closePopup(); });
  })();

  // Featured product reveal
  (function initFeaturedReveal() {
    const featured = document.getElementById('featured-products');
    if (!featured) return;
    const cards = featured.querySelectorAll('.product-card');
    cards.forEach((card, i) => card.style.transitionDelay = `${0.15 * (i + 1)}s`);
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          featured.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(featured);
  })();

  // Why choose reveal
  (function initWhyChooseReveal() {
    const whyChoose = document.getElementById('why-choose');
    if (!whyChoose) return;
    const cols = whyChoose.querySelectorAll('.col-md-4');
    cols.forEach((col, i) => col.style.transitionDelay = `${0.15 * (i + 1)}s`);
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          whyChoose.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    observer.observe(whyChoose);
  })();

  // Hero reveal
  (function initHero() {
    const heroContent = document.querySelector('.hero-content');
    if (!heroContent) return;
    setTimeout(() => heroContent.classList.add('visible'), 400);
  })();

  // Scroll hint hide
  window.addEventListener('scroll', () => {
    const scrollHint = document.querySelector('.scroll-hint');
    if (!scrollHint) return;
    scrollHint.style.opacity = window.scrollY > 100 ? '0' : '1';
    scrollHint.style.pointerEvents = window.scrollY > 100 ? 'none' : 'auto';
  });

  // Back to top
  (function initBackToTop() {
    const backToTopButton = document.getElementById("backToTop");
    if (!backToTopButton) return;
    window.addEventListener("scroll", () => {
      backToTopButton.style.display = window.scrollY > 300 ? "flex" : "none";
    });
    backToTopButton.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  })();

  // Product image modal initialization (already handled above)

  // Product filtering + clear filters
  (function initProductFiltering() {
    const searchInput = document.getElementById("product-search");
    const brandFilter = document.getElementById("brand-filter");
    const typeFilter = document.getElementById("type-filter");
    const clearBtn = document.getElementById("clear-filters");
    const productList = document.getElementById("product-list");
    const productCards = document.querySelectorAll("#product-list .card.h-100");
    if (!productList) return;

    function filterProducts() {
      const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";
      const brandValue = brandFilter ? brandFilter.value : "";
      const typeValue = typeFilter ? typeFilter.value : "";

      productCards.forEach(card => {
        const name = card.querySelector(".card-title")?.textContent.toLowerCase() || "";
        const brand = card.getAttribute("data-brand") || "";
        const type = card.getAttribute("data-type") || "";
        const col = card.closest(".col-6, .col-md-4");

        const matchesSearch = name.includes(searchTerm);
        const matchesBrand = !brandValue || brand === brandValue;
        const matchesType = !typeValue || type === typeValue;

        if (matchesSearch && matchesBrand && matchesType) {
          if (col) col.classList.remove("d-none");
          card.style.display = "";
          card.classList.add("product-fade");
          setTimeout(() => card.classList.add("show"), 50);
        } else {
          if (col) col.classList.add("d-none");
        }
      });
    }

    if (searchInput) searchInput.addEventListener("input", filterProducts);
    if (brandFilter) brandFilter.addEventListener("change", filterProducts);
    if (typeFilter) typeFilter.addEventListener("change", filterProducts);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (brandFilter) brandFilter.value = "";
        if (typeFilter) typeFilter.value = "";
        productCards.forEach(card => {
          const col = card.closest(".col-6, .col-md-4");
          if (col) {
            col.classList.remove("d-none");
            col.style.display = "";
          }
          card.style.display = "";
          card.classList.remove("show");
          card.classList.add("product-fade");
          setTimeout(() => card.classList.add("show"), 50);
        });
        setTimeout(filterProducts, 100);
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // initial
    filterProducts();
  })();

  // Live inventory from Google Sheets (runs on product pages)
  (function initInventorySync() {
    const sheetURL =
      "https://script.google.com/macros/s/AKfycbzXhvy8kLNCGle9Pw5cWVAZyfr6RaerLizVoe_CBXkBe622tzQrXWgbu_qDXHH8BxPfQw/exec";
    const allButtons = document.querySelectorAll(".add-to-cart");
    if (!allButtons.length) return;
    const productList = document.getElementById("product-list");
    const isProductPage = !!productList;

    async function updateInventory() {
      try {
        if (isProductPage) {
          allButtons.forEach(btn => {
            btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Checking stock...`;
            btn.disabled = true;
          });
        }

        const response = await fetch(sheetURL);
        const data = await response.json();
        const inventoryMap = {};
        (data || []).forEach(item => {
          if (!item.ID) return;
          inventoryMap[item.ID.trim().toLowerCase()] = parseInt(item.Stock);
        });

        const allCards = Array.from(document.querySelectorAll(".card.h-100"));
        allCards.forEach(card => {
          const button = card.querySelector(".add-to-cart");
          const productId = button?.dataset.id?.trim().toLowerCase();
          const stock = inventoryMap[productId];
          if (stock == null || isNaN(stock)) {
            button.textContent = "Add to Cart";
            button.disabled = false;
            button.classList.remove("btn-warning", "btn-secondary");
            button.classList.add("btn-primary");
            return;
          }
          card.dataset.stockLevel = stock;
          if (stock < 20) {
            button.textContent = "Out of Stock";
            button.disabled = true;
            button.classList.remove("btn-primary", "btn-warning");
            button.classList.add("btn-secondary");
          } else if (stock >= 20 && stock <= 30) {
            button.textContent = "Low Stock";
            button.disabled = false;
            button.classList.remove("btn-primary", "btn-secondary");
            button.classList.add("btn-warning");
          } else {
            button.textContent = "Add to Cart";
            button.disabled = false;
            button.classList.remove("btn-warning", "btn-secondary");
            button.classList.add("btn-primary");
          }
        });

        // Sorting on product page
        if (isProductPage) {
          const sortedCards = Array.from(productList.querySelectorAll(".card.h-100")).sort((a, b) => {
            const brandA = (a.dataset.brand || "").toLowerCase();
            const brandB = (b.dataset.brand || "").toLowerCase();
            if (brandA !== brandB) return brandA.localeCompare(brandB);
            const stockA = parseInt(a.dataset.stockLevel || 0);
            const stockB = parseInt(b.dataset.stockLevel || 0);
            const rank = stock => (stock > 30 ? 1 : stock >= 20 ? 2 : 3);
            return rank(stockA) - rank(stockB);
          });
          sortedCards.forEach(card => productList.appendChild(card.closest(".col-6")));
        }

      } catch (error) {
        console.error("❌ Error fetching inventory:", error);
      }
    }

    updateInventory();
    setInterval(updateInventory, 300000);
  })();

  // Promo code system (free item + free shipping)
  (function initPromoSystem() {
    const promoSection = document.getElementById("promo-section");
    if (!promoSection) return;

    promoSection.innerHTML = `
      <div class="input-group mb-3">
        <input type="text" id="promo-code-input" class="form-control" placeholder="Enter promo code">
        <button id="apply-promo-btn" class="btn btn-outline-primary">Apply</button>
      </div>
      <p id="promo-message" class="mt-2 text-center small" style="transition: opacity 0.6s;"></p>
    `;

    const applyBtn = document.getElementById("apply-promo-btn");
    const promoInput = document.getElementById("promo-code-input");
    const promoMsg = document.getElementById("promo-message");

    const validFreeItemCodes = ["BELIGAS101", "SIXPEX202", "XENO303"];
    const validShippingCodes = ["FREESHIP20", "SHIP2025", "NOPOSTAGE"];

    const freeItem = {
      id: "free-testc200mg",
      name: "Testosterone Cypionate, 200mg (1 vial)",
      price: 0.00,
      image: "images/testc200mg.png",
      quantity: 1
    };

    const getCart = () => JSON.parse(localStorage.getItem("cart")) || [];
    const saveCart = (c) => localStorage.setItem('cart', JSON.stringify(c));
    function showMessage(text, type) {
      promoMsg.textContent = text;
      promoMsg.className = type;
      promoMsg.style.opacity = 1;
      setTimeout(() => (promoMsg.style.opacity = 0), 5000);
    }

    applyBtn.addEventListener("click", () => {
      const enteredCode = promoInput.value.trim().toUpperCase();
      const c = getCart();
      if (!enteredCode) {
        showMessage("❌ Please enter a promo code.", "text-danger");
        return;
      }

      if (validFreeItemCodes.includes(enteredCode)) {
        showMessage(`✅ Promo "${enteredCode}" applied — Free Test Cyp 200mg added!`, "text-success");
        if (!c.some(i => i.id === freeItem.id)) {
          c.push(freeItem);
          saveCart(c);
        }
        localStorage.setItem("appliedPromoCode", enteredCode);
        localStorage.setItem("promoType", "free-item");
        promoInput.value = "";
        updateCart();
        return;
      }

      if (validShippingCodes.includes(enteredCode)) {
        showMessage(`✅ Promo "${enteredCode}" applied — Free Shipping up to $20!`, "text-success");
        localStorage.setItem("appliedPromoCode", enteredCode);
        localStorage.setItem("promoType", "free-shipping");
        promoInput.value = "";
        updateCart();
        return;
      }

      showMessage("❌ Invalid promo code.", "text-danger");
      localStorage.removeItem("appliedPromoCode");
      localStorage.removeItem("promoType");
      const updatedCart = c.filter(i => i.id !== freeItem.id);
      saveCart(updatedCart);
      updateCart();
    });
  })();

  // Initial highlight for nav links
  (function highlightNav() {
    document.querySelectorAll('.nav-link').forEach(link => {
      if (link.href.includes(location.pathname.split("/").pop())) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  })();

}); // end DOMContentLoaded

/* -------------------------
   End of script.js
   ------------------------- */

