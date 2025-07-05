import React, { useState, useEffect, useCallback } from 'react';
import { getSeptaAlerts, getBusDetours, getElevatorOutages, getBusLocations, septaBusRoutes } from '../../services/api';
import { SeptaAlert, SeptaAlertData, BusDetour, BusDetourData, ElevatorOutage, ElevatorOutageData, BusLocation } from '../../types';
import { AlertTriangle, Truck, ArrowUpDown, Clock, MapPin, ExternalLink, X, Filter as Funnel, Bus } from 'lucide-react';
import WidgetCard from '../ui/WidgetCard';
import WidgetContainer from '../ui/WidgetContainer';

type SeptaDataType = 'buses' | 'bus-schedule' | 'alerts' | 'detours' | 'elevators';
type AlertFilterType = 'all' | 'with-messages' | 'bus-only' | 'rail-only' | 'no-messages';

interface SeptaDataOption {
  value: SeptaDataType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SEPTA_DATA_OPTIONS: SeptaDataOption[] = [
  {
    value: 'buses',
    label: 'Bus Tracking',
    icon: <Bus className="h-4 w-4" />,
    description: 'Real-time bus locations and tracking'
  },
  {
    value: 'bus-schedule',
    label: 'Bus Schedule',
    icon: <Clock className="h-4 w-4" />,
    description: 'All bus routes with real-time data'
  },
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

interface SeptaWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const SeptaWidget: React.FC<SeptaWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onHide, dragHandleProps }) => {
  const [selectedDataType, setSelectedDataType] = useState<SeptaDataType>('buses');
  const [selectedBusRoute, setSelectedBusRoute] = useState<string>('60');
  const [alertFilter, setAlertFilter] = useState<AlertFilterType>('all');
  const [alertData, setAlertData] = useState<SeptaAlertData | null>(null);
  const [detourData, setDetourData] = useState<BusDetourData | null>(null);
  const [elevatorData, setElevatorData] = useState<ElevatorOutageData | null>(null);
  const [busData, setBusData] = useState<BusLocation[]>([]);
  
