import React, { useState, useEffect } from 'react';
import { getNewsData } from '../../services/api';
import { NewsItem } from '../../types';
import { Newspaper } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';
import { useDashboardData } from '../../DataContext';

interface NewsWidgetProps {
  zipCode: string;
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const NewsWidget: React.FC<NewsWidgetProps> = ({ zipCode, width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide, dragHandleProps }) => {
  const { state, dispatch } = useDashboardData();
  const [loading, setLoading] = useState(true);
  
  // Use news from global state, fallback to local state if empty
  const news = state.news || [];

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await getNewsData(zipCode);
      dispatch({ type: 'SET_NEWS', payload: data });
    } catch (error) {
      console.error('Error fetching news data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
    // Refresh news data every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [zipCode]);

  const formatPublishTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} min ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Local News"
        width={width}
        onRefresh={fetchNews}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      >
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <div className="animate-pulse h-64 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Local News"
      width={width}
      onRefresh={fetchNews}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="p-4">
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Newspaper className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No news available</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {news.map((item) => (
              <li key={item.id} className="group">
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block transition duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 p-4 rounded-lg"
                >
                  <div className="flex">
                    {item.imageUrl && (
                      <div className="flex-shrink-0 h-16 w-16 rounded overflow-hidden mr-4">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`${item.imageUrl ? '' : 'w-full'}`}>
                      <h3 className="font-medium text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {item.title}
                      </h3>
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span className="font-medium">{item.source}</span>
                        <span className="mx-1">•</span>
                        <span>{formatPublishTime(item.publishedAt)}</span>
                      </div>
                    </div>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </WidgetContainer>
  );
};

export default NewsWidget;