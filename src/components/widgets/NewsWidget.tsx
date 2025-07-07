import React, { useEffect, useState } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Loader2, Radio as RadioIcon, ExternalLink, AlertTriangle, Play, Pause } from 'lucide-react';

interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  url_resolved?: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  bitrate: number;
  codec: string;
  language: string;
}

const GEO_API_URL = 'https://de1.api.radio-browser.info/json/stations/search?geo_lat=40.0127&geo_long=-75.1836&geo_distance=25000&countrycode=US&order=geo_distance&hidebroken=true';
const NAME_API_URL = 'https://de1.api.radio-browser.info/json/stations/search?name=philadelphia';

const RADIO_TABS = [
  { key: 'geo', label: 'Nearby Stations', api: GEO_API_URL },
  { key: 'name', label: 'Philadelphia', api: NAME_API_URL },
];

const NewsWidget: React.FC<{ width?: 'half' | 'full'; onRefresh?: () => void; onMoveTop?: () => void; onMoveBottom?: () => void; onToggleWidth?: () => void; onHide?: () => void; dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>; }> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide, dragHandleProps }) => {
  const [tab, setTab] = useState<'geo' | 'name'>('geo');
  const [stations, setStations] = useState<{ [key: string]: RadioStation[] }>({ geo: [], name: [] });
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({ geo: true, name: false });
  const [error, setError] = useState<{ [key: string]: string | null }>({ geo: null, name: null });
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [imgError, setImgError] = useState<{ [uuid: string]: boolean }>({});

  // Fetch stations for the selected tab
  useEffect(() => {
    if (stations[tab].length > 0 || loading[tab]) return;
    setLoading(l => ({ ...l, [tab]: true }));
    setError(e => ({ ...e, [tab]: null }));
    fetch(RADIO_TABS.find(t => t.key === tab)!.api)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch radio stations.');
        return res.json();
      })
      .then((data: RadioStation[]) => {
        // Only include stations with a supported codec and a direct stream URL
        const supported = data.filter(station => {
          const codec = station.codec?.toLowerCase();
          const url = station.url_resolved || station.url;
          return (
            url &&
            (codec === 'mp3' || codec === 'aac') &&
            url.match(/^https?:\/\//i)
          );
        });
        setStations(s => ({ ...s, [tab]: supported }));
        setLoading(l => ({ ...l, [tab]: false }));
      })
      .catch(err => {
        setError(e => ({ ...e, [tab]: 'Could not load radio stations. Please try again later.' }));
        setLoading(l => ({ ...l, [tab]: false }));
      });
    // Cleanup audio on unmount
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
    // eslint-disable-next-line
  }, [tab]);

  // Initial fetch for geo tab
  useEffect(() => {
    setLoading(l => ({ ...l, geo: true }));
    setError(e => ({ ...e, geo: null }));
    fetch(GEO_API_URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch radio stations.');
        return res.json();
      })
      .then((data: RadioStation[]) => {
        const supported = data.filter(station => {
          const codec = station.codec?.toLowerCase();
          const url = station.url_resolved || station.url;
          return (
            url &&
            (codec === 'mp3' || codec === 'aac') &&
            url.match(/^https?:\/\//i)
          );
        });
        setStations(s => ({ ...s, geo: supported }));
        setLoading(l => ({ ...l, geo: false }));
      })
      .catch(err => {
        setError(e => ({ ...e, geo: 'Could not load radio stations. Please try again later.' }));
        setLoading(l => ({ ...l, geo: false }));
      });
    // eslint-disable-next-line
  }, []);

  const handlePlay = (station: RadioStation) => {
    if (audio) {
      audio.pause();
      setAudio(null);
    }
    if (playing === station.stationuuid) {
      setPlaying(null);
      return;
    }
    const newAudio = new window.Audio(station.url_resolved || station.url);
    newAudio.play();
    setAudio(newAudio);
    setPlaying(station.stationuuid);
    newAudio.onended = () => setPlaying(null);
    newAudio.onerror = () => {
      setError(e => ({ ...e, [tab]: 'Failed to play this station.' }));
      setPlaying(null);
    };
  };

  const handleImgError = (uuid: string) => {
    setImgError(prev => ({ ...prev, [uuid]: true }));
  };

  return (
    <WidgetContainer
      title="Radio Stations"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-full">
            {RADIO_TABS.map(t => (
              <li key={t.key} className="me-2">
                <button
                  onClick={() => setTab(t.key as 'geo' | 'name')}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
                    tab === t.key
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        {/* Station List */}
        {loading[tab] ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
          </div>
        ) : error[tab] ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <span className="text-center text-sm font-medium">{error[tab]}</span>
          </div>
        ) : stations[tab].length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No radio stations found.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto scrollbar-hide">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {stations[tab].map(station => (
                <li key={station.stationuuid} className="flex items-center gap-3 py-3">
                  {imgError[station.stationuuid] || !station.favicon ? (
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-white border border-gray-200 dark:border-gray-700">
                      <RadioIcon className="h-6 w-6 text-gray-400" />
                    </div>
                  ) : (
                    <img
                      src={station.favicon}
                      alt="station icon"
                      className="w-10 h-10 rounded bg-white border border-gray-200 dark:border-gray-700 object-contain"
                      onError={() => handleImgError(station.stationuuid)}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-gray-100 truncate">{station.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{station.tags}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {station.bitrate}kbps {station.codec.toUpperCase()} {station.language && `• ${station.language}`}
                    </div>
                  </div>
                  <button
                    onClick={() => handlePlay(station)}
                    className={`flex items-center justify-center px-3 py-2 rounded-lg transition-colors text-xs font-medium ${playing === station.stationuuid ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    title={playing === station.stationuuid ? 'Pause' : 'Play'}
                  >
                    {playing === station.stationuuid ? <Pause className="h-4 w-4 mr-1" /> : <Play className="h-4 w-4 mr-1" />}
                    {playing === station.stationuuid ? 'Pause' : 'Play'}
                  </button>
                  <a
                    href={station.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                    title="Station Homepage"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default NewsWidget;