import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService } from '../services/api';

function Checkout() {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart } = useCart();
  const { token, isAuthenticated, user } = useAuth();

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    paymentMethod: 'credit_card'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-xl text-gray-600 mb-4">Please login to checkout</div>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Login
        </button>
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

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        items: cart.items.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country
        },
        paymentMethod: formData.paymentMethod
      };

      const response = await orderService.createOrder(token, orderData);

      // Clear cart after successful order
      await clearCart();

      alert(`Order created successfully! Order ID: ${response.data.id}`);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-gray-800">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Shipping Information</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Street Address</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Payment Method</label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:border-blue-500"
              >
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="paypal">PayPal</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold"
              >
                Back to Cart
              </button>

              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold disabled:bg-gray-400"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">Order Summary</h2>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="space-y-3 mb-4">
              {cart.items.map((item) => (
                <div key={item.productId} className="flex justify-between text-gray-700">
                  <span>{item.name} x {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Subtotal:</span>
                <span className="text-gray-700">${getCartTotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Shipping:</span>
                <span className="text-gray-700">$0.00</span>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-xl font-semibold text-gray-800">Total:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
