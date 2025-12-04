import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Cart() {
  const navigate = useNavigate();
  const { cart, updateCartItem, removeFromCart, getCartTotal, loading } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-xl text-gray-600 mb-4">Please login to view your cart</div>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Login
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading cart...</div>
      </div>
    );
  }

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-xl text-gray-600 mb-4">Your cart is empty</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(productId, newQuantity);
  };

  const handleRemove = (productId) => {
    if (window.confirm('Remove this item from cart?')) {
      removeFromCart(productId);
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Shopping Cart</h1>

      <div className="space-y-4 mb-8">
        {cart.items.map((item) => (
          <div
            key={item.productId}
            className="bg-white rounded-lg shadow-md p-4 flex items-center space-x-4"
          >
            <img
              src={item.imageUrl || 'https://via.placeholder.com/100'}
              alt={item.name}
              className="w-24 h-24 object-cover rounded"
            />

            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
              <p className="text-gray-600">${item.price.toFixed(2)} each</p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                -
              </button>
              <span className="text-lg font-semibold px-4">{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
              >
                +
              </button>
            </div>

            <div className="text-lg font-bold text-blue-600 w-24 text-right">
              ${(item.price * item.quantity).toFixed(2)}
            </div>

            <button
              onClick={() => handleRemove(item.productId)}
              className="text-red-600 hover:text-red-700 px-3 py-1"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold text-gray-800">Total:</span>
          <span className="text-3xl font-bold text-blue-600">
            ${getCartTotal().toFixed(2)}
          </span>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold"
          >
            Continue Shopping
          </button>

          <button
            onClick={handleCheckout}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
