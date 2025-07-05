import React, { useState, useEffect } from 'react';
import { getLocalEvents } from '../../services/api';
import { Event } from '../../types';
import { Calendar, MapPin, Clock, Tag, ExternalLink, Filter } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

interface EventsWidgetProps {
  zipCode: string;
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
}

const EventsWidget: React.FC<EventsWidgetProps> = ({ zipCode, width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; label: string; count: number }[]>([]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getLocalEvents(zipCode, selectedCategory);
      setEvents(data);
      
      // Generate categories from all events
      if (selectedCategory === 'all') {
        const allEvents = await getLocalEvents(zipCode, 'all');
        const categoryCounts = allEvents.reduce((acc, event) => {
          acc[event.category] = (acc[event.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        const dynamicCategories = [
          { id: 'all', label: 'All', count: allEvents.length },
          ...Object.entries(categoryCounts).map(([category, count]) => ({
            id: category,
            label: category.charAt(0).toUpperCase() + category.slice(1),
            count
          }))
        ];
        setCategories(dynamicCategories);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(() => fetchEvents(), 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [zipCode, selectedCategory]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Local Events"
        width={width}
        onRefresh={fetchEvents}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title={`Local Events - ${zipCode}`}
      width={width}
      onRefresh={fetchEvents}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
    >
      <div className="p-4">
        {/* Category filters */}
        <div className="flex items-center space-x-2 mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 max-w-full">
          <Filter className="h-4 w-4 text-gray-500 flex-shrink-0" />
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 text-sm rounded-full whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p>No events found for {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}</p>
            </div>
          ) : (
            <>
              <div className="text-xs text-gray-500 mb-2">
                Showing {events.length} events for {categories.find(c => c.id === selectedCategory)?.label || selectedCategory}
              </div>
              {events.map((event) => (
                <a
                  key={event.id}
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-3 transition-colors duration-200"
                >
                  <div className="flex items-start space-x-4">
                    {event.imageUrl && (
                      <div className="flex-shrink-0">
                        <img
                          src={event.imageUrl}
                          alt={event.title}
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {event.title}
                        </h3>
                        <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0 ml-2" />
                      </div>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span>{formatDate(event.date)}</span>
                        </div>
                        
                        {event.time && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            <span>{event.time}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-xs text-gray-500">
                          <MapPin className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                          <span className="truncate">{event.location}</span>
                        </div>
                        
                        {event.price && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Tag className="h-3.5 w-3.5 mr-1 flex-shrink-0" />
                            <span>{event.price}</span>
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-4">
                        {event.description}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default EventsWidget;