// script.js - cleaned and patched for add-to-cart, cart, checkout, EmailJS

document.addEventListener('touchstart', function() {}, {passive: true});

let cart = JSON.parse(localStorage.getItem('cart')) || [];
const BASE_SHIPPING_PER_10 = 20.00;

// Update navbar cart count
function updateCartCount() {
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const cartCountEl = document.getElementById('cart-count');
    if (cartCountEl) cartCountEl.textContent = totalQuantity;
    localStorage.setItem('cart', JSON.stringify(cart));
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

    localStorage.setItem('cart', JSON.stringify(cart));
    console.log('Cart updated:', { totalQuantity, subtotal, shipping, grandTotal });
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
    alert(`${name} added to cart!`);
}

// Render checkout
function renderCheckoutSummary() {
    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutItemsEl = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const grandTotalEl = document.getElementById('checkout-grand-total');
    const emptyMsg = document.getElementById('empty-checkout-message');

    if (!checkoutItemsEl) return;

    let subtotal = 0;
    let totalQuantity = 0;
    checkoutItemsEl.innerHTML = '';

    if (storedCart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (subtotalEl) subtotalEl.textContent = '0.00';
        if (shippingEl) shippingEl.textContent = '0.00';
        if (grandTotalEl) grandTotalEl.textContent = '0.00';
        return;
    }
    if (emptyMsg) emptyMsg.style.display = 'none';

    storedCart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const quantity = item.quantity || 1;
        const lineTotal = itemPrice * quantity;
        subtotal += lineTotal;
        totalQuantity += quantity;

        const imageSrc = item.image || 'images/default-supplement.png';
        const imageHtml = `<img src="${imageSrc}" alt="${item.name}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;">`;
        checkoutItemsEl.innerHTML += `
            <div class="d-flex align-items-center mb-2">
                <div>${imageHtml}</div>
                <div class="ms-2">
                    <h6 class="mb-0">${item.name}</h6>
                    <small class="text-muted">Qty: ${quantity} | $${itemPrice.toFixed(2)} each</small>
                </div>
                <div class="ms-auto">
                    <strong>$${lineTotal.toFixed(2)}</strong>
                </div>
            </div>
            <hr class="my-1">
        `;
    });

    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = shipping.toFixed(2);
    if (grandTotalEl) grandTotalEl.textContent = grandTotal.toFixed(2);

    console.log('Checkout summary rendered:', { subtotal, shipping, grandTotal, totalQuantity });
}

// Handle checkout submission + EmailJS
function handleCheckoutSubmit(event) {
    event.preventDefault();
    const form = document.getElementById('checkout-form');
    if (!form) return;
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

    if (!proofFile || proofFile.size === 0) {
        alert('Please upload proof of payment!');
        return;
    }

    const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = storedCart.reduce(
        (sum, item) => sum + (Number(item.price) * (item.quantity || 1)),
        0
    );
    const totalQuantity = storedCart.reduce(
        (sum, item) => sum + (item.quantity || 1),
        0
    );
    const shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    const orderId = 'ORDER-' + Date.now();
    const itemsSummary = storedCart
        .map(item => `${item.name} (Qty: ${item.quantity || 1})`)
        .join(', ');
    const cartDetails = JSON.stringify(storedCart, null, 2);

    // Initialize EmailJS with your User ID
    try {
        emailjs.init(Ylc8ivuwjh3t5i7Bp);
    } catch (err) {
        console.warn('EmailJS init might have already happened:', err);
    }

    // Template params
    const templateParams = {
        order_id: orderId,
        customer_name: fullName,
        customer_email: customerEmail,
        full_address: `${street}, ${city}, ${state} ${zip}, ${country}`,
        payment_method: paymentMethod,
        proof_filename: proofFile.name,
        total: grandTotal.toFixed(2),
        items_summary: itemsSummary,
        cart_details: cartDetails
    };

    // Send to customer
    templateParams.to_email = customerEmail;
    emailjs.send('service_uerk41r', 'template_0ry9w0v', templateParams)
        .then(function(response) {
            console.log('Customer email sent', response);
        }, function(error) {
            console.error('Customer email failed', error);
            alert('Confirmation email to customer failed to send.');
        });

    // Send to owner
    templateParams.to_email = 'aasshop100@gmail.com';
    emailjs.send('service_uerk41r', 'template_8x2z86l', templateParams)
        .then(function(response) {
            console.log('Owner email sent', response);
        }, function(error) {
            console.error('Owner email failed', error);
            alert('Owner email failed to send.');
        });

 alert('Order Placed Successfully! Check your email for confirmation.');

// Clear cart correctly
localStorage.setItem('cart', JSON.stringify([]));
cart = [];
updateCartCount();

// Redirect to homepage
window.location.href = 'index.html';


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
    if (index < 0 || index >= cart.length) return;
    cart.splice(index, 1);
    updateCart();
}

document.addEventListener('DOMContentLoaded', function() {
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    updateCartCount();

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





