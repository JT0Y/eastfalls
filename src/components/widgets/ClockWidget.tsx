import React, { useState, useEffect } from 'react';
import { Clock as ClockIcon, Calendar } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

interface ClockWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
}

const ClockWidget: React.FC<ClockWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <WidgetContainer
      title="Date & Time"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
    >
      <div className="p-4 flex justify-between items-center">
        <div className="flex items-center">
          <ClockIcon className="h-8 w-8 text-blue-500" />
          <div className="ml-3">
            <p className="text-2xl font-bold">{formatTime(time)}</p>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{formatDate(time)}</span>
            </div>
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default ClockWidget;