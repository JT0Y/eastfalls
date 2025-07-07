import React, { useState, useEffect } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Play, ExternalLink, Loader2 } from 'lucide-react';

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

type VideoCategory = 'food' | 'tourism' | 'events';

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

  const categories = [
    { key: 'food', label: 'Philly Food', query: 'philadelphia food' },
    { key: 'tourism', label: 'Tourism', query: 'philadelphia tourism' },
    { key: 'events', label: 'Events', query: 'philadelphia events' }
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

      const processedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        videoId: item.id.videoId
      }));

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
          videoId: 'mock-video-1'
        },
        {
          id: 'mock-2',
          title: 'Philadelphia Tourism Guide',
          description: 'Top attractions and things to do in Philadelphia',
          thumbnail: 'https://via.placeholder.com/320x180/4ecdc4/ffffff?text=Tourism',
          channelTitle: 'Philly Tourism',
          publishedAt: new Date().toISOString(),
          videoId: 'mock-video-2'
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
        <div className="space-y-3">
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
            videos.map(video => (
              <div
                key={video.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => openVideo(video.videoId)}
              >
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/320x180/666666/ffffff?text=Video';
                    }}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-100 text-sm line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-400 mb-2 line-clamp-1">
                    {video.channelTitle} • {formatDate(video.publishedAt)}
                  </p>
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-3 w-3 text-blue-400" />
                    <span className="text-xs text-blue-400">Watch on YouTube</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default PhillyVideosWidget; 