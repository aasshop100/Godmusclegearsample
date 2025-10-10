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

// Render checkout summary (for checkout.html) - Fixed template literal
function renderCheckoutSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const checkoutItems = document.getElementById('checkout-items');
    const subtotalEl = document.getElementById('checkout-subtotal');
    const shippingEl = document.getElementById('checkout-shipping');
    const grandTotalEl = document.getElementById('checkout-grand-total');
    const emptyMsg = document.getElementById('empty-checkout-message');

    if (!checkoutItems) return; // Only run if on checkout page

    let subtotal = 0;
    let totalQuantity = 0;
    checkoutItems.innerHTML = '';

    if (cart.length === 0) {
        if (emptyMsg) emptyMsg.style.display = 'block';
        if (subtotalEl) subtotalEl.textContent = '$0.00';
        if (shippingEl) shippingEl.textContent = '$0.00';
        if (grandTotalEl) grandTotalEl.textContent = '$0.00';
        return;
    }

    if (emptyMsg) emptyMsg.style.display = 'none';

    cart.forEach(item => {
        const itemPrice = Number(item.price) || 0;
        const quantity = item.quantity || 1;
        const lineTotal = itemPrice * quantity;
        subtotal += lineTotal;
        totalQuantity += quantity;

        const imageSrc = item.image || 'images/default-supplement.png';
        const imageHtml = `<img src="${imageSrc}" alt="${item.name}" class="img-thumbnail me-2" style="width: 50px; height: 50px; object-fit: cover;">`;

        // Fixed: Single-line template to avoid copy-paste issues
        checkoutItems.innerHTML += '<div class="d-flex align-items-center mb-2"><div>' + imageHtml + '</div><div class="ms-2"><h6 class="mb-0">' + item.name + '</h6><small class="text-muted">Qty: ' + quantity + ' | $' + itemPrice.toFixed(2) + ' each</small></div><div class="ms-auto"><strong>$' + lineTotal.toFixed(2) + '</strong></div></div><hr class="my-1">';
    });

    // Calculate shipping and total (reuse logic from cart)
    const BASE_SHIPPING_PER_10 = 20.00;
    let shipping = Math.ceil(totalQuantity / 10) * BASE_SHIPPING_PER_10;
    const grandTotal = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = '$' + subtotal.toFixed(2);
    if (shippingEl) shippingEl.textContent = '$' + shipping.toFixed(2);
    if (grandTotalEl) grandTotalEl.textContent = '$' + grandTotal.toFixed(2);

    console.log('Checkout rendered successfully:', { subtotal, shipping, grandTotal, totalQuantity, cartLength: cart.length }); // Debug
}

// Handle checkout form submission (with EmailJS)
function handleCheckoutSubmit(event) {
    event.preventDefault(); // Stop page reload
    const form = document.getElementById('checkout-form');
    if (!form.checkValidity()) {
        alert('Please fill all required fields!');
        return;
    }

    // Get form data
    const formData = new FormData(form);
    const fullName = formData.get('full-name');
    const customerEmail = formData.get('email');
    const street = formData.get('street-address');
    const city = formData.get('city');
    const state = formData.get('state');
    const zip = formData.get('zip-code');
    const country = formData.get('country');
    const fullAddress = street + ', ' + city + ', ' + state + ' ' + zip + ', ' + country;
    const paymentMethod = formData.get('payment-method');
    const proofFile = formData.get('proof-upload');

    if (!proofFile) {
        alert('Please upload proof of payment!');
        return;
    }

    // Calculate totals and order details
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * (item.quantity || 1)), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const shipping = Math.ceil(totalQuantity / 10) * 20.00;
    const grandTotal = subtotal + shipping;

    // Generate order ID and summaries
    const orderId = 'ORDER-' + Date.now(); // e.g., ORDER-1725123456789
    const itemsSummary = cart.map(item => item.name + ' (Qty: ' + (item.quantity || 1) + ')').join(', ');
    const cartDetails = JSON.stringify(cart, null, 2); // Full cart for you

    // Initialize EmailJS (REPLACE WITH YOUR User ID)
    emailjs.init(eHXhTKYnIawMoj-Im); // e.g., 'user_jkl012' - from EmailJS Dashboard

    // Prepare common params for templates
    const templateParams = {
        order_id: orderId,
        customer_name: fullName,
        customer_email: customerEmail,
        full_address: fullAddress,
        payment_method: paymentMethod,
        proof_filename: proofFile.name,
        total: grandTotal.toFixed(2),
        items_summary: itemsSummary,
        cart_details: cartDetails
    };

    // Send to Customer (confirmation) - REPLACE WITH YOUR Service ID and Customer Template ID
    emailjs.send(service_uerk41r, template_0ry9w0v, templateParams) // e.g., 'service_abc123', 'template_def456'
        .then(function(response) {
            console.log('Customer email sent!', response.status, response.text);
        }, function(error) {
            console.log('Customer email failed:', error);
            // Still proceed, but notify
        });

    // Send to Owner (you) - REPLACE WITH YOUR Service ID and Owner Template ID
    templateParams.to_email = 'aasshop100@gmail.com'; // e.g., 'yourbusiness@gmail.com' - your email for notifications
    emailjs.send(service_uerk41r, template_8x2z86l, templateParams) // e.g., 'service_abc123', 'template_ghi789'
        .then(function(response) {
            console.log('Owner email sent!', response.status, response.text);
        }, function(error) {
            console.log('Owner email failed:', error);
        });

    // Success feedback (emails are async - may take seconds)
    alert('Order Placed Successfully!\n\nCustomer: ' + fullName + '\nEmail: ' + customerEmail + '\nAddress: ' + fullAddress + '\nPayment: ' + paymentMethod + '\nProof: ' + proofFile.name + '\nTotal: $' + grandTotal.toFixed(2) + '\n\nConfirmation emails sent! Check spam if not received.\n\nWe\'ll review and ship soon.');
    
    localStorage.setItem('cart', '[]'); // Clear cart
    window.location.href = 'index.html'; // Redirect to home
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
    console.log('Quantity updated for ' + cart[index].name + ' to ' + qty);
}

