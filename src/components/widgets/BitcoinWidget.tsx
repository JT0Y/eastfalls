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
}

const PhiladelphiaDataExplorerWidget: React.FC<PhiladelphiaDataExplorerWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
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

  const getGoogleMapsUrl = (item: any) => {
    if (item.latitude && item.longitude) {
      const searchQuery = encodeURIComponent(item.address || `${item.businessName}, ${item.streetAddress}`);
      return `https://www.google.com/maps?q=${searchQuery}`;
    }
    return undefined;
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

  const getCurrentTotal = () => {
    const data = getCurrentData();
    return data?.totalCount || 0;
  };

  const renderItem = (item: any, index: number) => {
    switch (selectedDataset) {
      case 'tobacco':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {item.businessName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.streetAddress}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {item.permitYear}
                </p>
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              </div>
            </div>
          </div>
        );
      
      case 'demolitions':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {item.address}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.reason}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-red-600 dark:text-red-400">
                  {item.demolitionDate}
                </p>
                <AlertTriangle className="h-4 w-4 text-red-400 mt-1" />
              </div>
            </div>
          </div>
        );
      
      case 'landmarks':
        return (
          <div
            key={item.id}
            onClick={() => handleItemClick(item)}
            className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {item.subtype}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                  {item.parentName || 'No Parent'}
                </p>
                <LandmarkIcon className="h-4 w-4 text-purple-400 mt-1" />
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const renderModalContent = () => {
    if (!selectedItem) return null;

    switch (selectedDataset) {
      case 'tobacco':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedItem.businessName}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedItem.streetAddress}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Permit Year: {selectedItem.permitYear}
                  </span>
                </div>
                <div className="flex items-center">
                  <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    ZIP Code: {selectedItem.zipCode}
                  </span>
                </div>
              </div>
            </div>
            {selectedItem.latitude && selectedItem.longitude && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Location
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(`${selectedItem.businessName}, ${selectedItem.streetAddress}`)}&hl=en&z=15&output=embed`}
                    ></iframe>
                  </div>
                  <a
                    href={getGoogleMapsUrl(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'demolitions':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Demolition Details
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedItem.address}
                  </span>
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Demolition Date: {selectedItem.demolitionDate}
                  </span>
                </div>
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Reason: {selectedItem.reason}
                  </span>
                </div>
              </div>
            </div>
            {selectedItem.latitude && selectedItem.longitude && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Location
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedItem.address)}&hl=en&z=15&output=embed`}
                    ></iframe>
                  </div>
                  <a
                    href={getGoogleMapsUrl(selectedItem)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'landmarks':
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {selectedItem.name}
              </h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <LandmarkIcon className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Type: {selectedItem.subtype}
                  </span>
                </div>
                {selectedItem.address && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Address: {selectedItem.address}
                    </span>
                  </div>
                )}
                {selectedItem.parentName && (
                  <div className="flex items-center">
                    <Building2 className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 dark:text-gray-300">
                      Parent: {selectedItem.parentName}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Updated: {selectedItem.dateUpdated}
                  </span>
                </div>
              </div>
            </div>
            {selectedItem.latitude && selectedItem.longitude && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Location
                </h4>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
                  <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-lg mb-3">
                    <iframe
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      loading="lazy"
                      allowFullScreen
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(selectedItem.name)}&hl=en&z=15&output=embed`}
                    ></iframe>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://www.google.com/maps?q=${encodeURIComponent(selectedItem.name)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open in Google Maps
                    </a>
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(selectedItem.name + ' Philadelphia')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Google Search
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Philadelphia Data Explorer"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
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
        title="Philadelphia Data Explorer"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="flex flex-col items-center justify-center h-full">
          <p>Unable to load data</p>
        </div>
      </WidgetContainer>
    );
  }

  const currentOption = DATASET_OPTIONS.find(option => option.value === selectedDataset);

  return (
    <>
      <WidgetContainer
        title="Philadelphia Data Explorer"
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="p-4">
          {/* Dataset Selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              Select Dataset
            </label>
            <select
              value={selectedDataset}
              onChange={(e) => setSelectedDataset(e.target.value as DatasetType)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {DATASET_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {currentOption && (
              <p className="text-xs text-gray-500 mt-1">
                {currentOption.description}
              </p>
            )}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center">
                {currentOption?.icon}
                <div className="ml-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Items</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {getCurrentTotal()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-green-500 mr-2" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Last Updated</p>
                  <p className="text-sm font-bold text-green-600 dark:text-green-400">
                    {new Date(currentData.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {currentOption?.label} in Philadelphia
            </h3>
            {getCurrentItems().map((item, index) => renderItem(item, index))}
          </div>

          <div className="mt-4 text-xs text-gray-500">
            Last updated: {new Date(currentData.lastUpdated).toLocaleString()}
          </div>
        </div>
      </WidgetContainer>

      {/* Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden">
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
    </>
  );
};

export default PhiladelphiaDataExplorerWidget;