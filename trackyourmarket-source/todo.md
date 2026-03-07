# TrackYourMarket - Project TODO

## Backend Features
- [x] Database schema for news articles with relevance index
- [x] Yahoo Finance API integration for stock data
- [x] Yahoo Finance API integration for stock charts
- [x] News API integration with relevance scoring
- [x] tRPC endpoint for fetching stock quotes
- [x] tRPC endpoint for searching stocks by symbol/name
- [x] tRPC endpoint for fetching stock chart data
- [x] tRPC endpoint for fetching news feed
- [x] Background job for auto-refreshing news every 15 minutes
- [x] Google News RSS integration for real news data
- [x] Calendar events database table and CRUD operations
- [ ] Watchlist database table for user persistence

## Frontend Features
- [x] Dark theme professional UI setup
- [x] Sidebar layout with navigation
- [x] Watchlist component with add/remove functionality
- [x] Stock search bar with autocomplete
- [x] Stock detail view with price and chart
- [x] Interactive stock chart using Recharts
- [x] News feed component with relevance index display
- [x] Responsive layout for desktop workflows
- [x] LocalStorage integration for watchlist persistence
- [x] Calendar page with monthly view
- [x] Calendar event add/edit/delete functionality
- [ ] Stock detail page improvements (more data, better layout)

## Testing & Deployment
- [x] Test stock data fetching
- [x] Test news feed with real data
- [x] Test watchlist CRUD operations
- [x] Test chart rendering
- [x] Create deployment checkpoint

## Bug Fixes
- [x] Fix stock chart not loading/displaying data
- [x] Fix volume and day low showing as 0
- [x] Fix duplicate news articles in database

## Google Finance Style Redesign
- [x] Large prominent price display with change indicator
- [x] Time range selector (1D, 5D, 1M, 6M, YTD, 1Y, 5Y, MAX)
- [x] Interactive area chart with hover tooltips
- [x] Key metrics cards (Open, High, Low, Volume, Prev Close, 52W High/Low, Market Cap)
- [x] Clean minimalist layout matching Google Finance aesthetic
- [x] Responsive chart that fills available space

## Scholar Inbox Style Redesign
- [x] Switch to light theme with white background
- [x] Update color scheme: red/coral primary, white cards, gray text
- [x] Redesign sidebar with cleaner navigation (horizontal tabs)
- [x] Update news cards with Scholar Inbox style (white bg, subtle shadows)
- [x] Add likes/reads counts to news articles
- [x] Redesign stock watchlist with cleaner card style
- [x] Update typography with elegant fonts
- [x] Add horizontal navigation tabs
- [x] Update StockDetail page with light theme

## Real News Integration
- [x] Search real news for AAPL (2 articles from past week)
- [x] Search real news for NVDA (2 articles from past week)
- [x] Search real news for MSFT (2 articles from past week)
- [x] Search real news for TSLA (2 articles from past week)
- [x] Update news service to display real news data
- [x] Verify news links are working and accessible

## Earnings Calendar Integration
- [x] Add AAPL Q1 2026 earnings event to calendar (Jan 29)
- [x] Add MSFT Q2 2026 earnings event to calendar (Jan 28)
- [x] Add TSLA Q4 2025 earnings event to calendar (Jan 28)
- [x] Verify calendar displays earnings events correctly

## UI Cleanup
- [x] Remove view count and like icons from news cards

## S&P 100 Stock Search
- [x] Get complete list of S&P 100 stocks (101 companies)
- [x] Add S&P 100 stocks to search database
- [x] Test search functionality for S&P 100 stocks

## Watchlist Management Improvements
- [x] Remove auto-add stock to watchlist on click behavior
- [x] Create database schema for multiple watchlists
- [x] Add backend API for watchlist CRUD (create, read, update, delete)
- [x] Add UI for creating new watchlist
- [x] Add UI for deleting watchlist
- [x] Add UI for renaming watchlist
- [x] Add explicit "Add to Watchlist" button for stocks
- [x] Test watchlist management functionality

## Stock Detail Page Watchlist Options
- [x] Add "Add to Watchlist" button on stock detail page
- [x] Show dropdown to select existing watchlist or create new
- [x] Test adding stock to watchlist from detail page

## Remove Login Requirement for Watchlist
- [x] Update StockDetail to use localStorage instead of database
- [x] Remove login redirect from Add to Watchlist button
- [x] Test watchlist functionality without login

## Watchlist List View
- [x] Display all watchlists as a list in Watchlist tab
- [x] Show stocks under each watchlist
- [x] Sync localStorage watchlists with the display

## Navigation Layout Improvement
- [x] Add more spacing between logo and navigation tabs
- [x] Improve overall header layout balance

## Navigation Layout Revert
- [x] Revert navigation bar to original compact layout

## News Content Format Improvement
- [x] Update news data to include key points summary
- [x] Highlight important data/numbers in news content
- [x] Update Dashboard news card to display key points format

## All US Stocks Integration
- [x] Get Financial Modeling Prep API key (free tier limited, using NASDAQ official data instead)
- [x] Fetch complete US stock list (7169 stocks from NASDAQ official data)
- [x] Process and store stock data in project (server/usStocks.ts)
- [x] Update search functionality to use full stock list
- [x] Test search with various stock symbols (PLTR, RIVN both found)

## Auto-Refresh News Task
- [x] Create background job scheduler for news refresh
- [x] Implement real news fetching from Google News RSS
- [x] Set up 15-minute interval for automatic refresh
- [x] Test auto-refresh functionality (16 articles fetched successfully)

## News Card Content Improvement
- [x] Change news card content from title repetition to actual news summary
- [x] Generate meaningful summaries using keyword extraction from headlines

## News Detail Page with AI Summary
- [x] Create news detail page component
- [x] Update news card to navigate to detail page instead of external link
- [x] Implement AI-generated paragraph summary using LLM
- [x] Add "View Original" link at bottom of detail page
- [x] Store AI summaries in database to avoid regenerating