// Remove item
function removeFromCart(index) {
    const removedName = cart[index].name;
    cart.splice(index, 1);
    updateCart();
    console.log('Removed ' + removedName + ' from cart');
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

    // Copy payment details to clipboard (for checkout buttons)
function copyPaymentDetails(button) {
    console.log('Copy button clicked:', button); // Debug: Confirms click works

    const targetId = button.getAttribute('data-copy-target');
    console.log('Target ID:', targetId); // Debug

    let textToCopy = '';

    if (targetId === 'btc-wallet') {
        const element = document.getElementById('btc-wallet');
        if (element) {
            textToCopy = element.textContent.trim();
        }
    } else if (targetId === 'paypal-email') {
        const element = document.getElementById('paypal-email');
        if (element) {
            textToCopy = element.textContent.trim();
        }
    } else if (targetId === 'wise-details') {
        const accountEl = document.getElementById('wise-account');
        const bankEl = document.getElementById('wise-bank');
        if (accountEl && bankEl) {
            textToCopy = 'Account: ' + accountEl.textContent.trim() + ', Bank: ' + bankEl.textContent.trim();
        }
    }

    console.log('Text to copy:', textToCopy); // Debug: Shows what it's trying to copy

    if (!textToCopy) {
        alert('No text to copy! Check IDs.');
        return;
    }

    // Modern clipboard API (works in most browsers)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(function() {
            console.log('Modern copy success'); // Debug
            showCopyFeedback(button, 'Copied!');
        }).catch(function(err) {
            console.error('Modern copy failed:', err); // Debug
            fallbackCopy(textToCopy, button);
        });
    } else {
        console.log('Using fallback copy'); // Debug
        fallbackCopy(textToCopy, button);
    }
}

// Fallback copy method (selects text and uses execCommand)
function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed'; // Off-screen
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            console.log('Fallback copy success'); // Debug
            showCopyFeedback(button, 'Copied!');
        } else {
            throw new Error('execCommand failed');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err); // Debug
        alert('Copy failed - please select and copy manually: ' + text);
    }
    document.body.removeChild(textArea);
}

// Show temporary feedback on button
function showCopyFeedback(button, message) {
    const originalText = button.textContent;
    button.textContent = message;
    button.classList.remove('btn-outline-secondary');
    button.classList.add('btn-success'); // Green highlight
    setTimeout(function() {
        button.textContent = originalText;
        button.classList.remove('btn-success');
        button.classList.add('btn-outline-secondary');
    }, 2000); // Reset after 2 seconds
}

    // If on cart page, fully render the cart
    if (document.getElementById('cart-items')) {
        updateCart();
    }

    // Checkout page logic
    if (document.getElementById('checkout-items')) {
        renderCheckoutSummary();
        updateCartCount(); // Update navbar
        const checkoutForm = document.getElementById('checkout-form');
        if (checkoutForm) {
            checkoutForm.addEventListener('submit', handleCheckoutSubmit);
        }
    }

    // Search functionality (add to products page)
    if (document.getElementById('search-input')) {
        document.getElementById('search-input').addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const productCards = document.querySelectorAll('#product-list .col-md-4');
            productCards.forEach(card => {
                const title = card.querySelector('.card-title').textContent.toLowerCase();
                if (title.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
});

// Copy payment details to clipboard (for checkout buttons)
function copyPaymentDetails(button) {
    const targetId = button.getAttribute('data-copy-target');
    let textToCopy = '';

    if (targetId === 'btc-wallet') {
        textToCopy = document.getElementById('btc-wallet').textContent;
    } else if (targetId === 'paypal-email') {
        textToCopy = document.getElementById('paypal-email').textContent;
    } else if (targetId === 'wise-details') {
        // Combine Wise account and bank
        const account = document.getElementById('wise-account').textContent;
        const bank = document.getElementById('wise-bank').textContent;
        textToCopy = 'Account: ' + account + ', Bank: ' + bank;
    }

    if (!textToCopy) {
        alert('No text to copy!');
        return;
    }

    // Modern clipboard API (works in most browsers)
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(function() {
            showCopyFeedback(button, 'Copied!');
        }).catch(function(err) {
            console.error('Copy failed:', err);
            fallbackCopy(textToCopy, button);
        });
    } else {
        // Fallback for older browsers
        fallbackCopy(textToCopy, button);
    }
}

// Fallback copy method (selects text and uses execCommand)
function fallbackCopy(text, button) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        showCopyFeedback(button, 'Copied!');
    } catch (err) {
        console.error('Fallback copy failed:', err);
        alert('Copy failed - please select and copy manually: ' + text);
    }
    document.body.removeChild(textArea);
}

// Show temporary feedback on button
function showCopyFeedback(button, message) {
    const originalText = button.textContent;
    button.textContent = message;
    button.classList.add('btn-success'); // Green highlight
    setTimeout(function() {
        button.textContent = originalText;
        button.classList.remove('btn-success');
    }, 2000); // Reset after 2 seconds
}



