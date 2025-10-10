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

// Checkout (redirect to checkout.html)
function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    // Redirect to checkout page
    window.location.href = 'checkout.html';
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

    // Checkout page logic (runs if on checkout.html)
    if (document.getElementById('checkout-form')) {
        // Populate order summary on load
        const summaryLoaded = function() {
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            if (cart.length === 0) {
                alert('Cart is empty! Redirecting to products.');
                window.location.href = 'products.html';
                return;
            }

            let subtotal = 0;
            let totalQuantity = 0;
            const orderItems = []; // For template loop
            cart.forEach(item => {
                const qty = item.quantity || 1;
                const lineTotal = Number(item.price) * qty;
                subtotal += lineTotal;
                totalQuantity += qty;
                orderItems.push({
                    name: item.name,
                    quantity: qty,
                    price: Number(item.price).toFixed(2),
                    lineTotal: lineTotal.toFixed(2)
                });
            });
            const shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
            const grandTotal = subtotal + shipping;

            document.getElementById('checkout-subtotal').textContent = `$${subtotal.toFixed(2)}`;
            document.getElementById('checkout-shipping').textContent = `$${shipping.toFixed(2)}`;
            document.getElementById('checkout-total').textContent = `$${grandTotal.toFixed(2)}`;
            document.getElementById('checkout-items').textContent = totalQuantity;

            // Store for submit
            window.orderData = {
                id: 'ORDER-' + Date.now(),
                timestamp: new Date().toISOString(),
                items: orderItems, // Array for template loop
                subtotal: subtotal.toFixed(2),
                shipping: shipping.toFixed(2),
                total: grandTotal.toFixed(2),
                proofFilename: '' // Set on submit
            };

            console.log('Checkout summary loaded:', window.orderData); // Debug
        };

        // Run summary on load
        summaryLoaded();

        // Form validation and submit with SendGrid
        document.getElementById('checkout-form').addEventListener('submit', async function(e) {
            e.preventDefault(); // Prevent default submit

            // Get form values
            const fullName = document.getElementById('full-name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const address = document.getElementById('address').value.trim();
            const city = document.getElementById('city').value.trim();
            const state = document.getElementById('state').value.trim();
            const zip = document.getElementById('zip').value.trim();
            const country = document.getElementById('country').value;
            const payment = document.querySelector('input[name="payment"]:checked');
            const proofFile = document.getElementById('proof-upload').files[0];

            // Validation
            let errors = [];
            if (!fullName) errors.push('Full Name is required.');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Valid Email is required.');
            if (!phone) errors.push('Phone Number is required.');
            if (!address || !city || !state || !zip || !country) errors.push('All address fields are required.');
            if (!payment) errors.push('Please select a payment method.');
            if (!proofFile) errors.push('Proof of payment screenshot is required.');
            if (proofFile && !proofFile.type.startsWith('image/')) errors.push('Proof must be an image file (JPG, PNG, etc.).');

            if (errors.length > 0) {
                alert('Please fix the following errors:\n' + errors.join('\n'));
                return;
            }

            // All good - create order object
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const orderData = window.orderData;
            orderData.proofFilename = proofFile.name;
            const order = {
                id: orderData.id,
                timestamp: orderData.timestamp,
                items: orderData.items, // Array for template
                subtotal: orderData.subtotal,
                shipping: orderData.shipping,
                total: orderData.total,
                customer: {
                    name: fullName,
                    email: email,
                    phone: phone,
                    address: { street: address, city, state, zip, country }
                },
                paymentMethod: payment.value,
                proofFileName: orderData.proofFilename
            };

            // Convert proof file to base64 for attachment
            let proofBase64 = null;
            if (proofFile) {
                const reader = new FileReader();
                reader.readAsDataURL(proofFile);
                await new Promise((resolve) => {
                    reader.onload = () => {
                        proofBase64 = reader.result; // Full base64
                        resolve();
                    };
                });
            }

            // SendGrid Config - YOUR DETAILS
            const API_KEY = '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'; // Regenerate after testing
            const CUSTOMER_TEMPLATE_ID = 'd-0e4a3f6e6f384946a8b7d42b578ad47a';
            const ADMIN_TEMPLATE_ID = 'd-a55f0d96bc324030b783778eee3c89c5';
            const FROM_EMAIL = 'aasshop100@gmail.com';
            const ADMIN_EMAIL = 'aasshop100@gmail.com';
            const BITCOIN_WALLET = ''; // Update if needed

            // Template data for Handlebars
            const templateData = {
                order_id: order.id,
                timestamp: new Date(order.timestamp).toLocaleString(),
                customer_name: order.customer.name,
                customer_email: order.customer.email,
                customer_phone: order.customer.phone,
                subtotal: order.subtotal,
                shipping: order.shipping,
                total: order.total,
                payment_method: order.paymentMethod,
                proof_filename: order.proofFileName,
                bitcoin_wallet: BITCOIN_WALLET,
                address: `${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.state} ${order.customer.address.zip}, ${order.customer.address.country}`,
                items: order.items // Array for loop in template
            };

            try {
                // Send Customer Email
                const customerResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{
                            to: [{ email: order.customer.email }],
                            dynamic_template_data: templateData
                        }],
                        from: { email: FROM_EMAIL },
                        template_id: CUSTOMER_TEMPLATE_ID,
                        attachments: proofBase64 ? [{
                            content: proofBase64.split(',')[1],
                            filename: proofFile.name,
                            type: proofFile.type,
                            disposition: 'attachment'
                        }] : []
                    })
                });

                if (!customerResponse.ok) {
                    const errorData = await customerResponse.json();
                    throw new Error(`Customer email failed: ${errorData.message || customerResponse.statusText}`);
                }

                // Send Admin Email
                const adminResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        personalizations: [{
                            to: [{ email: ADMIN_EMAIL }],
                            dynamic_template_data: templateData
                        }],
                        from: { email: FROM_EMAIL },
                        template_id: ADMIN_TEMPLATE_ID,
                        attachments: proofBase64 ? [{
                            content: proofBase64.split(',')[1],
                            filename: proofFile.name,
                            type: proofFile.type,
                            disposition: 'attachment'
                        }] : []
                    })
                });

                if (!adminResponse.ok) {
                    const errorData = await adminResponse.json();
                    throw new Error(`Admin email failed: ${errorData.message || adminResponse.statusText}`);
                }

                console.log('SendGrid emails sent successfully!');

                // Save to localStorage (backup)
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));

                // Clear cart
                cart.length = 0;
                localStorage.setItem('cart', JSON.stringify(cart));
                updateCartCount();

                // Confirmation
                alert(`Order ${order.id} confirmed! Emails sent to you and ${order.customer.email} with details and proof attachment. Thank you for shopping at GOD MUSCLE GEARS!`);
                
                // Redirect to home
                window.location.href = 'index.html';

            } catch (error) {
                console.error('SendGrid error:', error);
                alert('Order saved locally, but emails failed to send. Please contact us directly. Error: ' + error.message);
                
                // Still save order and clear cart
                let orders = JSON.parse(localStorage.getItem('orders')) || [];
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
                cart.length = 0;
                local

