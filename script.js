// script.js - fixed version with cart + checkout + EmailJS via fetch()

document.addEventListener('touchstart', function() {}, {passive: true});

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00;

// ---------------- CART FUNCTIONS ----------------

// Update navbar cart count
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    
    if (cartCountEl) {
        cartCountEl.textContent = totalQuantity;

        // ✨ Trigger pop animation
        cartCountEl.classList.remove('pop'); // reset animation if running
        void cartCountEl.offsetWidth; // force reflow for restart
        cartCountEl.classList.add('pop');
    }

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

  // Add-to-cart button listeners
  const addButtons = document.querySelectorAll('.add-to-cart');
  addButtons.forEach(button => {
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
const featuredSection = document.getElementById('featured-products');
if (featuredSection) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        featuredSection.classList.add('visible');
        observer.unobserve(featuredSection); // Animate once only
      }
    });
  }, { threshold: 0.2 });
  
  observer.observe(featuredSection);
}
});





















