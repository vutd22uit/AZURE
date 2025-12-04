import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/api';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await productService.getProductById(id);
      setProduct(response.data);
      setError(null);
    } catch (err) {
      setError('Product not found');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    const result = await addToCart(product, quantity);
    if (result.success) {
      alert('Added to cart successfully!');
      navigate('/cart');
    } else {
      alert(result.error || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Loading product...</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="text-xl text-red-600 mb-4">{error || 'Product not found'}</div>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-6 text-blue-600 hover:text-blue-700 flex items-center"
      >
        ← Back to Products
      </button>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <img
            src={product.imageUrl || 'https://via.placeholder.com/500'}
            alt={product.name}
            className="w-full rounded-lg shadow-lg"
          />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            {product.name}
          </h1>

          <div className="mb-4">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded">
              {product.category}
            </span>
          </div>

          <p className="text-gray-600 text-lg mb-6">
            {product.description}
          </p>

          <div className="mb-6">
            <span className="text-4xl font-bold text-blue-600">
              ${product.price.toFixed(2)}
            </span>
          </div>

          <div className="mb-6">
            <span className="text-gray-700">
              Availability:{' '}
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </span>
            </span>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2">Quantity:</label>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                -
              </button>
              <span className="text-xl font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetail;
