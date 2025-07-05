import React, { useState, useEffect } from 'react';
import { getTrafficData } from '../../services/api';
import { TrafficData } from '../../types';
import { AlertTriangle, Car, Clock } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

interface TrafficWidgetProps {
  zipCode: string;
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const TrafficWidget: React.FC<TrafficWidgetProps> = ({ zipCode, width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide, dragHandleProps }) => {
  const [traffic, setTraffic] = useState<TrafficData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTraffic = async () => {
    try {
      setLoading(true);
      const data = await getTrafficData(zipCode);
      setTraffic(data);
    } catch (error) {
      console.error('Error fetching traffic data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraffic();
    // Refresh traffic data every 5 minutes
    const interval = setInterval(fetchTraffic, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [zipCode]);

  const getStatusColor = (status: 'light' | 'moderate' | 'heavy') => {
    switch (status) {
      case 'light':
        return 'text-green-500';
      case 'moderate':
        return 'text-yellow-500';
      case 'heavy':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'accident':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'construction':
        return <Car className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Traffic"
        width={width}
        onRefresh={fetchTraffic}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      >
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <div className="animate-pulse h-48 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetContainer>
    );
  }

  if (!traffic) {
    return (
      <WidgetContainer
        title="Traffic"
        width={width}
        onRefresh={fetchTraffic}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
          <p>Unable to load traffic data</p>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title={`Traffic - ${zipCode}`}
      width={width}
      onRefresh={fetchTraffic}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Car className={`h-8 w-8 ${getStatusColor(traffic.status)}`} />
            <div className="ml-3">
              <p className="text-xl font-bold capitalize">{traffic.status} Traffic</p>
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Commute: {traffic.commuteTime} mins
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
            Traffic Incidents
          </h3>
          
          {traffic.incidents.length === 0 ? (
            <p className="text-sm text-gray-500">No incidents reported</p>
          ) : (
            <ul className="space-y-3">
              {traffic.incidents.map((incident) => (
                <li key={incident.id} className="flex items-start p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-shrink-0 mt-0.5 mr-3">
                    {getIncidentIcon(incident.type)}
                  </div>
                  <div>
                    <p className="text-sm font-medium capitalize">{incident.type}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-300">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{incident.location}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default TrafficWidget;