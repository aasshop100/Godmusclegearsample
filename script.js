// Add this to the top of script.js if needed
document.addEventListener('touchstart', function() {}, {passive: true}); // Improves mobile clicks

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00; // $20 per 10 items (or part thereof)

// Global function to update navbar cart count
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalQuantity;
    }
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Main cart update function
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
                <div class="card-body">
                    <div class="row align-items-center">
                        <div class="col-md-2">${imageHtml}</div>
                        <div class="col-md-3">
                            <h6 class="mb-1">${item.name}</h6>
                            <p class="mb-1 text-muted">$${itemPrice.toFixed(2)} each</p>
                        </div>
                        <div class="col-md-2">
                            <input type="number" class="form-control w-75 d-inline" value="${quantity}" min="1" onchange="updateQuantity(${index}, this.value)">
                        </div>
                        <div class="col-md-2">
                            <strong>$${lineTotal.toFixed(2)}</strong>
                        </div>
                        <div class="col-md-3">
                            <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button>
                        </div>
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
}

// Add to cart function with debug and global attachment
function addToCart(button) {
    console.log('addToCart is defined and called!');  // Debug log
    const name = button.dataset.name || 'Unknown Item';
    const priceStr = button.dataset.price || '0';
    const price = Number(priceStr) || 0;
    const id = button.dataset.id || name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const image = button.dataset.image || 'images/default-supplement.png';

    let existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({ id, name, price, quantity: 1, image });
    }
    updateCart();
    alert(`${name} added to cart!`);
}
window.addToCart = addToCart;  // Attach to global window object to ensure accessibility

// Render checkout summary
function renderCheckoutSummary() {
    console.log('Rendering checkout summary...');
    const cartFromStorage = JSON.parse(localStorage.getItem('cart')) || [];
    console.log('Cart: ', cartFromStorage);
    const checkoutItems = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const grandTotalEl = document.getElementById('checkout-grand-total');
    const emptyMsg = document.getElementById('empty-checkout-message');

    if (!checkoutItems) {
        console.log('checkout-items not found!');
        return;
    }

    let subtotal = 0;
    let totalQuantity = 0;
    checkoutItems.innerHTML = '';

    if (cartFromStorage.length === 0) {
        console.log('Cart is empty');
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (shippingEl) shippingEl.textContent = '$0.00';
        if (grandTotalEl) grandTotalEl.textContent = '$0.00';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    cartFromStorage.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const quantity = item.quantity || 1;
        const lineTotal = itemPrice * quantity;
        subtotal += lineTotal;
        totalQuantity += quantity;
        checkoutItems.innerHTML += '<div>...</div>';  // Your HTML generation code
    });

    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;
    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = '$' + shipping.toFixed(2);
    if (grandTotalEl) grandTotalEl.textContent = '$' + grandTotal.toFixed(2);
    console.log('Summary calculated');
}

// Handle checkout form submission (unchanged)

// Update quantity and remove functions (unchanged)

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded');
    updateCartCount();
    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(button => {
        button.addEventListener('click', window.addToCart);  // Use the global reference
    });
    if (document.getElementById('cart-items')) updateCart();
    if (document.getElementById('checkout-items')) renderCheckoutSummary();
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);
});
