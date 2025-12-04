require('dotenv').config();
const { CosmosClient } = require('@azure/cosmos');
const axios = require('axios');

/**
 * Data Pipeline Verification Script
 * Checks data flow from Cosmos DB → Synapse Analytics
 */

const COSMOS_ENDPOINT = process.env.COSMOS_DB_ENDPOINT;
const COSMOS_KEY = process.env.COSMOS_DB_KEY;
const COSMOS_DATABASE = process.env.COSMOS_DB_DATABASE || 'ordersdb';
const COSMOS_CONTAINER = 'orders';

const SYNAPSE_SERVER = process.env.SYNAPSE_SERVER;
const SYNAPSE_DATABASE = process.env.SYNAPSE_DATABASE || 'ecommercedw';
const SYNAPSE_USER = process.env.SYNAPSE_USER;
const SYNAPSE_PASSWORD = process.env.SYNAPSE_PASSWORD;

const ADF_RESOURCE_GROUP = process.env.ADF_RESOURCE_GROUP || 'ecommerce-cloud-rg';
const ADF_NAME = process.env.ADF_NAME || 'ecommerce-cloud-adf';

/**
 * Check Cosmos DB order count
 */
async function checkCosmosDB() {
  console.log('\n📦 Checking Cosmos DB...');

  try {
    const client = new CosmosClient({
      endpoint: COSMOS_ENDPOINT,
      key: COSMOS_KEY,
    });

    const database = client.database(COSMOS_DATABASE);
    const container = database.container(COSMOS_CONTAINER);

    // Count total orders
    const { resources } = await container.items
      .query('SELECT VALUE COUNT(1) FROM c')
      .fetchAll();

    const totalOrders = resources[0];

    console.log(`  ✓ Total orders in Cosmos DB: ${totalOrders}`);

    // Get latest order
    const { resources: latestOrders } = await container.items
      .query({
        query: 'SELECT TOP 1 * FROM c ORDER BY c.createdAt DESC',
      })
      .fetchAll();

    if (latestOrders.length > 0) {
      const latest = latestOrders[0];
      console.log(`  ✓ Latest order: ${latest.id}`);
      console.log(`  ✓ Created at: ${latest.createdAt}`);
      console.log(`  ✓ Total amount: $${latest.totalAmount}`);
    }

    return { success: true, count: totalOrders };
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check Synapse Analytics data
 */
async function checkSynapse() {
  console.log('\n📊 Checking Synapse Analytics...');

  if (!SYNAPSE_SERVER || !SYNAPSE_USER || !SYNAPSE_PASSWORD) {
    console.log('  ⚠️  Synapse credentials not configured. Skipping...');
    console.log('  Set SYNAPSE_SERVER, SYNAPSE_USER, SYNAPSE_PASSWORD in .env');
    return { success: false, skipped: true };
  }

  try {
    // Note: This requires mssql package. For demo, we'll show the queries
    // that should be run manually or via Azure Data Studio

    console.log('  ℹ️  Run these queries in Synapse to verify:');
    console.log('');
    console.log('  -- Check staging table');
    console.log('  SELECT COUNT(*) AS StagingCount,');
    console.log('         MAX(createdAt) AS LatestOrder');
    console.log('  FROM staging.Orders;');
    console.log('');
    console.log('  -- Check fact table');
    console.log('  SELECT COUNT(*) AS FactCount,');
    console.log('         MAX(OrderDate) AS LatestOrder');
    console.log('  FROM dw.FactOrders;');
    console.log('');
    console.log('  -- Check daily aggregates');
    console.log('  SELECT COUNT(*) AS DaysWithData,');
    console.log('         SUM(TotalRevenue) AS TotalRevenue');
    console.log('  FROM dw.FactDailySales;');

    return { success: true, manual: true };
  } catch (error) {
    console.error(`  ✗ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Check Azure Data Factory pipeline status
 */
async function checkDataFactory() {
  console.log('\n🏭 Checking Data Factory Pipeline...');

  console.log('  ℹ️  Run this command to check pipeline status:');
  console.log('');
  console.log(`  az datafactory pipeline-run query-by-factory \\`);
  console.log(`    --resource-group ${ADF_RESOURCE_GROUP} \\`);
  console.log(`    --factory-name ${ADF_NAME} \\`);
  console.log(`    --last-updated-after "$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%S)"`);
  console.log('');
  console.log('  Or trigger a new run:');
  console.log('');
  console.log(`  az datafactory pipeline create-run \\`);
  console.log(`    --resource-group ${ADF_RESOURCE_GROUP} \\`);
  console.log(`    --factory-name ${ADF_NAME} \\`);
  console.log(`    --name CosmosToSynapsePipeline`);

  return { success: true, manual: true };
}

/**
 * Display verification summary
 */
function displaySummary(results) {
  console.log('\n' + '='.repeat(70));
  console.log('📋 DATA PIPELINE VERIFICATION SUMMARY');
  console.log('='.repeat(70));

  console.log('\n✅ Cosmos DB:');
  if (results.cosmos.success) {
    console.log(`   Total Orders: ${results.cosmos.count}`);
  } else {
    console.log(`   Status: Failed - ${results.cosmos.error}`);
  }

  console.log('\n✅ Synapse Analytics:');
  if (results.synapse.skipped) {
    console.log('   Status: Skipped (credentials not configured)');
  } else if (results.synapse.manual) {
    console.log('   Status: Manual verification required (see queries above)');
  } else {
    console.log(`   Status: ${results.synapse.success ? 'OK' : 'Failed'}`);
  }

  console.log('\n✅ Data Factory:');
  console.log('   Status: Manual verification required (see commands above)');

  console.log('\n' + '='.repeat(70));
  console.log('\n💡 NEXT STEPS:');
  console.log('   1. Verify order count matches in Cosmos DB and Synapse');
  console.log('   2. Check Data Factory pipeline has run recently');
  console.log('   3. If counts don\'t match, trigger pipeline manually');
  console.log('   4. Refresh Power BI dataset to see latest data');
  console.log('='.repeat(70) + '\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Data Pipeline Verification');
  console.log('Checking data flow: Cosmos DB → Data Factory → Synapse → Power BI\n');

  const results = {
    cosmos: await checkCosmosDB(),
    synapse: await checkSynapse(),
    dataFactory: await checkDataFactory(),
  };

  displaySummary(results);
}

// Run verification
main().catch((error) => {
  console.error('Verification failed:', error);
  process.exit(1);
});
