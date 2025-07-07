import React, { useState, useEffect, useCallback } from 'react';
import { getTobaccoPermits, getDemolitions, getLandmarks } from '../../services/api';
import { TobaccoPermit, TobaccoPermitData, Demolition, DemolitionData, Landmark, LandmarkData } from '../../types';
import { MapPin, Calendar, Building2, RotateCw, X, ExternalLink, Truck, AlertTriangle, Landmark as LandmarkIcon } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

// Web Mercator to Lat/Lng conversion function
function webMercatorToLatLng(x: number, y: number) {
  const R_MAJOR = 6378137.0;
  const originShift = 2 * Math.PI * R_MAJOR / 2.0;

  const lng = (x / originShift) * 180.0;
  const lat = (y / originShift) * 180.0;

  const latRad = lat * Math.PI / 180.0;
  const latitude = 180 / Math.PI * (2 * Math.atan(Math.exp(latRad)) - Math.PI / 2.0);
  return { lat: latitude, lng: lng };
}

type DatasetType = 'tobacco' | 'demolitions' | 'landmarks';

interface DatasetOption {
  value: DatasetType;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const DATASET_OPTIONS: DatasetOption[] = [
  {
    value: 'tobacco',
    label: 'Tobacco Permits',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Tobacco retailer permits in East Falls'
  },
  {
    value: 'demolitions',
    label: 'Building Demolitions',
    icon: <AlertTriangle className="h-4 w-4" />,
    description: 'Recent building demolitions in Philadelphia'
  },
  {
    value: 'landmarks',
    label: 'Philadelphia Landmarks',
    icon: <LandmarkIcon className="h-4 w-4" />,
    description: 'Historic landmarks and points of interest'
  }
];

interface PhiladelphiaDataExplorerWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const PhiladelphiaDataExplorerWidget: React.FC<PhiladelphiaDataExplorerWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide, dragHandleProps }) => {
  const [selectedDataset, setSelectedDataset] = useState<DatasetType>('tobacco');
  const [permitData, setPermitData] = useState<TobaccoPermitData | null>(null);
  const [demolitionData, setDemolitionData] = useState<DemolitionData | null>(null);
  const [landmarkData, setLandmarkData] = useState<LandmarkData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (datasetType: DatasetType) => {
    try {
      setLoading(true);
      switch (datasetType) {
        case 'tobacco':
          const permits = await getTobaccoPermits('19129');
          setPermitData(permits);
          break;
        case 'demolitions':
          const demolitions = await getDemolitions('19129');
          setDemolitionData(demolitions);
          break;
        case 'landmarks':
          const landmarks = await getLandmarks();
          setLandmarkData(landmarks);
          break;
      }
    } catch (error) {
      console.error(`Error fetching ${datasetType} data:`, error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedDataset);
  }, [fetchData, selectedDataset]);



  const getCurrentData = () => {
    switch (selectedDataset) {
      case 'tobacco':
        return permitData;
      case 'demolitions':
        return demolitionData;
      case 'landmarks':
        return landmarkData;
      default:
        return null;
    }
  };

  const getCurrentItems = () => {
    switch (selectedDataset) {
      case 'tobacco':
        return permitData?.permits || [];
      case 'demolitions':
        return demolitionData?.demolitions || [];
      case 'landmarks':
        return landmarkData?.landmarks || [];
      default:
        return [];
    }
  };

  // Table headers for each dataset
  const renderTableHeaders = () => {
    switch (selectedDataset) {
      case 'tobacco':
        return (
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold">Business</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Year</th>
          </tr>
        );
      case 'demolitions':
        return (
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold">Address</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
          </tr>
        );
      case 'landmarks':
        return (
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Type</th>
          </tr>
        );
      default:
        return null;
    }
  };

  // Table rows for each dataset
  const renderTableRows = () => {
    const items = getCurrentItems();
    if (!items || items.length === 0) {
      return (
        <tr>
          <td colSpan={3} className="text-center py-6 text-gray-500 dark:text-gray-400">No data available. Please try again later.</td>
        </tr>
      );
    }
    switch (selectedDataset) {
      case 'tobacco':
        return items.map((item: any) => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td className="px-3 py-2">
              <div className="font-medium text-gray-900 dark:text-gray-100">{item.businessName}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.streetAddress}</div>
            </td>
            <td className="px-3 py-2 text-blue-600 dark:text-blue-400 text-sm">{item.permitYear}</td>
          </tr>
        ));
      case 'demolitions':
        return items.map((item: any) => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
            <td className="px-3 py-2">
              <div className="font-medium text-gray-900 dark:text-gray-100">{item.address}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{item.reason}</div>
            </td>
            <td className="px-3 py-2 text-red-600 dark:text-red-400 text-sm">{item.demolitionDate}</td>
          </tr>
        ));
      case 'landmarks':
        return items.map((item: any) => {
          // Try to get coordinates from geometry first, then fallback to lat/lng
          let coordinates = null;
          
          if (item.geometry?.x && item.geometry?.y) {
            // Convert Web Mercator coordinates to lat/lng
            coordinates = webMercatorToLatLng(item.geometry.x, item.geometry.y);
          } else if (item.latitude && item.longitude) {
            // Use direct lat/lng if available (for mock data)
            coordinates = { lat: item.latitude, lng: item.longitude };
          }
          
          return (
            <tr
              key={item.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <td className="px-3 py-2">
                <div className="font-medium text-gray-900 dark:text-gray-100">{item.name || item.NAME}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{item.parentName || item.PARENT_NAME}</div>
              </td>
              <td className="px-3 py-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">{item.subtype || item.TYPE}</div>
                {coordinates ? (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors text-xs mt-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="h-3 w-3" />
                    Map
                  </a>
                ) : (
                  <span className="text-gray-400 text-xs">No location</span>
                )}
              </td>
            </tr>
          );
        });
      default:
        return null;
    }
  };

  return (
    <WidgetContainer
      title="Philadelphia Data Explorer"
      width={width}
      onRefresh={() => fetchData(selectedDataset)}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="p-4">
        {/* Dataset Selector */}
        <div className="mb-4 flex items-center gap-2">
          {DATASET_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedDataset(option.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedDataset === option.value
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
          ))}
        </div>
        {/* Table for dataset, scrollable container */}
        <div className="overflow-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-72 scrollbar-hide">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              {renderTableHeaders()}
            </thead>
            <tbody>
              {renderTableRows()}
            </tbody>
          </table>
        </div>
      </div>


    </WidgetContainer>
  );
};

export default PhiladelphiaDataExplorerWidget; 