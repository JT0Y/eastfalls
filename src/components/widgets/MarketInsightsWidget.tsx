import React, { useState, useEffect } from 'react';
import { getMarketData } from '../../services/api';
import { MarketData } from '../../types';
import { TrendingUp, TrendingDown, Gauge, Home } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

interface MarketInsightsWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
}

const MarketInsightsWidget: React.FC<MarketInsightsWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      const data = await getMarketData();
      setMarketData(data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const renderPriceChart = (history: { timestamp: number; price: number }[]) => {
    if (!marketData || !marketData.sp500) return null;
    const maxPrice = Math.max(...history.map(point => point.price));
    const minPrice = Math.min(...history.map(point => point.price));
    const range = maxPrice - minPrice;
    const padding = range * 0.1;
    
    const normalizedPoints = history.map((point, index) => {
      const x = (index / (history.length - 1)) * 100;
      const y = 100 - ((point.price - (minPrice - padding)) / ((maxPrice + padding) - (minPrice - padding)) * 100);
      return `${x},${y}`;
    });
    
    const pathData = `M${normalizedPoints.join(' L')}`;
    
    return (
      <div className="h-20 w-full">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path
            d={pathData}
            fill="none"
            stroke={marketData.sp500.change >= 0 ? '#10B981' : '#EF4444'}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-green-500';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Market Insights"
        width={width}
        onRefresh={fetchMarketData}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="animate-pulse p-4 space-y-4">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetContainer>
    );
  }

  if (!marketData) {
    return (
      <WidgetContainer
        title="Market Insights"
        width={width}
        onRefresh={fetchMarketData}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="p-4 text-center text-gray-500">
          Unable to load market data
        </div>
      </WidgetContainer>
    );
  }

  if (!marketData.sp500) {
    return (
      <WidgetContainer
        title="Market Insights"
        width={width}
        onRefresh={fetchMarketData}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="p-4 text-center text-gray-500">
          S&P 500 data unavailable
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Market Insights"
      width={width}
      onRefresh={fetchMarketData}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
    >
      <div className="p-4 space-y-6">
        {/* S&P 500 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">S&P 500</h3>
            <div className="flex items-center">
              {marketData.sp500.change >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-500 mr-2" />
              )}
              <span className={`text-lg font-bold ${
                marketData.sp500.change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {marketData.sp500.price.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {marketData.sp500.change >= 0 ? '+' : ''}
            {marketData.sp500.change.toFixed(2)} ({marketData.sp500.changePercent.toFixed(2)}%)
          </div>
          {renderPriceChart(marketData.sp500.history)}
        </div>

        {/* Fear & Greed Index */}
        <div className="border-t pt-4 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Fear & Greed Index</h3>
            <div className="flex items-center">
              <Gauge className={`h-5 w-5 mr-2 ${getFearGreedColor(marketData.fearGreedIndex.value)}`} />
              <span className={`text-lg font-bold ${getFearGreedColor(marketData.fearGreedIndex.value)}`}>
                {marketData.fearGreedIndex.value}
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Current Rating: {marketData.fearGreedIndex.rating}
          </div>
          <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
            <div>
              <div className="text-gray-500">Previous Close</div>
              <div className="font-medium">{marketData.fearGreedIndex.previousClose}</div>
            </div>
            <div>
              <div className="text-gray-500">Previous Week</div>
              <div className="font-medium">{marketData.fearGreedIndex.previousWeek}</div>
            </div>
            <div>
              <div className="text-gray-500">Previous Month</div>
              <div className="font-medium">{marketData.fearGreedIndex.previousMonth}</div>
            </div>
          </div>
        </div>

        {/* Mortgage Rates */}
        <div className="border-t pt-4 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Home className="h-5 w-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold">Current Mortgage Rates</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-500">30-Year Fixed</div>
              <div className="text-lg font-bold">{marketData.mortgageRates.thirtyYear}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">15-Year Fixed</div>
              <div className="text-lg font-bold">{marketData.mortgageRates.fifteenYear}%</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">5/1 ARM</div>
              <div className="text-lg font-bold">{marketData.mortgageRates.fiveOneArm}%</div>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Last updated: {new Date(marketData.mortgageRates.lastUpdated).toLocaleDateString()}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default MarketInsightsWidget;