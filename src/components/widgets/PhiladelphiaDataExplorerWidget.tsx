import React, { useState, useEffect, useCallback } from 'react';
import { getTobaccoPermits, getDemolitions, getLandmarks } from '../../services/api';
import { TobaccoPermit, TobaccoPermitData, Demolition, DemolitionData, Landmark, LandmarkData } from '../../types';
import { MapPin, Calendar, Building2, RotateCw, X, ExternalLink, Truck, AlertTriangle, Landmark as LandmarkIcon, User } from 'lucide-react';
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

type DatasetType = 'tobacco' | 'demolitions' | 'landmarks' | 'complainant_demographics';

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
    label: 'Landmarks',
    icon: <LandmarkIcon className="h-4 w-4" />,
    description: 'Historic landmarks and points of interest'
  },
  {
    value: 'complainant_demographics',
    label: 'Complainant Demographics',
    icon: <User className="h-4 w-4" />,
    description: 'PPD Complainant Demographics',
  },
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
          let coordinates = null;
          if (item.geometry?.x && item.geometry?.y) {
            coordinates = webMercatorToLatLng(item.geometry.x, item.geometry.y);
          } else if (item.latitude && item.longitude) {
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
                ) : null}
              </td>
            </tr>
          );
        });
      default:
        return null;
    }
  };

  // New tab component for Complainant Demographics
  const ComplainantDemographicsTab: React.FC = () => {
    const [raceOptions, setRaceOptions] = useState<string[]>([]);
    const [sexOptions, setSexOptions] = useState<string[]>([]);
    const [race, setRace] = useState('');
    const [sex, setSex] = useState('');
    const [minAge, setMinAge] = useState('');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [sortCol, setSortCol] = useState('complainant_age');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 25;

    // Fetch unique race and sex options on mount
    useEffect(() => {
      fetch('https://phl.carto.com/api/v2/sql?q=SELECT DISTINCT complainant_race FROM ppd_complainant_demographics WHERE complainant_race IS NOT NULL ORDER BY complainant_race')
        .then(res => res.json())
        .then(res => setRaceOptions(res.rows.map((r: any) => r.complainant_race)))
        .catch(() => setRaceOptions([]));
      fetch('https://phl.carto.com/api/v2/sql?q=SELECT DISTINCT complainant_sex FROM ppd_complainant_demographics WHERE complainant_sex IS NOT NULL ORDER BY complainant_sex')
        .then(res => res.json())
        .then(res => setSexOptions(res.rows.map((r: any) => r.complainant_sex)))
        .catch(() => setSexOptions([]));
    }, []);

    // Fetch filtered data
    const fetchData = useCallback(() => {
      setLoading(true);
      setError(null);
      let where = [];
      if (race) where.push(`complainant_race = '${race.replace("'", "''")}'`);
      if (sex) where.push(`complainant_sex = '${sex.replace("'", "''")}'`);
      if (minAge) where.push(`complainant_age >= ${parseInt(minAge)}`);
      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const sql = `SELECT complainant_race, complainant_sex, complainant_age, complaint_id FROM ppd_complainant_demographics ${whereClause} ORDER BY ${sortCol} ${sortDir} LIMIT 100`;
      fetch(`https://phl.carto.com/api/v2/sql?q=${encodeURIComponent(sql)}`)
        .then(res => res.json())
        .then(res => {
          setData(res.rows || []);
          setPage(0);
          setLoading(false);
        })
        .catch(e => {
          setError('Error fetching data');
          setLoading(false);
        });
    }, [race, sex, minAge, sortCol, sortDir]);

    useEffect(() => {
      fetchData();
    }, [fetchData]);

    const handleSort = (col: string) => {
      if (sortCol === col) {
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
      } else {
        setSortCol(col);
        setSortDir('asc');
      }
    };

    const handleReset = () => {
      setRace('');
      setSex('');
      setMinAge('');
    };

    // Pagination
    const pagedData = data.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const totalPages = Math.ceil(data.length / PAGE_SIZE);

    return (
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Race</label>
            <select value={race} onChange={e => setRace(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">All</option>
              {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Sex</label>
            <select value={sex} onChange={e => setSex(e.target.value)} className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
              <option value="">All</option>
              {sexOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Min Age</label>
            <input type="number" min="0" value={minAge} onChange={e => setMinAge(e.target.value)} className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
          </div>
          <button onClick={handleReset} className="ml-2 px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700">Reset Filters</button>
        </div>
        {/* Table */}
        <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="px-2 py-2 text-xs font-semibold">Race</th>
                <th className="px-2 py-2 text-xs font-semibold">Sex</th>
                <th className="px-2 py-2 text-xs font-semibold cursor-pointer" onClick={() => handleSort('complainant_age')}>Age {sortCol === 'complainant_age' && (sortDir === 'asc' ? '▲' : '▼')}</th>
                <th className="px-2 py-2 text-xs font-semibold">Comp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center py-6">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="text-center py-6 text-red-600">{error}</td></tr>
              ) : pagedData.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-6 text-gray-500">No results found.</td></tr>
              ) : (
                pagedData.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-2 py-2 truncate max-w-[80px]">{row.complainant_race}</td>
                    <td className="px-2 py-2 truncate max-w-[40px]">{row.complainant_sex}</td>
                    <td className="px-2 py-2 truncate max-w-[40px]">{row.complainant_age}</td>
                    <td className="px-2 py-2 truncate max-w-[80px]">{row.complaint_id}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-2 gap-2">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50">Previous</button>
            <span className="text-xs">Page {page + 1} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50">Next</button>
          </div>
        )}
      </div>
    );
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
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide mb-4">
          <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-full">
          {DATASET_OPTIONS.map(option => (
              <li key={option.value} className="me-2">
            <button
              onClick={() => setSelectedDataset(option.value)}
                  className={`inline-flex items-center gap-2 justify-center p-4 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
                selectedDataset === option.value
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
              }`}
            >
              {option.icon}
              {option.label}
            </button>
              </li>
          ))}
          </ul>
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
        {selectedDataset === 'complainant_demographics' && <ComplainantDemographicsTab />}
      </div>
    </WidgetContainer>
  );
};

export default PhiladelphiaDataExplorerWidget; 