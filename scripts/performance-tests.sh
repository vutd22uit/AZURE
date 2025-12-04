#!/bin/bash

# Performance Testing Script using Apache Bench
# Tests read speed, write speed, and cross-region latency

set -e

# Configuration
API_URL=${API_URL:-"http://localhost:3002"}
AUTH_URL=${AUTH_URL:-"http://localhost:3001"}
NUM_REQUESTS=10000
CONCURRENCY=100

echo "======================================"
echo "Performance Testing Script"
echo "======================================"
echo "API URL: $API_URL"
echo "Requests: $NUM_REQUESTS"
echo "Concurrency: $CONCURRENCY"
echo ""

# Check if Apache Bench is installed
if ! command -v ab &> /dev/null; then
    echo "❌ Apache Bench (ab) is not installed"
    echo "Install with: sudo apt-get install apache2-utils"
    exit 1
fi

# Create output directory
mkdir -p performance-results

# 1. Test Read Speed - GET Products
echo "📊 Test 1: Read Speed (GET /api/products)"
echo "Testing GET requests..."
ab -n $NUM_REQUESTS -c $CONCURRENCY \
   -g performance-results/read-test.tsv \
   "$API_URL/api/products" > performance-results/read-test.txt

echo "✅ Read test completed"
echo ""

# Extract key metrics
echo "Read Performance Results:"
grep "Requests per second" performance-results/read-test.txt
grep "Time per request" performance-results/read-test.txt | head -1
grep "Transfer rate" performance-results/read-test.txt
echo ""

# 2. Test Write Speed - POST Orders (requires authentication)
echo "📊 Test 2: Write Speed (POST /api/orders)"
echo "First, creating a test user and getting token..."

# Register test user
REGISTER_RESPONSE=$(curl -s -X POST "$AUTH_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "perftest@test.com",
    "password": "Test123!",
    "name": "Performance Test User"
  }' || curl -s -X POST "$AUTH_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "perftest@test.com",
    "password": "Test123!"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get authentication token"
    exit 1
fi

echo "✅ Got authentication token"

# Create order payload file
cat > /tmp/order-payload.json <<EOF
{
  "items": [
    {
      "productId": "test-product-1",
      "name": "Test Product",
      "price": 99.99,
      "quantity": 1
    }
  ],
  "shippingAddress": {
    "street": "123 Test St",
    "city": "Test City",
    "state": "TS",
    "zipCode": "12345",
    "country": "Test Country"
  },
  "paymentMethod": "credit_card"
}
EOF

# Run write test (reduced numbers for write operations)
WRITE_REQUESTS=1000
WRITE_CONCURRENCY=50

echo "Testing POST requests ($WRITE_REQUESTS requests)..."
ab -n $WRITE_REQUESTS -c $WRITE_CONCURRENCY \
   -p /tmp/order-payload.json \
   -T "application/json" \
   -H "Authorization: Bearer $TOKEN" \
   -g performance-results/write-test.tsv \
   "$API_URL/api/orders" > performance-results/write-test.txt

echo "✅ Write test completed"
echo ""

# Extract key metrics
echo "Write Performance Results:"
grep "Requests per second" performance-results/write-test.txt
grep "Time per request" performance-results/write-test.txt | head -1
grep "Transfer rate" performance-results/write-test.txt
echo ""

# 3. Test Latency
echo "📊 Test 3: Latency Testing"

# Create curl timing format file
cat > /tmp/curl-format.txt <<EOF
     time_namelookup:  %{time_namelookup}s\n
        time_connect:  %{time_connect}s\n
     time_appconnect:  %{time_appconnect}s\n
    time_pretransfer:  %{time_pretransfer}s\n
       time_redirect:  %{time_redirect}s\n
  time_starttransfer:  %{time_starttransfer}s\n
                     ----------\n
          time_total:  %{time_total}s\n
EOF

echo "Single request latency breakdown:"
curl -w "@/tmp/curl-format.txt" -o /dev/null -s "$API_URL/health"
echo ""

# 4. Cross-region latency (if multiple regions are configured)
echo "📊 Test 4: Cross-Region Latency"

# Test local region
echo "Local region latency:"
TOTAL=0
ITERATIONS=10

for i in $(seq 1 $ITERATIONS); do
    START=$(date +%s%N)
    curl -s "$API_URL/health" > /dev/null
    END=$(date +%s%N)
    LATENCY=$((($END - $START) / 1000000))
    TOTAL=$(($TOTAL + $LATENCY))
    echo "  Request $i: ${LATENCY}ms"
done

AVERAGE=$(($TOTAL / $ITERATIONS))
echo "  Average latency: ${AVERAGE}ms"
echo ""

# 5. Generate Summary Report
echo "======================================"
echo "Performance Test Summary"
echo "======================================"
echo ""

cat > performance-results/summary.txt <<EOF
# Performance Test Results
Generated: $(date)

## Configuration
- API URL: $API_URL
- Total Requests (Read): $NUM_REQUESTS
- Concurrency (Read): $CONCURRENCY
- Total Requests (Write): $WRITE_REQUESTS
- Concurrency (Write): $WRITE_CONCURRENCY

## Read Performance (GET /api/products)
$(grep "Requests per second" performance-results/read-test.txt)
$(grep "Time per request" performance-results/read-test.txt | head -1)
$(grep "Transfer rate" performance-results/read-test.txt)

## Write Performance (POST /api/orders)
$(grep "Requests per second" performance-results/write-test.txt)
$(grep "Time per request" performance-results/write-test.txt | head -1)
$(grep "Transfer rate" performance-results/write-test.txt)

## Latency
Average Latency: ${AVERAGE}ms

## Files Generated
- performance-results/read-test.txt
- performance-results/read-test.tsv
- performance-results/write-test.txt
- performance-results/write-test.tsv
- performance-results/summary.txt
EOF

cat performance-results/summary.txt

echo ""
echo "✅ All performance tests completed!"
echo "📁 Results saved in: performance-results/"
echo ""

# Cleanup
rm -f /tmp/order-payload.json /tmp/curl-format.txt
