const { getCartContainer } = require('../config/database');

async function getCart(req, res) {
  try {
    const userId = req.user.id.toString();
    const container = getCartContainer();
    const cartId = `cart-${userId}`;

    try {
      const { resource: cart } = await container.item(cartId, userId).read();
      res.status(200).json(cart || { items: [] });
    } catch (err) {
      if (err.code === 404) {
        return res.status(200).json({ items: [] });
      }
      throw err;
    }
  } catch (err) {
    console.error('Get cart error:', err);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

async function addToCart(req, res) {
  try {
    const userId = req.user.id.toString();
    const { productId, name, price, quantity, imageUrl } = req.body;

    if (!productId || !name || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const container = getCartContainer();
    const cartId = `cart-${userId}`;

    let cart;
    try {
      const { resource: existingCart } = await container.item(cartId, userId).read();
      cart = existingCart;
    } catch (err) {
      if (err.code === 404) {
        cart = {
          id: cartId,
          userId: userId,
          items: [],
          createdAt: new Date().toISOString()
        };
      } else {
        throw err;
      }
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        productId,
        name,
        price,
        quantity,
        imageUrl,
        addedAt: new Date().toISOString()
      });
    }

    cart.updatedAt = new Date().toISOString();

    const { resource: updatedCart } = await container.items.upsert(cart);

    res.status(200).json(updatedCart);
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
}

async function updateCartItem(req, res) {
  try {
    const userId = req.user.id.toString();
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const container = getCartContainer();
    const cartId = `cart-${userId}`;

    const { resource: cart } = await container.item(cartId, userId).read();

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    cart.updatedAt = new Date().toISOString();

    const { resource: updatedCart } = await container.items.upsert(cart);

    res.status(200).json(updatedCart);
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ error: 'Failed to update cart' });
  }
}

async function removeFromCart(req, res) {
  try {
    const userId = req.user.id.toString();
    const { productId } = req.params;

    const container = getCartContainer();
    const cartId = `cart-${userId}`;

    const { resource: cart } = await container.item(cartId, userId).read();

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId !== productId);
    cart.updatedAt = new Date().toISOString();

    const { resource: updatedCart } = await container.items.upsert(cart);

    res.status(200).json(updatedCart);
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
}

async function clearCart(req, res) {
  try {
    const userId = req.user.id.toString();
    const container = getCartContainer();
    const cartId = `cart-${userId}`;

    await container.item(cartId, userId).delete();

    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (err) {
    if (err.code === 404) {
      return res.status(200).json({ message: 'Cart already empty' });
    }
    console.error('Clear cart error:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
