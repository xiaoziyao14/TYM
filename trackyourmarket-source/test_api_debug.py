#!/usr/bin/env python3
import sys
sys.path.append('/opt/.manus/.sandbox-runtime')
from data_api import ApiClient
import json

client = ApiClient()

print("Testing with includeAdjustedClose as string 'true'...")
try:
    response = client.call_api('YahooFinance/get_stock_chart', query={
        'symbol': 'NVDA',
        'region': 'US',
        'interval': '1d',
        'range': '1mo',
        'includeAdjustedClose': 'true'
    })
    print("✓ Success with string 'true'")
    if response and 'chart' in response:
        result = response['chart']['result'][0]
        print(f"  Data points: {len(result['timestamp'])}")
except Exception as e:
    print(f"✗ Failed: {e}")

print("\nTesting with includeAdjustedClose as boolean True...")
try:
    response = client.call_api('YahooFinance/get_stock_chart', query={
        'symbol': 'NVDA',
        'region': 'US',
        'interval': '1d',
        'range': '1mo',
        'includeAdjustedClose': True
    })
    print("✓ Success with boolean True")
    if response and 'chart' in response:
        result = response['chart']['result'][0]
        print(f"  Data points: {len(result['timestamp'])}")
except Exception as e:
    print(f"✗ Failed: {e}")

print("\nTesting without includeAdjustedClose parameter...")
try:
    response = client.call_api('YahooFinance/get_stock_chart', query={
        'symbol': 'NVDA',
        'region': 'US',
        'interval': '1d',
        'range': '1mo'
    })
    print("✓ Success without parameter")
    if response and 'chart' in response:
        result = response['chart']['result'][0]
        print(f"  Data points: {len(result['timestamp'])}")
        print(f"  Sample data: {result['timestamp'][:2]}")
except Exception as e:
    print(f"✗ Failed: {e}")
