// script.js - fixed version with cart + checkout + EmailJS via fetch()

document.addEventListener('touchstart', function() {}, {passive: true});

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00;

// ---------------- CART FUNCTIONS ----------------

// Update navbar + floating cart count
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    const floatingCartCount = document.getElementById('floating-cart-count');

    // === Navbar Cart Count ===
    if (cartCountEl) {
        cartCountEl.textContent = totalQuantity;

        // ✨ Trigger pop animation (navbar)
        cartCountEl.classList.remove('pop');
        void cartCountEl.offsetWidth; // reset animation
        cartCountEl.classList.add('pop');
    }

    // === Floating Cart Count ===
    if (floatingCartCount) {
        floatingCartCount.textContent = totalQuantity;

        // ✨ Trigger pop animation (floating)
        floatingCartCount.classList.remove('pop');
        void floatingCartCount.offsetWidth; // reset animation
        floatingCartCount.classList.add('pop');
    }

    // Save cart data
    localStorage.setItem('cart', JSON.stringify(cart));
}

// === Show Floating Notification ===
function showCartNotification(message) {
  // Remove any existing notification first
  const existing = document.querySelector('.cart-notification');
  if (existing) existing.remove();

  // Create notification element
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Trigger fade-in
  setTimeout(() => notification.classList.add('show'), 50);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 400);
  }, 3000);
}

// Show "Added to Cart" popup message
function showAddedToast(itemName) {
    let toast = document.createElement('div');
    toast.className = 'added-toast';
    toast.textContent = `✅ ${itemName} added to cart!`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 10); // small delay for animation
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // cleanup
    }, 2000);
}

// Render cart page
function updateCart() {
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

    if (cart.length === 0) {
    if (emptyMsg) emptyMsg.style.display = 'block';
    if (subtotalEl) subtotalEl.textContent = '$0.00';
    if (shippingEl) shippingEl.textContent = '$0.00';
    if (grandTotalEl) grandTotalEl.textContent = '$0.00';

    // Ensure checkout button updates when cart becomes empty
    if (typeof updateCheckoutButton === 'function') {
        updateCheckoutButton();
    }

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
        const imageHtml = `<img src="${imageSrc}" alt="${item.name}" class="img-thumbnail me-2" style="width: 60px; height: 60px; object-fit: cover;">`;

       cartItems.innerHTML += `
    <div class="card mb-3">
        <div class="card-body d-flex align-items-center flex-wrap gap-3">
            <img src="${imageSrc}" alt="${item.name}" class="img-thumbnail" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;">
            
            <div class="flex-grow-1">
                <h6 class="mb-1">${item.name}</h6>
                <p class="mb-1 text-muted">$${itemPrice.toFixed(2)} each</p>
            </div>

            <div class="d-flex align-items-center gap-2">
                <input type="number" class="form-control" value="${quantity}" min="1" style="width: 70px;" onchange="updateQuantity(${index}, this.value)">
                <strong>$${lineTotal.toFixed(2)}</strong>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button>
            </div>
        </div>
    </div>
`;

    });

    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

    localStorage.setItem('cart', JSON.stringify(cart));

     // ✅ Update checkout button state after updating cart
    updateCheckoutButton();
}

// Add to cart
function addToCart(button) {
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

    updateCart();
    showCartNotification(`✅ ${name} added to cart!`);
}

// Quantity change
function updateQuantity(index, newQty) {
    const qty = parseInt(newQty) || 1;
    if (qty < 1) {
        removeFromCart(index);
        return;
    }
    cart[index].quantity = qty;
    updateCart();
}

// Remove item
function removeFromCart(index) {
    // Remove item from the cart array
    cart.splice(index, 1);
    localStorage.setItem('cart', JSON.stringify(cart));

    // ✅ Re-render the cart so UI updates immediately
    updateCart();
    updateCartCount();
}



// ---------------- CHECKOUT FUNCTIONS ----------------

