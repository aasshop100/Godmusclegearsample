// === Cart / Checkout / Animation Script ===

// --- Add to Cart logic ---
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

// --- Notification (toast) for Add to Cart ---
function showCartNotification(message) {
  const existing = document.querySelector('.cart-notification');
  if (existing) existing.remove();

  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  document.body.appendChild(notification);

  // Fade in
  setTimeout(() => notification.classList.add('show'), 50);

  // Auto-hide after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 400);
  }, 3000);
}

// === Document Ready / Initialization ===
document.addEventListener("DOMContentLoaded", function() {
  // Cart initialization
  updateCart();
  updateCartCount();
  updateCheckoutButton();

  // Add-to-cart button event binding
  const addButtons = document.querySelectorAll('.add-to-cart');
  addButtons.forEach(button => {
    button.addEventListener('click', function() {
      addToCart(this);
    });
  });

  // If on Cart page
  if (document.getElementById('cart-items')) {
    updateCart();
  }

  // If on Checkout page
  if (document.getElementById('checkout-items')) {
    renderCheckoutSummary();
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
  }

  // Highlight active nav-link
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.href.includes(location.pathname.split("/").pop())) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Telegram popup logic (once per day)
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

  // Fade-in for Featured Products Section
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

  // Fade-in for Why Choose Us Section
  const whyChoose = document.getElementById('why-choose');
  if (whyChoose) {
    const cols = whyChoose.querySelectorAll('.col-md-4');
    cols.forEach((col, i) => {
      col.style.transitionDelay = `${0.15 * (i + 1)}s`;
    });

    const observerWC = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          whyChoose.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    observerWC.observe(whyChoose);
  }

  // Fade-in Animation for Hero Section
  const heroContent = document.querySelector('.hero-content');
  if (heroContent) {
    setTimeout(() => {
      heroContent.classList.add('visible');
    }, 400);
  }

  // Hide scroll hint when user scrolls
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
  });

}); // end of DOMContentLoaded
