import React, { useState, useEffect, useCallback } from 'react';
import { getSeptaAlerts, getBusDetours, getElevatorOutages } from '../../services/api';
import { SeptaAlert, SeptaAlertData, BusDetour, BusDetourData, ElevatorOutage, ElevatorOutageData } from '../../types';
import { AlertTriangle, Truck, ArrowUpDown, Clock, MapPin, ExternalLink, X, Filter as Funnel } from 'lucide-react';
import WidgetCard from '../ui/WidgetCard';
import WidgetContainer from '../ui/WidgetContainer';

type SeptaDataType = 'alerts' | 'detours' | 'elevators';
type AlertFilterType = 'all' | 'with-messages' | 'bus-only' | 'rail-only' | 'no-messages';

interface SeptaDataOption {
  value: SeptaDataType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SEPTA_DATA_OPTIONS: SeptaDataOption[] = [
  {
    value: 'alerts',
    label: 'SEPTA Alerts',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Current service alerts and advisories'
  },
  {
    value: 'detours',
    label: 'Bus Detours',
    icon: <Truck className="h-4 w-4" />,
    description: 'Current bus route detours and changes'
  },
  {
    value: 'elevators',
    label: 'Elevator Outages',
    icon: <ArrowUpDown className="h-4 w-4" />,
    description: 'Elevator and accessibility information'
  }
];

interface HousingWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
}

