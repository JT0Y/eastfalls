import React, { useState, useEffect } from 'react';
import { getWeatherData } from '../../services/api';
import { WeatherData } from '../../types';
import { Cloud, CloudRain, CloudSnow, CloudSun, Droplets, Sun, Wind, CloudLightning } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

interface WeatherWidgetProps {
  zipCode: string;
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ zipCode, width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    try {
      setLoading(true);
      const data = await getWeatherData(zipCode);
      setWeather(data);
    } catch (error) {
      console.error('Error fetching weather data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
    // Refresh weather data every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [zipCode]);

  const getWeatherIcon = (iconName: string) => {
    switch (iconName) {
      case 'sun':
        return <Sun className="h-8 w-8 text-yellow-500" />;
      case 'cloud-sun':
        return <CloudSun className="h-8 w-8 text-gray-500" />;
      case 'cloud':
        return <Cloud className="h-8 w-8 text-gray-500" />;
      case 'cloud-rain':
        return <CloudRain className="h-8 w-8 text-blue-500" />;
      case 'cloud-snow':
        return <CloudSnow className="h-8 w-8 text-blue-200" />;
      case 'cloud-lightning':
        return <CloudLightning className="h-8 w-8 text-purple-500" />;
      default:
        return <Sun className="h-8 w-8 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Weather"
        width={width}
        onRefresh={fetchWeather}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="flex items-center justify-center h-full min-h-[120px]">
          <div className="animate-pulse h-48 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetContainer>
    );
  }

  if (!weather) {
    return (
      <WidgetContainer
        title="Weather"
        width={width}
        onRefresh={fetchWeather}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="flex flex-col items-center justify-center h-full min-h-[120px]">
          <p className="text-red-500">Weather API Error</p>
          <p className="text-sm text-gray-500 mt-2">Check console for details</p>
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title={`Weather - ${zipCode}`}
      width={width}
      onRefresh={fetchWeather}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
    >
      <div className="p-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {getWeatherIcon(weather.icon)}
            <div className="ml-3">
              <p className="text-3xl font-bold">{weather.temperature}°F</p>
              <p className="text-gray-600 dark:text-gray-300">{weather.condition}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-300">Feels like: {weather.feelsLike}°F</p>
            <div className="flex items-center justify-end mt-1">
              <Droplets className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{weather.humidity}%</span>
              <Wind className="h-4 w-4 text-gray-500 ml-2 mr-1" />
              <span className="text-sm text-gray-600 dark:text-gray-300">{weather.windSpeed} mph</span>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">7-Day Forecast</h3>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {weather.forecast.map((day, index) => (
              <div
                key={index}
                className="flex-shrink-0 flex flex-col items-center p-2 rounded-lg bg-gray-50 dark:bg-gray-800 min-w-[60px]"
              >
                <p className="text-xs font-medium mb-1">{day.day}</p>
                {getWeatherIcon(day.icon)}
                <div className="mt-1 text-center">
                  <p className="text-xs font-medium">{day.high}°</p>
                  <p className="text-xs text-gray-500">{day.low}°</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WidgetContainer>
  );
};

export default WeatherWidget;