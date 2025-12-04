import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold hover:text-blue-200">
            E-Commerce Cloud
          </Link>

          <nav className="flex items-center space-x-6">
            <Link to="/" className="hover:text-blue-200">
              Home
            </Link>

            {isAuthenticated ? (
              <>
                <Link to="/cart" className="relative hover:text-blue-200">
                  Cart
                  {getCartCount() > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {getCartCount()}
                    </span>
                  )}
                </Link>

                <div className="flex items-center space-x-4">
                  <span className="text-sm">Hello, {user?.name}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hover:text-blue-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
