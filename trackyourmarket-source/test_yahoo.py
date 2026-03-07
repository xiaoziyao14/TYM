#!/usr/bin/env python3
import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient

client = ApiClient()

# Test stock chart API
print("Testing Yahoo Finance API...")
response = client.call_api('YahooFinance/get_stock_chart', query={
    'symbol': 'AAPL',
    'region': 'US',
    'interval': '1d',
    'range': '5d',
    'includeAdjustedClose': True
})

if response and 'chart' in response:
    result = response['chart']['result'][0]
    meta = result['meta']
    print(f"✓ Successfully fetched data for {meta['symbol']}")
    print(f"  Current Price: ${meta['regularMarketPrice']:.2f}")
    print(f"  Exchange: {meta['exchangeName']}")
    print(f"  Data points: {len(result['timestamp'])}")
else:
    print("✗ Failed to fetch data")
