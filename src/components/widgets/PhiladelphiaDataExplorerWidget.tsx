import React, { useState, useEffect, useCallback } from 'react';
import { getTobaccoPermits, getDemolitions, getLandmarks } from '../../services/api';
import { TobaccoPermit, TobaccoPermitData, Demolition, DemolitionData, Landmark, LandmarkData } from '../../types';
import { MapPin, Calendar, Building2, RotateCw, X, ExternalLink, Truck, AlertTriangle, Landmark as LandmarkIcon } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

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
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

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

  const handleItemClick = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

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
            <th className="px-3 py-2 text-left text-xs font-semibold">Business Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Address</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Permit Year</th>
          </tr>
        );
      case 'demolitions':
        return (
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold">Address</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Reason</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Date</th>
          </tr>
        );
      case 'landmarks':
        return (
          <tr>
            <th className="px-3 py-2 text-left text-xs font-semibold">Name</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Type</th>
            <th className="px-3 py-2 text-left text-xs font-semibold">Parent</th>
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
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => handleItemClick(item)}>
            <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.businessName}</td>
            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.streetAddress}</td>
            <td className="px-3 py-2 text-blue-600 dark:text-blue-400">{item.permitYear}</td>
          </tr>
        ));
      case 'demolitions':
        return items.map((item: any) => (
          <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => handleItemClick(item)}>
            <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.address}</td>
            <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.reason}</td>
            <td className="px-3 py-2 text-red-600 dark:text-red-400">{item.demolitionDate}</td>
          </tr>
        ));
      case 'landmarks':
        return items.map((item: any) => {
          const x = item.geometry?.x;
          const y = item.geometry?.y;
          const label = encodeURIComponent(item.name || item.NAME || 'Landmark');
          const url = (x && y)
            ? `https://www.google.com/maps/search/?api=1&query=${y},${x}&query_place_id=${label}`
            : undefined;
          return (
            <tr
              key={item.id}
              className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
              onClick={() => { if (url) window.open(url, '_blank'); }}
              title={url ? 'Open in Google Maps' : ''}
            >
              <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">{item.name || item.NAME}</td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.subtype || item.TYPE}</td>
              <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{item.parentName || item.PARENT_NAME}</td>
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
        <div className="overflow-auto rounded-lg shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 max-h-72">
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