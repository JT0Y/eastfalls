import React, { useState, useEffect } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Play, ExternalLink, Loader2, X } from 'lucide-react';

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
  isShort: boolean;
}

type VideoCategory = 'food' | 'tourism' | 'events' | 'history' | 'markets';

const PhillyVideosWidget: React.FC<PhillyVideosWidgetProps> = ({ 
  width = 'half', 
  onRefresh, 
  onMoveTop, 
  onMoveBottom, 
  onToggleWidth, 
  onHide, 
  dragHandleProps 
}): JSX.Element => {
  const [selectedCategory, setSelectedCategory] = useState<VideoCategory>('food');
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(false);

  const categories = [
    { key: 'food', label: 'Philly Food', query: 'philadelphia food' },
    { key: 'tourism', label: 'Tourism', query: 'philadelphia tourism' },
    { key: 'events', label: 'Events', query: 'philadelphia events' },
    { key: 'history', label: 'History', query: 'philadelphia history' },
    { key: 'markets', label: 'Markets', query: 'philadelphia markets' }
  ];

  const fetchVideos = async (category: VideoCategory) => {
    setLoading(true);
    setError(null);
    
    try {
      const categoryData = categories.find(c => c.key === category);
      if (!categoryData) return;

      const query = encodeURIComponent(categoryData.query);
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY || 'AIzaSyAzo7tVVfpq67_gU3Fc0RXRDEQsIJzxJ3Q';
      
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&q=${query}&maxResults=5&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        throw new Error('Invalid response format from YouTube API');
      }

      const processedVideos: YouTubeVideo[] = data.items.map((item: any) => {
        // Detect if video is a Short (typically has #shorts in title or description)
        const isShort = item.snippet.title.toLowerCase().includes('#shorts') || 
                       item.snippet.description.toLowerCase().includes('#shorts') ||
                       item.snippet.title.toLowerCase().includes('short');
        
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
          channelTitle: item.snippet.channelTitle,
          publishedAt: item.snippet.publishedAt,
          videoId: item.id.videoId,
          isShort
        };
      });

      setVideos(processedVideos);
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
      setError('Failed to load videos. Please try again.');
      
      // Fallback to mock data
      const mockVideos: YouTubeVideo[] = [
        {
          id: 'mock-1',
          title: 'Best Philly Cheesesteaks in Philadelphia',
          description: 'Exploring the most popular cheesesteak spots in Philadelphia',
          thumbnail: 'https://via.placeholder.com/320x180/ff6b6b/ffffff?text=Philly+Food',
          channelTitle: 'Philly Food Guide',
          publishedAt: new Date().toISOString(),
          videoId: 'mock-video-1',
          isShort: false
        },
        {
          id: 'mock-2',
          title: 'Philadelphia Tourism Guide',
          description: 'Top attractions and things to do in Philadelphia',
          thumbnail: 'https://via.placeholder.com/320x180/4ecdc4/ffffff?text=Tourism',
          channelTitle: 'Philly Tourism',
          publishedAt: new Date().toISOString(),
          videoId: 'mock-video-2',
          isShort: false
        }
      ];
      setVideos(mockVideos);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos(selectedCategory);
  }, [selectedCategory]);

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
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category.key}
              onClick={() => handleCategoryChange(category.key as VideoCategory)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedCategory === category.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Videos List */}
        <div className="max-h-96 overflow-y-auto scrollbar-hide">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-400 text-sm">
              {error}
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-sm">
              No videos found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {/* Regular Videos Column */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Videos</h4>
                {videos.filter(video => !video.isShort).map(video => (
                  <div
                    key={video.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors h-20"
                  >
                    <div className="flex h-full">
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-24 h-20 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/96x80/666666/ffffff?text=Video';
                          }}
                        />
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between">
                        <div>
                          <h3 className="font-medium text-gray-100 text-xs line-clamp-1 mb-1">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {video.channelTitle} • {formatDate(video.publishedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEmbeddedPlayer(video);
                            }}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideo(video.videoId);
                            }}
                            className="flex items-center gap-1 text-gray-400 hover:text-gray-300 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            YouTube
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shorts Column */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-300 mb-2">Shorts</h4>
                {videos.filter(video => video.isShort).map(video => (
                  <div
                    key={video.id}
                    className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors h-20"
                  >
                    <div className="flex h-full">
                      <div className="relative flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-24 h-20 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://via.placeholder.com/96x80/666666/ffffff?text=Video';
                          }}
                        />
                      </div>
                      <div className="flex-1 p-2 flex flex-col justify-between">
                        <div>
                          <h3 className="font-medium text-gray-100 text-xs line-clamp-1 mb-1">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-400 line-clamp-1">
                            {video.channelTitle} • {formatDate(video.publishedAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEmbeddedPlayer(video);
                            }}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-xs"
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openVideo(video.videoId);
                            }}
                            className="flex items-center gap-1 text-gray-400 hover:text-gray-300 text-xs"
                          >
                            <ExternalLink className="h-3 w-3" />
                            YouTube
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
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
    </WidgetContainer>
  );
};

export default PhillyVideosWidget; 