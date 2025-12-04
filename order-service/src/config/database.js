const { CosmosClient } = require('@azure/cosmos');

const endpoint = process.env.COSMOS_DB_ENDPOINT;
const key = process.env.COSMOS_DB_KEY;
const databaseId = process.env.COSMOS_DB_DATABASE || 'ordersdb';

const client = new CosmosClient({ endpoint, key });

let database;
let productsContainer;
let ordersContainer;
let cartContainer;

async function initDatabase() {
  try {
    console.log('Connecting to Cosmos DB...');

    // Create database if not exists
    const { database: db } = await client.databases.createIfNotExists({ id: databaseId });
    database = db;
    console.log(`Database "${databaseId}" ready`);

    // Create containers if not exist
    const { container: products } = await database.containers.createIfNotExists({
      id: 'products',
      partitionKey: { paths: ['/category'] }
    });
    productsContainer = products;
    console.log('Products container ready');

    const { container: orders } = await database.containers.createIfNotExists({
      id: 'orders',
      partitionKey: { paths: ['/userId'] }
    });
    ordersContainer = orders;
    console.log('Orders container ready');

    const { container: cart } = await database.containers.createIfNotExists({
      id: 'cart',
      partitionKey: { paths: ['/userId'] }
    });
    cartContainer = cart;
    console.log('Cart container ready');

    console.log('Cosmos DB initialized successfully');
  } catch (err) {
    console.error('Error initializing Cosmos DB:', err);
    throw err;
  }
}

function getProductsContainer() {
  return productsContainer;
}

function getOrdersContainer() {
  return ordersContainer;
}

function getCartContainer() {
  return cartContainer;
}

module.exports = {
  initDatabase,
  getProductsContainer,
  getOrdersContainer,
  getCartContainer
};
