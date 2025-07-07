import React, { useEffect, useState } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Loader2, Radio as RadioIcon, ExternalLink, AlertTriangle, Play, Pause } from 'lucide-react';

interface RadioStation {
  stationuuid: string;
  name: string;
  url: string;
  homepage: string;
  favicon: string;
  tags: string;
  country: string;
  bitrate: number;
  codec: string;
  language: string;
}

const API_URL = 'https://de1.api.radio-browser.info/json/stations/search?name=philadelphia';

const NewsWidget: React.FC<{ width?: 'half' | 'full'; onRefresh?: () => void; onMoveTop?: () => void; onMoveBottom?: () => void; onToggleWidth?: () => void; onHide?: () => void; dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>; }> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth, onHide, dragHandleProps }) => {
  const [stations, setStations] = useState<RadioStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [imgError, setImgError] = useState<{ [uuid: string]: boolean }>({});

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch radio stations.');
        return res.json();
      })
      .then((data: RadioStation[]) => {
        setStations(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Could not load Philly radio stations. Please try again later.');
        setLoading(false);
      });
    // Cleanup audio on unmount
    return () => {
      if (audio) {
        audio.pause();
        setAudio(null);
      }
    };
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
    const newAudio = new window.Audio(station.url);
    newAudio.play();
    setAudio(newAudio);
    setPlaying(station.stationuuid);
    newAudio.onended = () => setPlaying(null);
    newAudio.onerror = () => {
      setError('Failed to play this station.');
      setPlaying(null);
    };
  };

  const handleImgError = (uuid: string) => {
    setImgError(prev => ({ ...prev, [uuid]: true }));
  };

  return (
    <WidgetContainer
      title="Philly Radio News"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-8 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-8 w-8 mb-2" />
            <span className="text-center text-sm font-medium">{error}</span>
          </div>
        ) : stations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No Philly radio stations found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {stations.map(station => (
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
        )}
      </div>
    </WidgetContainer>
  );
};

export default NewsWidget;