import React, { useState, useEffect, useReducer, useContext, createContext } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Play, ExternalLink, Loader2, X, Video as VideoIcon } from 'lucide-react';

interface PhillyVideosWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  videoId: string;
}

type VideoCategory = 'food' | 'tourism' | 'events' | 'history' | 'markets';

const categories = [
  { key: 'food', label: 'Philly Food', query: 'philadelphia food' },
  { key: 'tourism', label: 'Tourism', query: 'philadelphia tourism' },
  { key: 'events', label: 'Events', query: 'philadelphia events' },
  { key: 'history', label: 'History', query: 'philadelphia history' },
  { key: 'markets', label: 'Markets', query: 'philadelphia markets' }
];

interface VideosState {
  [category: string]: {
    videos: YouTubeVideo[];
    loading: boolean;
    error: string | null;
    lastFetched: number | null;
  };
}

type VideosAction =
  | { type: 'FETCH_START'; category: VideoCategory }
  | { type: 'FETCH_SUCCESS'; category: VideoCategory; videos: YouTubeVideo[] }
  | { type: 'FETCH_ERROR'; category: VideoCategory; error: string };

const initialState: VideosState = {};

function videosReducer(state: VideosState, action: VideosAction): VideosState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        [action.category]: {
          videos: [],
          loading: true,
          error: null,
          lastFetched: null,
        },
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        [action.category]: {
          videos: action.videos,
          loading: false,
          error: null,
          lastFetched: Date.now(),
        },
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        [action.category]: {
          videos: [],
          loading: false,
          error: action.error,
          lastFetched: null,
        },
      };
    default:
      return state;
  }
}

const VideosContext = createContext<{
  state: VideosState;
  dispatch: React.Dispatch<VideosAction>;
} | undefined>(undefined);

function VideosProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(videosReducer, initialState);
  return (
    <VideosContext.Provider value={{ state, dispatch }}>
      {children}
    </VideosContext.Provider>
  );
}

function useVideos() {
  const context = useContext(VideosContext);
  if (!context) throw new Error('useVideos must be used within a VideosProvider');
  return context;
}

function getMockVideos(category: VideoCategory): YouTubeVideo[] {
  const mockData = {
    food: [
      {
        id: 'mock-food-1',
        title: 'Best Philly Cheesesteaks in Philadelphia',
        description: 'Exploring the most popular cheesesteak spots in Philadelphia',
        thumbnail: 'https://via.placeholder.com/96x80/ff6b6b/ffffff?text=Food',
        channelTitle: 'Philly Food Guide',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-food-1',
      },
      {
        id: 'mock-food-2',
        title: 'Reading Terminal Market Food Tour',
        description: 'A complete guide to Philadelphia\'s famous food market',
        thumbnail: 'https://via.placeholder.com/96x80/ff8e53/ffffff?text=Market',
        channelTitle: 'Philly Eats',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-food-2',
      },
    ],
    tourism: [
      {
        id: 'mock-tourism-1',
        title: 'Philadelphia Tourism Guide - Top Attractions',
        description: 'Complete guide to Philadelphia\'s must-see attractions',
        thumbnail: 'https://via.placeholder.com/96x80/4ecdc4/ffffff?text=Tourism',
        channelTitle: 'Philly Tourism',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-tourism-1',
      },
      {
        id: 'mock-tourism-2',
        title: 'Independence Hall & Liberty Bell Tour',
        description: 'Exploring Philadelphia\'s historic landmarks',
        thumbnail: 'https://via.placeholder.com/96x80/45b7d1/ffffff?text=History',
        channelTitle: 'Philly History',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-tourism-2',
      },
    ],
    events: [
      {
        id: 'mock-events-1',
        title: 'Philadelphia Events & Festivals 2024',
        description: 'Upcoming events and festivals in Philadelphia',
        thumbnail: 'https://via.placeholder.com/96x80/96ceb4/ffffff?text=Events',
        channelTitle: 'Philly Events',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-events-1',
      },
      {
        id: 'mock-events-2',
        title: 'Wawa Welcome America Festival',
        description: 'Philadelphia\'s biggest summer celebration',
        thumbnail: 'https://via.placeholder.com/96x80/feca57/ffffff?text=Festival',
        channelTitle: 'Philly Celebrations',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-events-2',
      },
    ],
    history: [
      {
        id: 'mock-history-1',
        title: 'Philadelphia History - Founding Fathers',
        description: 'The complete history of Philadelphia and the American Revolution',
        thumbnail: 'https://via.placeholder.com/96x80/dda0dd/ffffff?text=History',
        channelTitle: 'Philly History',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-history-1',
      },
      {
        id: 'mock-history-2',
        title: 'Old City Philadelphia Walking Tour',
        description: 'Exploring the historic streets of Old City Philadelphia',
        thumbnail: 'https://via.placeholder.com/96x80/98d8c8/ffffff?text=Old+City',
        channelTitle: 'Philly Tours',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-history-2',
      },
    ],
    markets: [
      {
        id: 'mock-markets-1',
        title: 'Reading Terminal Market Complete Guide',
        description: 'Everything you need to know about Philadelphia\'s famous market',
        thumbnail: 'https://via.placeholder.com/96x80/ff9ff3/ffffff?text=Market',
        channelTitle: 'Philly Markets',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-markets-1',
      },
      {
        id: 'mock-markets-2',
        title: 'Italian Market Philadelphia Food Tour',
        description: 'Exploring the historic Italian Market in South Philadelphia',
        thumbnail: 'https://via.placeholder.com/96x80/feca57/ffffff?text=Italian',
        channelTitle: 'Philly Food Tours',
        publishedAt: new Date().toISOString(),
        videoId: 'mock-markets-2',
      },
    ],
  };
  return mockData[category] || mockData.food;
}

