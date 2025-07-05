import React, { useState, useEffect } from 'react';
import { getSystemInfo } from '../../services/api';
import { SystemInfo } from '../../types';
import { Monitor, Wifi, Cpu, Globe, Clock, MemoryStick as Memory, Gauge } from 'lucide-react';
import WidgetCard from '../ui/WidgetCard';
import WidgetContainer from '../ui/WidgetContainer';

interface SystemInfoWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
}

const SystemInfoWidget: React.FC<SystemInfoWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide }) => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSystemInfo = async () => {
      try {
        const data = await getSystemInfo();
        setSystemInfo(data);
      } catch (error) {
        console.error('Error fetching system info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSystemInfo();
    const interval = setInterval(fetchSystemInfo, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatTime = (ms: number) => {
    if (!ms) return '0ms';
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatNumber = (num: number) => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (loading) {
    return (
      <WidgetCard title="System Information" className="col-span-2 row-span-2">
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </WidgetCard>
    );
  }

  if (!systemInfo) {
    return (
      <WidgetCard title="System Information" className="col-span-2 row-span-2">
        <div className="flex flex-col items-center justify-center h-48">
          <Monitor className="h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">Unable to fetch system information</p>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetContainer
      title="System Info"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
    >
      <WidgetCard title="System Information" className="col-span-2 row-span-2">
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Browser Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Globe className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-sm font-medium">Browser</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Name: </span>
                  <span className="tabular-nums">{systemInfo.browser.name}</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Platform: </span>
                  <span className="tabular-nums">{systemInfo.browser.platform}</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">CPU Cores: </span>
                  <span className="tabular-nums">{systemInfo.browser.hardwareConcurrency}</span>
                </p>
                {systemInfo.browser.deviceMemory && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Device Memory: </span>
                    <span className="tabular-nums">{systemInfo.browser.deviceMemory} GB</span>
                  </p>
                )}
              </div>
            </div>

            {/* Network Information */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Wifi className="h-5 w-5 text-green-500 mr-2" />
                <h3 className="text-sm font-medium">Network</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Status: </span>
                  <span className={systemInfo.network.online ? 'text-green-500' : 'text-red-500'}>
                    {systemInfo.network.online ? 'Online' : 'Offline'}
                  </span>
                </p>
                {systemInfo.network.effectiveType && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Connection: </span>
                    <span className="tabular-nums">{systemInfo.network.effectiveType.toUpperCase()}</span>
                  </p>
                )}
                {systemInfo.network.downlink && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Speed: </span>
                    <span className="tabular-nums">{systemInfo.network.downlink.toFixed(1)} Mbps</span>
                  </p>
                )}
                {systemInfo.network.rtt && (
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Latency: </span>
                    <span className="tabular-nums">{Math.round(systemInfo.network.rtt)} ms</span>
                  </p>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center mb-3">
                <Gauge className="h-5 w-5 text-purple-500 mr-2" />
                <h3 className="text-sm font-medium">Performance</h3>
              </div>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Page Load: </span>
                  <span className="tabular-nums">{formatTime(systemInfo.performance.pageLoadTime)}</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Server Response: </span>
                  <span className="tabular-nums">{formatTime(systemInfo.performance.serverResponseTime)}</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Page Render: </span>
                  <span className="tabular-nums">{formatTime(systemInfo.performance.pageRenderTime)}</span>
                </p>
                <p>
                  <span className="text-gray-600 dark:text-gray-400">Resources: </span>
                  <span className="tabular-nums">{formatNumber(systemInfo.performance.resourceCount)}</span>
                </p>
              </div>
            </div>

            {/* Memory Information */}
            {systemInfo.memory && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <Memory className="h-5 w-5 text-orange-500 mr-2" />
                  <h3 className="text-sm font-medium">Memory</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Total Heap: </span>
                    <span className="tabular-nums">{formatBytes(systemInfo.memory.total)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Used Heap: </span>
                    <span className="tabular-nums">{formatBytes(systemInfo.memory.used)}</span>
                  </p>
                  <p>
                    <span className="text-gray-600 dark:text-gray-400">Heap Limit: </span>
                    <span className="tabular-nums">{formatBytes(systemInfo.memory.limit)}</span>
                  </p>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min((systemInfo.memory.used / systemInfo.memory.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </WidgetCard>
    </WidgetContainer>
  );
};

export default SystemInfoWidget;