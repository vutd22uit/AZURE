const { getProductsContainer } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

async function getAllProducts(req, res) {
  try {
    const container = getProductsContainer();
    const { resources: products } = await container.items
      .readAll()
      .fetchAll();

    res.status(200).json(products);
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
}

async function getProductById(req, res) {
  try {
    const { id } = req.params;
    const container = getProductsContainer();

    // Query by id across all partitions
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }]
    };

    const { resources: products } = await container.items
      .query(querySpec)
      .fetchAll();

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(products[0]);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, category, imageUrl, stock } = req.body;

    const product = {
      id: uuidv4(),
      name,
      description,
      price,
      category,
      imageUrl,
      stock: stock || 0,
      createdAt: new Date().toISOString()
    };

    const container = getProductsContainer();
    const { resource: createdProduct } = await container.items.create(product);

    res.status(201).json(createdProduct);
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
}

async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const container = getProductsContainer();

    // First, get the product to find its partition key
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }]
    };

    const { resources: products } = await container.items
      .query(querySpec)
      .fetchAll();

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const existingProduct = products[0];
    const updatedProduct = {
      ...existingProduct,
      ...updates,
      id: existingProduct.id,
      category: existingProduct.category, // Don't allow category change (partition key)
      updatedAt: new Date().toISOString()
    };

    const { resource: result } = await container
      .item(id, existingProduct.category)
      .replace(updatedProduct);

    res.status(200).json(result);
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
}

async function deleteProduct(req, res) {
  try {
    const { id } = req.params;
    const container = getProductsContainer();

    // First, get the product to find its partition key
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }]
    };

    const { resources: products } = await container.items
      .query(querySpec)
      .fetchAll();

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await container.item(id, products[0].category).delete();

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
