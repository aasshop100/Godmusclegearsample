// Add this to the top of script.js if needed
document.addEventListener('touchstart', function() {}, {passive: true}); // Improves mobile clicks


let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCart() {
    document.getElementById('cart-count').textContent = cart.length;
    let total = 0;
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = '';
        cart.forEach((item, index) => {
            total += parseFloat(item.price);
            cartItems.innerHTML += `
                <div class="col-12 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h5>${item.name}</h5>
                            <p>$${item.price}</p>
                            <button class="btn btn-danger" onclick="removeFromCart(${index})">Remove</button>
                        </div>
                    </div>
                </div>
            `;
        });
        document.getElementById('cart-total').textContent = total.toFixed(2);
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
            alert(`${name} added to cart!`);
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
    // For now, just alert; later integrate Stripe
    alert('Redirecting to checkout... (Implement payment here)');
    cart = []; // Clear cart after "purchase"
    updateCart();

}