  // Bus Schedule state
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [selectedScheduleRoute, setSelectedScheduleRoute] = useState<string>('60');
  
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async (dataType: SeptaDataType) => {
    try {
      setLoading(true);
      console.log(`Fetching ${dataType} data, bus route: ${selectedBusRoute}`);
      
      switch (dataType) {
        case 'buses':
          console.log('About to call getBusLocations with route:', selectedBusRoute);
          // Fetch all buses first, then filter by route
          const allBuses = await getBusLocations();
          console.log(`Fetched ${allBuses.length} total buses`);
          setBusData(allBuses);
          break;
        case 'bus-schedule':
          console.log('Fetching bus schedule data');
          const response = await fetch('https://www3.septa.org/hackathon/TransitViewAll/');
          const data = await response.json();
          console.log('SEPTA API response for bus schedule:', data);
          
          if (data && data.routes && Array.isArray(data.routes)) {
            // The API returns { routes: [{ "2": [...], "61": [...], etc }] }
            const allVehicles: any[] = [];
            
            // Process each route object in the array
            data.routes.forEach((routeObject: any) => {
              Object.entries(routeObject).forEach(([routeId, routeVehicles]: [string, any]) => {
                if (Array.isArray(routeVehicles)) {
                  routeVehicles.forEach((vehicle: any) => {
                    allVehicles.push({ ...vehicle, route_id: routeId });
                  });
                }
              });
            });
            
            setVehicles(allVehicles);
            
            // Extract unique routes
            const uniqueRoutes = Array.from(new Set(allVehicles.map(v => v.route_id))).sort((a, b) => parseInt(a) - parseInt(b));
            
            // Filter out routes with no active vehicles (vehicles with VehicleID "None" or empty)
            const activeRoutes = uniqueRoutes.filter(routeId => {
              const routeVehicles = allVehicles.filter(v => v.route_id === routeId);
              const activeVehicles = routeVehicles.filter(v => 
                v.VehicleID && 
                v.VehicleID !== "None" && 
                v.VehicleID !== "0" && 
                v.VehicleID !== ""
              );
              return activeVehicles.length > 0;
            });
            
            setRoutes(activeRoutes);
            
            // If the currently selected route has no active vehicles, select the first available route
            if (activeRoutes.length > 0 && !activeRoutes.includes(selectedScheduleRoute)) {
              setSelectedScheduleRoute(activeRoutes[0]);
            }
            
            console.log(`Found ${allVehicles.length} vehicles across ${uniqueRoutes.length} total routes, ${activeRoutes.length} active routes`);
          }
          break;
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
  };

  useEffect(() => {
    fetchData(selectedDataType);
  }, [selectedDataType]);

  // Auto-select a route with active buses if current route has none
  useEffect(() => {
    if (selectedDataType === 'buses' && busData.length > 0) {
      const currentRouteBuses = busData.filter(bus => bus.routeId === selectedBusRoute);
      if (currentRouteBuses.length === 0) {
        // Find the first route with active buses
        const availableRoutes = [...new Set(busData.map(bus => bus.routeId))];
        if (availableRoutes.length > 0) {
          console.log('Auto-selecting route with active buses:', availableRoutes[0]);
          setSelectedBusRoute(availableRoutes[0]);
        }
      }
    }
  }, [busData, selectedDataType, selectedBusRoute]);

  // Bus schedule effect
  useEffect(() => {
    if (selectedDataType === 'bus-schedule') {
      fetchData('bus-schedule');
    }
  }, [selectedDataType]);

  // Bus schedule route change effect
  useEffect(() => {
    if (selectedDataType === 'bus-schedule' && vehicles.length > 0) {
      // The data is already loaded, just need to update the display
      console.log('Bus schedule route changed to:', selectedScheduleRoute);
    }
  }, [selectedScheduleRoute, selectedDataType, vehicles]);

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
      case 'buses':
        return { buses: busData, lastUpdated: new Date().toISOString() };
      case 'bus-schedule':
        return { vehicles: vehicles, lastUpdated: new Date().toISOString() };
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
      case 'buses':
        console.log('getCurrentItems - busData:', busData);
        // Filter bus data by selected route
        const routeBuses = busData.filter(bus => bus.routeId === selectedBusRoute);
        console.log(`Filtered to ${routeBuses.length} buses for route ${selectedBusRoute}`);
        return routeBuses;
      case 'bus-schedule':
        const filteredVehicles = vehicles.filter(v => 
          v.route_id === selectedScheduleRoute && 
          v.VehicleID && 
          v.VehicleID !== "None" && 
          v.VehicleID !== "0" && 
          v.VehicleID !== ""
        );
        console.log('getCurrentItems - filteredVehicles:', filteredVehicles);
        return filteredVehicles;
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
      case 'buses':
        return busData.filter(bus => bus.routeId === selectedBusRoute).length;
      case 'bus-schedule':
        return vehicles.filter(v => 
          v.route_id === selectedScheduleRoute && 
          v.VehicleID && 
          v.VehicleID !== "None" && 
          v.VehicleID !== "0" && 
          v.VehicleID !== ""
        ).length;
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

  const renderTableRow = (item: any, index: number) => {
    switch (selectedDataType) {
      case 'buses':
        return (
          <tr 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <Bus className="h-3 w-3 text-blue-500 mr-1" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.vehicleId}</span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-300">{item.direction}</span>
                <span className="ml-1 text-xs text-gray-500">→ {item.destination}</span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.nextStop}
            </td>
            <td className="py-2 px-3 text-xs">
              <span className={`font-medium ${item.speed > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {item.speed} mph
              </span>
            </td>
            <td className="py-2 px-3 text-xs">
              <span className={`font-medium ${item.delay > 0 ? 'text-red-600 dark:text-red-400' : item.delay < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {item.delay > 0 ? `+${item.delay}min` : item.delay < 0 ? `${item.delay}min` : 'On time'}
              </span>
            </td>
          </tr>
        );
      case 'bus-schedule':
        return (
          <tr 
            key={`${item.VehicleID}-${item.trip}`} 
            onClick={() => handleItemClick(item)}
            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <Bus className="h-3 w-3 text-blue-500 mr-1" />
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.VehicleID || 'Unknown'}</span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-300">{item.Direction}</span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.destination}
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.next_stop_name || 'Unknown'}
            </td>
            <td className="py-2 px-3 text-xs">
              <span className={`font-medium ${item.late > 0 ? 'text-red-600 dark:text-red-400' : item.late < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {item.late > 0 ? `+${item.late}min` : item.late < 0 ? `${item.late}min` : 'On time'}
              </span>
            </td>
          </tr>
        );
      case 'alerts':
        return (
          <tr 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.routeName}</span>
                <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 px-1.5 py-0.5 rounded">
                  {item.routeId}
                </span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <AlertTriangle className="h-3 w-3 text-red-400 mr-1" />
                <span className="text-red-600 dark:text-red-400">Active</span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
              {item.currentMessage || item.advisoryMessage || item.detourMessage || 'No active alerts'}
            </td>
          </tr>
        );
      
      case 'detours':
        return (
          <tr 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-gray-100">Route {item.routeId}</span>
                <span className="ml-2 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-1.5 py-0.5 rounded">
                  Detour
                </span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.routeDirection}
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
              {item.reason}
            </td>
          </tr>
        );
      
      case 'elevators':
        return (
          <tr 
            key={item.id} 
            onClick={() => handleItemClick(item)}
            className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
          >
            <td className="py-2 px-3 text-xs">
              <div className="flex items-center">
                <span className="font-medium text-gray-900 dark:text-gray-100">{item.station}</span>
                <span className="ml-2 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20 px-1.5 py-0.5 rounded">
                  Out
                </span>
              </div>
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.line}
            </td>
            <td className="py-2 px-3 text-xs text-gray-600 dark:text-gray-300">
              {item.elevator}
            </td>
          </tr>
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

  const renderTableHeaders = () => {
    switch (selectedDataType) {
      case 'buses':
        return (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Vehicle</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Direction</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Next Stop</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Speed</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Delay</th>
          </tr>
        );
      case 'bus-schedule':
        return (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Vehicle</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Direction</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Destination</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Next Stop</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Delay</th>
          </tr>
        );
      case 'alerts':
        return (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Route</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Status</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Message</th>
          </tr>
        );
      case 'detours':
        return (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Route</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Direction</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Reason</th>
          </tr>
        );
      case 'elevators':
        return (
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Station</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Line</th>
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-600 dark:text-gray-300">Elevator</th>
          </tr>
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
        onHide={onHide}
        dragHandleProps={dragHandleProps}
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
  console.log('getCurrentData result:', currentData);
  console.log('selectedDataType:', selectedDataType);
  console.log('busData:', busData);
  console.log('vehicles:', vehicles);
  console.log('alertData:', alertData);
  console.log('detourData:', detourData);
  console.log('elevatorData:', elevatorData);
  
  if (!currentData) {
    return (
      <WidgetContainer
        title="SEPTA Information"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      >
        <div className="flex flex-col items-center justify-center h-full p-4">
          <p className="text-gray-500 dark:text-gray-400">Unable to load SEPTA data</p>
          <button 
            onClick={() => fetchData(selectedDataType)}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Retry
          </button>
        </div>
      </WidgetContainer>
    );
  }

  const currentOption = SEPTA_DATA_OPTIONS.find(option => option.value === selectedDataType);

  console.log('SeptaWidget render - selectedDataType:', selectedDataType, 'selectedBusRoute:', selectedBusRoute, 'busData length:', busData.length);

  return (
    <WidgetContainer
      title="SEPTA Information"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
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

        {/* Bus Route Selector */}
        {selectedDataType === 'buses' && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Select Bus Route
            </label>
            <select
              value={selectedBusRoute}
              onChange={(e) => {
                const newRoute = e.target.value;
                console.log('Bus route changed to:', newRoute);
                console.log('Current selectedDataType:', selectedDataType);
                setSelectedBusRoute(newRoute);
              }}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Filter routes to only show those with active vehicles */}
              {[1, 2, 3, 5, 6, 7, 8, 9, 12, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 35, 37, 38, 39, 40, 42, 43, 44, 46, 47, 48, 50, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 64, 65, 66, 67, 68, 70, 71, 73, 75, 77, 78, 79, 80, 84, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 123, 124, 125, 127, 128, 129, 130, 131, 132, 134, 139, 150, 201, 204, 205, 206, 304, 306, 310, 314]
              .filter(route => {
                // Only show routes that have active vehicles in the current bus data
                const routeBuses = busData.filter(bus => bus.routeId === route.toString());
                return routeBuses.length > 0;
              })
              .map((route) => (
                <option key={route} value={route.toString()}>
                  Route {route} ({busData.filter(bus => bus.routeId === route.toString()).length} buses)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-0.5">
              Real-time bus locations for selected route
            </p>
          </div>
        )}

        {/* Bus Schedule Route Selector */}
        {selectedDataType === 'bus-schedule' && (
          <div className="mb-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
              Select Bus Route
            </label>
            <select
              value={selectedScheduleRoute}
              onChange={(e) => {
                const newRoute = e.target.value;
                console.log('Bus schedule route changed to:', newRoute);
                setSelectedScheduleRoute(newRoute);
              }}
              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {routes.map((route) => (
                <option key={route} value={route}>
                  Route {route}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-gray-500 mt-0.5">
              All available bus routes with real-time data
            </p>
          </div>
        )}

        {/* Compact Summary Stats */}
        <div className="flex items-center gap-2 mb-2 text-xs">
          <div className="flex items-center bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
            {currentOption?.icon}
            <span className="ml-1 text-blue-600 dark:text-blue-400 font-semibold">
              {getCurrentTotal()}
            </span>
            <span className="ml-1 text-gray-600 dark:text-gray-300">
              {selectedDataType === 'elevators' ? 'Outages' : selectedDataType === 'buses' ? `Buses (Route ${selectedBusRoute})` : selectedDataType === 'bus-schedule' ? `Buses (Route ${selectedScheduleRoute})` : 'Total'}
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
            {currentOption?.label} in Philadelphia {selectedDataType === 'buses' ? `(Route ${selectedBusRoute})` : selectedDataType === 'bus-schedule' ? `(Route ${selectedScheduleRoute})` : ''} ({getCurrentItems().length} items)
          </h3>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-800">
                {renderTableHeaders()}
              </thead>
              <tbody>
                {getCurrentItems().map((item, index) => renderTableRow(item, index))}
              </tbody>
            </table>
          </div>
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

export default SeptaWidget;