// Render checkout summary
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
                <img src="${imageSrc}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;">
                <div class="ms-2">
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">Qty: ${quantity} | $${itemPrice.toFixed(2)} each</small>
                </div>
                <div class="ms-auto"><strong>$${lineTotal.toFixed(2)}</strong></div>
            </div>
            <hr class="my-1">
        `;
    });

    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = shipping.toFixed(2);
    if (grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);
}

// Handle checkout submission + EmailJS via fetch
function handleCheckoutSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('checkout-form');
    if (!form.checkValidity()) {
        alert('Please fill all required fields!');
        return;
    }

    const formData = new FormData(form);
    const fullName = formData.get('full-name');
    const customerEmail = formData.get('email');
    const street = formData.get('street-address');
    const city = formData.get('city');
    const state = formData.get('state');
    const zip = formData.get('zip-code');
    const country = formData.get('country');
    const paymentMethod = formData.get('payment-method');
    const proofFile = formData.get('proof-upload');

    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = storedCart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalQuantity = storedCart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    const orderId = 'ORDER-' + Date.now();
    const itemsSummary = storedCart.map(item => `${item.name} (Qty: ${item.quantity || 1})`).join(', ');
    const cartDetails = JSON.stringify(storedCart, null, 2);

    // Common payload info
    const serviceID = "service_uerk41r";
    const userID = "8tIW2RqhekSLKVqLT";

    // Customer email payload
 const customerPayload = {
    service_id: serviceID,
    template_id: "template_0ry9w0v",
    user_id: userID,
    template_params: {
        order_id: orderId,
        customer_name: fullName,
        total: grandTotal.toFixed(2),
        payment_method: paymentMethod,
        full_address: `${street}, ${city}, ${state} ${zip}, ${country}`,
        items_summary: itemsSummary,
        customer_email: customerEmail,   // keep this
        to_email: customerEmail          // ✅ add this
    }
};


    // Owner email payload
    const ownerPayload = {
        service_id: serviceID,
        template_id: "template_8x2z86l",
        user_id: userID,
        template_params: {
            order_id: orderId,
            total: grandTotal.toFixed(2),
            customer_name: fullName,
            customer_email: customerEmail,
            full_address: `${street}, ${city}, ${state} ${zip}, ${country}`,
            payment_method: paymentMethod,
            proof_filename: proofFile ? proofFile.name : "N/A",
            items_summary: itemsSummary,
            cart_details: cartDetails,
            to_email: "aasshop100@gmail.com"
        }
    };

    // Send to customer
    fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(customerPayload)
    })
    .then(res => res.ok ? console.log("Customer email sent") : console.error("Customer email failed", res))
    .catch(err => console.error("Customer email error", err));

    // Send to owner
    fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ownerPayload)
    })
    .then(res => res.ok ? console.log("Owner email sent") : console.error("Owner email failed", res))
    .catch(err => console.error("Owner email error", err));

    // ✅ Show success message and clear cart
alert("✅ Thank you! Your order has been submitted. Check your email for confirmation.");
localStorage.removeItem('cart');
window.location.href = "index.html";


    // Clear cart and redirect
    localStorage.setItem('cart', JSON.stringify([]));
    cart = [];
    updateCartCount();
    window.location.href = 'index.html';
}

// ✅ Enable or disable checkout button based on cart content
function updateCheckoutButton() {
    const checkoutBtn = document.querySelector('a.btn.btn-success.w-100');
    const cartData = JSON.parse(localStorage.getItem('cart')) || [];

    if (!checkoutBtn) return; // if not on cart page, exit

    if (cartData.length === 0) {
        // Disable checkout
        checkoutBtn.classList.add("disabled");
        checkoutBtn.style.pointerEvents = "none";
        checkoutBtn.style.opacity = "0.6";
        checkoutBtn.textContent = "Cart is Empty";
    } else {
        // Enable checkout
        checkoutBtn.classList.remove("disabled");
        checkoutBtn.style.pointerEvents = "auto";
        checkoutBtn.style.opacity = "1";
        checkoutBtn.textContent = "Checkout";
    }
}


// ---------------- INIT ----------------
// Run functions when the page is ready
document.addEventListener("DOMContentLoaded", function() {
    updateCart();
    updateCartCount();
    updateCheckoutButton();

    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            addToCart(this);
        });
    });

    if (document.getElementById('cart-items')) {
        updateCart();
    }

    if (document.getElementById('checkout-items')) {
        renderCheckoutSummary();
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        }
    }
});

// Highlight current page in navbar
document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href.includes(location.pathname.split("/").pop())) {
        link.classList.add('active');
    } else {
        link.classList.remove('active');
    }
});

function showPaymentDetails(id) {
  document.querySelectorAll('.payment-details').forEach(el => {
    el.style.display = 'none';
  });
  const details = document.getElementById(id);
  if (details) {
    details.style.display = 'block';
  }
}

function copyToClipboard(elementId) {
  const input = document.getElementById(elementId);
  if (!input) return;

  const button = input.parentElement.querySelector("button");

  navigator.clipboard.writeText(input.value).then(() => {
    const originalText = button.textContent;

    // ✅ Change text and color
    button.textContent = "✅ Copied!";
    button.classList.add("copied");
    button.disabled = true;

    // Revert after 2 seconds
    setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("copied");
      button.disabled = false;
    }, 2000);
  });
}

// === Fade-in effect for Why Choose Us cards ===
document.addEventListener("DOMContentLoaded", function() {
  const cards = document.querySelectorAll(".why-choose .p-4");

  const revealOnScroll = () => {
    const triggerBottom = window.innerHeight * 0.9;

    cards.forEach(card => {
      const cardTop = card.getBoundingClientRect().top;
      if (cardTop < triggerBottom) {
        card.classList.add("visible");
      }
    });
  };

  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll(); // run once on load
});


// === Combined Page Initialization ===
document.addEventListener("DOMContentLoaded", function() {
  // === CART INITIALIZATION ===
  updateCart();
  updateCartCount();
  updateCheckoutButton();

  // ✅ Add-to-cart button event binding (safe single-binding version)
const addButtons = document.querySelectorAll('.add-to-cart');
addButtons.forEach(button => {
  // Remove any existing listener before reattaching (prevents double-fire)
  button.replaceWith(button.cloneNode(true));
});

const refreshedButtons = document.querySelectorAll('.add-to-cart');
refreshedButtons.forEach(button => {
  button.addEventListener('click', function() {
    addToCart(this);
  });
});


  // Update cart or checkout summary if on respective pages
  if (document.getElementById('cart-items')) {
    updateCart();
  }
  if (document.getElementById('checkout-items')) {
    renderCheckoutSummary();
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
  }

  // Highlight current page in navbar
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href.includes(location.pathname.split("/").pop())) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // === TELEGRAM POPUP (once per day) ===
  const popup = document.getElementById("telegram-popup");
  if (popup) {
    const closeBtn = popup.querySelector(".close-btn");
    const popupKey = "telegramPopupClosedAt";

    const lastClosed = localStorage.getItem(popupKey);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const shouldShow = !lastClosed || now - lastClosed > oneDay;

    if (shouldShow) {
      setTimeout(() => {
        popup.classList.add("show");
      }, 3000);
    }

    const closePopup = () => {
      popup.classList.remove("show");
      localStorage.setItem(popupKey, Date.now());
    };

    closeBtn.addEventListener("click", closePopup);
    popup.addEventListener("click", e => {
      if (e.target === popup) closePopup();
    });
  }

 // === Fade-in for Featured Products Section ===
const featured = document.getElementById('featured-products');
if (featured) {
  const cards = featured.querySelectorAll('.product-card');

  cards.forEach((card, i) => {
    card.style.transitionDelay = `${0.15 * (i + 1)}s`;
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        featured.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(featured);
}

// === Fade-in for Why Choose Us Section ===
const whyChoose = document.getElementById('why-choose');
if (whyChoose) {
  const cols = whyChoose.querySelectorAll('.col-md-4');
  cols.forEach((col, i) => {
    col.style.transitionDelay = `${0.15 * (i + 1)}s`;
  });

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        whyChoose.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  observer.observe(whyChoose);
}

// === Fade-in Animation for Hero Section ===
const heroContent = document.querySelector('.hero-content');
if (heroContent) {
  // Delay a bit so it feels natural when page loads
  setTimeout(() => {
    heroContent.classList.add('visible');
  }, 400);
}

 // Hide scroll hint when user scrolls down
window.addEventListener('scroll', () => {
  const scrollHint = document.querySelector('.scroll-hint');
  if (scrollHint) {
    if (window.scrollY > 100) {
      scrollHint.style.opacity = '0';
      scrollHint.style.pointerEvents = 'none';
    } else {
      scrollHint.style.opacity = '1';
      scrollHint.style.pointerEvents = 'auto';
    }
  }
}); // closes the scroll event listener

}); // ✅ closes the big DOMContentLoaded block

// === Back to Top Button ===
const backToTopButton = document.getElementById("backToTop");

if (backToTopButton) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  backToTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// === Product Image Modal Preview (Safe for All Pages) ===
document.addEventListener("DOMContentLoaded", () => {
  const modalElement = document.getElementById('productModal');
  if (!modalElement) return; // ✅ Skip if this page has no modal

  const modal = new bootstrap.Modal(modalElement);
  const modalImage = document.getElementById('modalProductImage');
  const modalTitle = document.getElementById('modalProductTitle');
  const modalDesc = document.getElementById('modalProductDescription');

  document.querySelectorAll('.card-img-top').forEach(img => {
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => {
      const card = img.closest('.card');
      const title = card.querySelector('.card-title')?.textContent || 'Product';
      const desc = card.querySelector('.card-text')?.innerHTML || '';
      const src = img.getAttribute('src');

      modalImage.src = src;
      modalTitle.textContent = title;
      modalDesc.innerHTML = desc;
      modal.show();
    });
  });
});



// ========== PRODUCT FILTERING + CLEAR FILTERS ==========
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("product-search");
  const brandFilter = document.getElementById("brand-filter");
  const typeFilter = document.getElementById("type-filter");
  const clearBtn = document.getElementById("clear-filters");
  const productCards = document.querySelectorAll("#product-list .card.h-100");

  // === Filter products ===
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
        card.style.display = ""; // ensure visible
        card.classList.add("product-fade");
        setTimeout(() => card.classList.add("show"), 50);
      } else {
        if (col) col.classList.add("d-none");
      }
    });
  }

  // === Filter triggers ===
  if (searchInput) searchInput.addEventListener("input", filterProducts);
  if (brandFilter) brandFilter.addEventListener("change", filterProducts);
  if (typeFilter) typeFilter.addEventListener("change", filterProducts);

  // === Clear Filters Button ===
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (brandFilter) brandFilter.value = "";
      if (typeFilter) typeFilter.value = "";

      // Remove any inline styles and d-none from columns/cards
      productCards.forEach(card => {
        const col = card.closest(".col-6, .col-md-4");
        if (col) {
          col.classList.remove("d-none");
          col.style.display = ""; // reset inline style if present
        }
        card.style.display = ""; // reset inline style if present
        card.classList.remove("show");
        card.classList.add("product-fade");
        setTimeout(() => card.classList.add("show"), 50);
      });

      // Re-run the filter logic once to be consistent (should show all)
      setTimeout(filterProducts, 100);

      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // === Initial load ===
  filterProducts();
}); // ✅ This closing brace and parenthesis are essential!


// === LIVE INVENTORY CHECK FROM GOOGLE SHEETS ===
document.addEventListener("DOMContentLoaded", () => {
  // ✅ Run only if there are products on this page
  const allButtons = document.querySelectorAll(".add-to-cart");
  if (allButtons.length === 0) return; // stop silently if no products

  const sheetURL =
    "https://script.google.com/macros/s/AKfycbzXhvy8kLNCGle9Pw5cWVAZyfr6RaerLizVoe_CBXkBe622tzQrXWgbu_qDXHH8BxPfQw/exec"; // your Google Apps Script URL

  async function updateInventory() {
    try {
      const response = await fetch(sheetURL);
      const data = await response.json();

      console.log("📦 Fetched Inventory Data:", data);

      data.forEach((item) => {
        const productId = item.ID?.trim();
        const stock = parseInt(item.Stock);

        // find matching button (case-insensitive)
        const button = Array.from(allButtons).find(
          (btn) =>
            btn.dataset.id?.trim().toLowerCase() ===
            productId?.toLowerCase()
        );

        if (!button) return; // skip silently

        // === Update button states ===
        if (stock <= 0 || stock < 20) {
          // Out of stock if 0–19
          button.textContent = "Out of Stock";
          button.disabled = true;
          button.classList.remove("btn-primary", "btn-warning");
          button.classList.add("btn-secondary");
        } else if (stock >= 20 && stock <= 30) {
          // Low stock if 20–30
          button.textContent = "Low Stock";
          button.disabled = false;
          button.classList.remove("btn-primary", "btn-secondary");
          button.classList.add("btn-warning");
        } else {
          // In stock if >30
          button.textContent = "Add to Cart";
          button.disabled = false;
          button.classList.remove("btn-warning", "btn-secondary");
          button.classList.add("btn-primary");
        }
      });

      console.log("✅ Inventory sync complete");
    } catch (error) {
      console.error("❌ Error fetching inventory:", error);
    }
  }

  // 🔹 Run once on page load
  updateInventory();

  // 🔁 Auto-refresh every 5 minutes (300,000 ms)
  setInterval(() => {
    console.log("🔄 Auto inventory refresh triggered...");
    updateInventory();
  }, 300000);
});


