const HousingWidget: React.FC<HousingWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide }) => {
  const [selectedDataType, setSelectedDataType] = useState<SeptaDataType>('alerts');
  const [alertFilter, setAlertFilter] = useState<AlertFilterType>('all');
  const [alertData, setAlertData] = useState<SeptaAlertData | null>(null);
  const [detourData, setDetourData] = useState<BusDetourData | null>(null);
  const [elevatorData, setElevatorData] = useState<ElevatorOutageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = useCallback(async (dataType: SeptaDataType) => {
    try {
      setLoading(true);
      
      switch (dataType) {
        case 'alerts':
          const alerts = await getSeptaAlerts();
          setAlertData(alerts);
          break;
        case 'detours':
          const detours = await getBusDetours();
          setDetourData(detours);
          break;
        case 'elevators':
          const elevators = await getElevatorOutages();
          setElevatorData(elevators);
          break;
      }
      } catch (error) {
      console.error(`Error fetching ${dataType} data:`, error);
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchData(selectedDataType);
  }, [fetchData, selectedDataType]);

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const getCurrentData = () => {
    switch (selectedDataType) {
      case 'alerts':
        return alertData;
      case 'detours':
        return detourData;
      case 'elevators':
        return elevatorData;
      default:
        return null;
    }
  };

  const getCurrentItems = () => {
    switch (selectedDataType) {
      case 'alerts':
        const allAlerts = alertData?.alerts || [];
        if (alertFilter === 'all') return allAlerts;
        
        return allAlerts.filter((alert: any) => {
          switch (alertFilter) {
            case 'with-messages':
              return alert.currentMessage || alert.advisoryMessage || alert.detourMessage;
            case 'no-messages':
              return !(alert.currentMessage || alert.advisoryMessage || alert.detourMessage);
            case 'bus-only':
              return alert.routeId?.startsWith('bus_route_') || alert.routeId?.match(/^\d+$/);
            case 'rail-only':
              return alert.routeId?.startsWith('rr_route_') || 
                     alert.routeName?.toLowerCase().includes('line') ||
                     alert.routeName?.toLowerCase().includes('subway') ||
                     alert.routeName?.toLowerCase().includes('train');
            default:
              return true;
          }
        });
      case 'detours':
        return detourData?.detours || [];
      case 'elevators':
        return elevatorData?.outages || [];
      default:
        return [];
    }
  };

  const getCurrentTotal = () => {
    switch (selectedDataType) {
      case 'alerts':
        return alertData?.totalCount || 0;
      case 'detours':
        return detourData?.totalCount || 0;
      case 'elevators':
        return elevatorData?.totalOut || 0;
      default:
        return 0;
    }
  };

  const renderItem = (item: any, index: number) => {
    switch (selectedDataType) {
      case 'alerts':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.routeName}
                  </p>
                  <span className="text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                    {item.routeId}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {item.currentMessage || item.advisoryMessage || item.detourMessage || 'No active alerts'}
                </p>
              </div>
              <AlertTriangle className="h-4 w-4 text-red-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        );
      
      case 'detours':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    Route {item.routeId} {item.routeDirection}
                  </p>
                  <span className="text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                    Detour
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {item.reason}
                </p>
              </div>
              <Truck className="h-4 w-4 text-orange-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        );
      
      case 'elevators':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {item.station}
                  </p>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                    Out
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                  {item.line} - {item.elevator}
                </p>
              </div>
              <ArrowUpDown className="h-4 w-4 text-purple-400 flex-shrink-0 ml-2" />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderModalContent = () => {
    if (!selectedItem) return null;

    switch (selectedDataType) {
      case 'alerts':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedItem.routeName}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Route ID: {selectedItem.routeId}
                  </span>
                </div>
                {selectedItem.currentMessage && (
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedItem.currentMessage}
                    </span>
                  </div>
                )}
                {selectedItem.advisoryMessage && (
                  <div className="flex items-start">
                    <AlertTriangle className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedItem.advisoryMessage}
                    </span>
                  </div>
                )}
                {selectedItem.detourMessage && (
                  <div className="flex items-start">
                    <Truck className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedItem.detourMessage}
                    </span>
                  </div>
                )}
                {selectedItem.detourStartLocation && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Location: {selectedItem.detourStartLocation}
                    </span>
                  </div>
                )}
                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Last Updated: {selectedItem.lastUpdated}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'detours':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Route {selectedItem.routeId} {selectedItem.routeDirection}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Truck className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Reason: {selectedItem.reason}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    From: {selectedItem.startLocation}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    To: {selectedItem.endLocation}
                  </span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedItem.startDateTime} - {selectedItem.endDateTime}
                  </span>
                </div>
                <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {selectedItem.currentMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'elevators':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedItem.station}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Line: {selectedItem.line}
                  </span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Elevator: {selectedItem.elevator}
                  </span>
                </div>
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedItem.message}
                  </span>
                </div>
                {selectedItem.alternateUrl && (
                  <div className="mt-3">
                    <a
                      href={selectedItem.alternateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Alternative Transportation
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="SEPTA Information"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
      >
        <div className="animate-pulse p-4 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </WidgetContainer>
    );
  }

  const currentData = getCurrentData();
  if (!currentData) {
    return (
      <WidgetContainer
        title="SEPTA Information"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <p>Unable to load SEPTA data</p>
        </div>
      </WidgetContainer>
    );
  }

  const currentOption = SEPTA_DATA_OPTIONS.find(option => option.value === selectedDataType);

  return (
    <WidgetContainer
      title="SEPTA Information"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
    >
      <div className="p-4">
        {/* Data Type Selector */}
        <div className="mb-2 flex items-center justify-between">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Select Information Type
            </label>
            <select
              value={selectedDataType}
              onChange={(e) => setSelectedDataType(e.target.value as SeptaDataType)}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SEPTA_DATA_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {currentOption && (
              <p className="text-[10px] text-gray-500 mt-0.5">
                {currentOption.description}
              </p>
            )}
          </div>
          {/* Funnel Icon for toggling filters */}
          {selectedDataType === 'alerts' && (
            <button
              className={`ml-2 p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${showFilters ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
              onClick={() => setShowFilters((v) => !v)}
              title="Toggle Filters"
            >
              <Funnel className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {/* Compact Summary Stats */}
        <div className="flex items-center gap-2 mb-2 text-xs">
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            {currentOption?.icon}
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
              {getCurrentTotal()}
            </span>
            <span className="ml-1 text-gray-600 dark:text-gray-300">
              {selectedDataType === 'elevators' ? 'Outages' : 'Total'}
            </span>
          </div>
          <div className="flex items-center bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
            <Clock className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-600 dark:text-green-400 font-semibold">
              {new Date(currentData.lastUpdated).toLocaleDateString()}
            </span>
            <span className="ml-1 text-gray-600 dark:text-gray-300">Last Update</span>
          </div>
        </div>

        {/* Alert Filters (toggleable) */}
        {selectedDataType === 'alerts' && showFilters && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Filter Alerts
            </label>
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-xs">
                <input
                  type="radio"
                  name="alertFilter"
                  value="all"
                  checked={alertFilter === 'all'}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilterType)}
                  className="mr-1"
                />
                <span>All ({alertData?.alerts?.length || 0})</span>
              </label>
              <label className="flex items-center px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-lg cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-xs">
                <input
                  type="radio"
                  name="alertFilter"
                  value="with-messages"
                  checked={alertFilter === 'with-messages'}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilterType)}
                  className="mr-1"
                />
                <span>With Messages</span>
              </label>
              <label className="flex items-center px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-xs">
                <input
                  type="radio"
                  name="alertFilter"
                  value="no-messages"
                  checked={alertFilter === 'no-messages'}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilterType)}
                  className="mr-1"
                />
                <span>No Messages</span>
              </label>
              <label className="flex items-center px-2 py-1 bg-orange-50 dark:bg-orange-900/20 rounded-lg cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-xs">
                <input
                  type="radio"
                  name="alertFilter"
                  value="bus-only"
                  checked={alertFilter === 'bus-only'}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilterType)}
                  className="mr-1"
                />
                <span>Bus Only</span>
              </label>
              <label className="flex items-center px-2 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-xs">
                <input
                  type="radio"
                  name="alertFilter"
                  value="rail-only"
                  checked={alertFilter === 'rail-only'}
                  onChange={(e) => setAlertFilter(e.target.value as AlertFilterType)}
                  className="mr-1"
                />
                <span>Rail Only</span>
              </label>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="space-y-2 max-h-[40vh] overflow-y-auto">
          <h3 className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
            {currentOption?.label} in Philadelphia ({getCurrentItems().length} items)
          </h3>
          {getCurrentItems().map((item, index) => renderItem(item, index))}
        </div>

        <div className="mt-2 text-[10px] text-gray-500">
          Last updated: {new Date(currentData.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[70vh] overflow-y-auto overflow-x-hidden">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {currentOption?.label} Details
                </h2>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>
              {renderModalContent()}
            </div>
          </div>
        </div>
      )}
    </WidgetContainer>
  );
};

export default HousingWidget;