const PhillyVideosWidget: React.FC<PhillyVideosWidgetProps> = (props) => {
  return (
    <VideosProvider>
      <PhillyVideosWidgetInner {...props} />
    </VideosProvider>
  );
};

const PhillyVideosWidgetInner: React.FC<PhillyVideosWidgetProps> = ({ 
  width = 'half', 
  onRefresh, 
  onMoveTop, 
  onMoveBottom, 
  onToggleWidth, 
  onHide, 
  dragHandleProps 
}): JSX.Element => {
  const { state, dispatch } = useVideos();
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('food');
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(false);
  const [imgError, setImgError] = useState<{ [id: string]: boolean }>({});

  // Fetch videos only if not already cached
  useEffect(() => {
    const cached = state[selectedCategory];
    if (!cached || (!cached.videos.length && !cached.loading && !cached.error)) {
      fetchVideos(selectedCategory);
    }
    // eslint-disable-next-line
  }, [selectedCategory]);

  const fetchVideos = async (category: VideoCategory) => {
    dispatch({ type: 'FETCH_START', category });
    try {
      const categoryData = categories.find(c => c.key === category);
      if (!categoryData) return;
      const query = encodeURIComponent(categoryData.query);
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || '';
      let response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&q=${query}&maxResults=5&key=${apiKey}`
      );
      if (!response.ok) {
        // Try CORS proxy
        response = await fetch(
          `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&q=${query}&maxResults=5&key=${apiKey}`)}`
        );
      }
      if (!response.ok) {
        throw new Error('YouTube API error');
      }
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from YouTube API');
      }
      const processedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        videoId: item.id.videoId
      }));
      dispatch({ type: 'FETCH_SUCCESS', category, videos: processedVideos });
    } catch (error) {
      // If API key is missing or error, show mock data
      if (!import.meta.env.VITE_YOUTUBE_API_KEY) {
        dispatch({ type: 'FETCH_SUCCESS', category, videos: getMockVideos(category) });
      } else {
        dispatch({ type: 'FETCH_ERROR', category, error: 'Failed to load videos. Please try again.' });
      }
    }
  };

  const handleCategoryChange = (category: VideoCategory) => {
    setSelectedCategory(category);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const openEmbeddedPlayer = (video: YouTubeVideo) => {
    setSelectedVideo(video);
    setShowEmbeddedPlayer(true);
  };

  const closeEmbeddedPlayer = () => {
    setShowEmbeddedPlayer(false);
    setSelectedVideo(null);
  };

  const { videos = [], loading = false, error = null } = state[selectedCategory] || {};

  return (
    <WidgetContainer
      title="Philly Videos"
      width={width}
      onRefresh={() => fetchVideos(selectedCategory)}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* Category Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide">
          <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-full">
            {categories.map(category => (
              <li key={category.key} className="me-2">
                <button
                  onClick={() => handleCategoryChange(category.key as VideoCategory)}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
                    selectedCategory === category.key
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                >
                  {category.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Videos List */}
        <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-hide pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No videos found
            </div>
          ) : (
            videos.map(video => (
              <div
                key={video.id}
                className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors h-20"
              >
                <div className="flex h-full">
                  <div className="relative flex-shrink-0 w-24 h-20">
                    {!imgError[video.id] ? (
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-24 h-20 object-cover"
                        onError={() => setImgError(prev => ({ ...prev, [video.id]: true }))}
                      />
                    ) : (
                      <div className="w-24 h-20 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded">
                        <VideoIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-2 flex flex-col justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-xs line-clamp-1 mb-1">
                        {video.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                        {video.channelTitle} • {formatDate(video.publishedAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEmbeddedPlayer(video);
                        }}
                        className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                      >
                        <Play className="h-3 w-3" />
                        Play
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(video.videoId);
                        }}
                        className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xs"
                      >
                        <ExternalLink className="h-3 w-3" />
                        YouTube
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Embedded Video Player Modal */}
        {showEmbeddedPlayer && selectedVideo && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-900 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={closeEmbeddedPlayer}
                  className="text-gray-400 hover:text-gray-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.videoId}?autoplay=1`}
                    className="absolute inset-0 w-full h-full rounded"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-100 mb-2">{selectedVideo.title}</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    {selectedVideo.channelTitle} • {formatDate(selectedVideo.publishedAt)}
                  </p>
                  <p className="text-sm text-gray-300 line-clamp-3">
                    {selectedVideo.description}
                  </p>
                </div>
                
                <div className="mt-4 flex gap-2">
                  <a
                    href={`https://www.youtube.com/watch?v=${selectedVideo.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in YouTube
                  </a>
                  <button
                    onClick={closeEmbeddedPlayer}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default PhillyVideosWidget; 