// Add this to the top of script.js if needed
document.addEventListener('touchstart', function() {}, {passive: true}); // Improves mobile clicks


let cart = JSON.parse(localStorage.getItem('cart')) || [];
const SHIPPING_FEE = 20.00; // Fixed $20 shipping

function updateCart() {
    document.getElementById('cart-count').textContent = cart.length;
    
    let subtotal = 0;
    const cartItems = document.getElementById('cart-items');
    const subtotalEl = document.getElementById('cart-subtotal');
    const grandTotalEl = document.getElementById('cart-grand-total');
    
    if (cartItems) {
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            const itemPrice = parseFloat(item.price);
            subtotal += itemPrice;
            cartItems.innerHTML += `
                <div class="card mb-3">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <h6>${item.name}</h6>
                            <p class="mb-0">$${itemPrice.toFixed(2)}</p>
                        </div>
                        <button class="btn btn-danger btn-sm" onclick="removeFromCart(${index})">Remove</button>
                    </div>
                </div>
            `;
        });
        
        // Update totals
        const grandTotal = subtotal + SHIPPING_FEE;
        if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
        if (grandTotalEl) grandTotalEl.textContent = `$${grandTotal.toFixed(2)}`;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
}

document.addEventListener('DOMContentLoaded', function() {
    updateCart();

    const addButtons = document.querySelectorAll('.add-to-cart');
    addButtons.forEach(button => {
        button.addEventListener('click', function() {
            const name = this.dataset.name;
            const price = this.dataset.price;
            cart.push({ name, price });
            updateCart();
            alert(`${name} added to cart!`); // Optional: Remove later for better UX
        });
    });
});

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}

function checkout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    const grandTotal = subtotal + SHIPPING_FEE;
    // For now, alert; later integrate Stripe with grandTotal
    alert(`Redirecting to checkout... Total: $${grandTotal.toFixed(2)} (includes $20 shipping)`);
    cart = []; // Clear cart after "purchase"
    updateCart();
}
