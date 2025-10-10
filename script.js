// Add this to the top of script.js if needed
document.addEventListener('touchstart', function() {}, {passive: true}); // Improves mobile clicks

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00; // $20 per 10 items (or part thereof)

// Global function to update navbar cart count (call on all pages)
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) {
        cartCountEl.textContent = totalQuantity;
    }
    localStorage.setItem('cart', JSON.stringify(cart)); // Save after any change
}

// Main cart update function (for cart.html)
function updateCart() {
    updateCartCount(); // Always sync navbar

    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const shippingEl = document.getElementById('shipping-fee'); // Requires id="shipping-fee" in HTML
    const grandTotalEl = document.getElementById('cart-grand-total');
    const emptyMsg = document.getElementById('empty-cart-message'); // Requires this div in HTML

    if (!cartItems) return; // Only run if on cart page

    let subtotal = 0;
    let totalQuantity = 0; // Track total items for shipping
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
        totalQuantity += quantity; // Accumulate total quantity

        // Use image if available, fallback to placeholder
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

        // Temp debug
        console.log(`Item: ${item.name}, Qty: ${quantity}, Price: ${itemPrice}, Line Total: ${lineTotal}, Running Subtotal: ${subtotal}`);
    });

    // Quantity-based shipping: $20 per 10 items (or part thereof)
    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
    if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;

    console.log(`Total Items: ${totalQuantity}, Shipping: $${shipping} (${BASE_SHIPPING_PER_10} per 10 items), Subtotal: ${subtotal}, Grand Total: ${grandTotal}`); // Temp debug
}

// Add to cart (merges duplicates by ID, increments quantity)
function addToCart(button) {
    const name = button.dataset.name || 'Unknown Item';
    const priceStr = button.dataset.price || '0';
    const price = Number(priceStr) || 0;
    const id = button.dataset.id || name.toLowerCase().replace(/[^a-z0-9]/g, '-'); // Use data-id or generate one
    const image = button.dataset.image || 'images/default-supplement.png';

    let existingItem = cart.find(item => item.id === id);
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
        console.log(`Updated quantity for ${name} to ${existingItem.quantity}`);
    } else {
        cart.push({ id, name, price, quantity: 1, image });
        console.log(`Added new item: ${name}`);
    }

    updateCart(); // Updates count, saves, and re-renders if on cart page
    alert(`${name} added to cart! (Total Qty: ${existingItem ? existingItem.quantity : 1})`); // Feedback
}

// Update quantity for an item (called from input onchange)
function updateQuantity(index, newQty) {
    const qty = parseInt(newQty) || 1;
    if (qty < 1) {
        removeFromCart(index);
        return;
    }
    cart[index].quantity = qty;
    updateCart(); // Re-renders and updates totals
    console.log(`Quantity updated for ${cart[index].name} to ${qty}`);
}

// Remove item
function removeFromCart(index) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    updateCart();
    console.log(`Removed ${removedName} from cart`);
}

// Checkout
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;
    alert(`Proceeding to checkout... Subtotal: $${subtotal.toFixed(2)} | Shipping: $${shipping.toFixed(2)} (${BASE_SHIPPING_PER_10} per 10 items) | Total: $${grandTotal.toFixed(2)}`);
    // For demo: Clear cart. In real site: Redirect to payment page
    cart = [];
    updateCart();
}

// Clear cart for testing (run in console: clearCart())
function clearCart() {
    cart = [];
    updateCart();
    alert('Cart cleared!');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount(); // Always update navbar count

    // Add event listeners for add-to-cart buttons (on product pages like index.html/products.html)
    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            addToCart(this); // Use the improved function
        });
    });

    // If on cart page, fully render the cart
    if (document.getElementById('cart-items')) {
        updateCart();
    }
});
