import React, { useState, useEffect } from 'react';
import { getSmartHomeDevices } from '../../services/api';
import { castService } from '../../services/cast';
import { SmartHomeDevice } from '../../types';
import { Speaker, Camera, PlugZap, Battery, Wifi, WifiOff, Activity, Play, Pause, Music } from 'lucide-react';
import WidgetCard from '../ui/WidgetCard';
import WidgetContainer from '../ui/WidgetContainer';

interface SmartHomeWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
}

const SmartHomeWidget: React.FC<SmartHomeWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide }) => {
  const [devices, setDevices] = useState<SmartHomeDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const data = await getSmartHomeDevices();
        setDevices(data);
      } catch (error) {
        console.error('Error fetching smart home devices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
    const interval = setInterval(fetchDevices, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handlePlayPause = async (device: SmartHomeDevice) => {
    await castService.togglePlayback(device);
  };

  const handleSeek = async (device: SmartHomeDevice, time: number) => {
    await castService.seekTo(device, time);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'speaker':
        return <Speaker className="h-5 w-5 text-blue-500" />;
      case 'camera':
        return <Camera className="h-5 w-5 text-red-500" />;
      case 'outlet':
        return <PlugZap className="h-5 w-5 text-green-500" />;
      default:
        return <Wifi className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <Wifi className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-red-500" />;
      case 'active':
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <WidgetCard title="Smart Home" className="col-span-2 row-span-2">
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse h-48 w-full bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetContainer
      title="Smart Home"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
    >
      <div className="p-4">
        {devices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48">
            <Wifi className="h-12 w-12 text-gray-400" />
            <p className="mt-2 text-gray-500">No devices found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {devices.map((device) => (
              <div 
                key={device.id} 
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {getDeviceIcon(device.type)}
                    <div className="ml-3">
                      <p className="text-sm font-medium">{device.name}</p>
                      <div className="flex items-center mt-1">
                        {getStatusIcon(device.status)}
                        <span className="ml-1 text-xs text-gray-600 dark:text-gray-300 capitalize">
                          {device.status}
                        </span>
                        
                        {device.batteryLevel !== undefined && (
                          <div className="flex items-center ml-2">
                            <Battery className="h-3.5 w-3.5 text-gray-500" />
                            <span className="ml-1 text-xs text-gray-600 dark:text-gray-300">
                              {device.batteryLevel}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {device.castingStatus && (
                  <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
                    <div className="flex items-center">
                      {device.castingStatus.albumArt ? (
                        <img 
                          src={device.castingStatus.albumArt} 
                          alt={device.castingStatus.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <Music className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="ml-3 flex-1">
                        <p className="text-sm font-medium truncate">{device.castingStatus.title}</p>
                        {device.castingStatus.artist && (
                          <p className="text-xs text-gray-600 dark:text-gray-400">{device.castingStatus.artist}</p>
                        )}
                        {device.castingStatus.progress !== undefined && device.castingStatus.duration && (
                          <div className="mt-1">
                            <div 
                              className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden cursor-pointer"
                              onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percentage = x / rect.width;
                                const newTime = percentage * device.castingStatus!.duration!;
                                handleSeek(device, newTime);
                              }}
                            >
                              <div 
                                className="h-full bg-blue-500"
                                style={{ width: `${(device.castingStatus.progress / device.castingStatus.duration) * 100}%` }}
                              />
                            </div>
                            <div className="flex justify-between mt-1">
                              <span className="text-xs text-gray-500">
                                {formatTime(device.castingStatus.progress)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatTime(device.castingStatus.duration)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => handlePlayPause(device)}
                          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                          {device.castingStatus.isPlaying ? (
                            <Pause className="h-6 w-6 text-blue-500" />
                          ) : (
                            <Play className="h-6 w-6 text-blue-500" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default SmartHomeWidget;