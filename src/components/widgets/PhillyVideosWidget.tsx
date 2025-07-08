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

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const YOUTUBE_API_URL = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&order=date&q=Philadelphia&maxResults=25&key=${YOUTUBE_API_KEY}`;

const PhillyVideosWidget: React.FC<PhillyVideosWidgetProps> = (props) => {
  return <PhillyVideosWidgetInner {...props} />;
};

const PhillyVideosWidgetInner: React.FC<PhillyVideosWidgetProps> = ({
  width = 'half',
  onRefresh,
  onMoveTop,
  onMoveBottom,
  onToggleWidth,
  onHide,
  dragHandleProps,
}): JSX.Element => {
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeVideo | null>(null);
  const [showEmbeddedPlayer, setShowEmbeddedPlayer] = useState(false);
  const [imgError, setImgError] = useState<{ [id: string]: boolean }>({});
  const [sortDesc, setSortDesc] = useState(true); // true = newest first

  // Fetch all videos on mount or reload
  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(YOUTUBE_API_URL);
      if (!response.ok) throw new Error('YouTube API error');
      const data = await response.json();
      if (!data.items || !Array.isArray(data.items)) throw new Error('Invalid response format from YouTube API');
      const processedVideos: YouTubeVideo[] = data.items.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        videoId: item.id.videoId,
      }));
      // Sort by publishedAt descending (newest first by default)
      processedVideos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      setAllVideos(processedVideos);
    } catch (e: any) {
      setError('Failed to load videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
    // eslint-disable-next-line
  }, []);

  // Sort videos by date according to sortDesc
  const sortedVideos = [...allVideos].sort((a, b) =>
    sortDesc
      ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      : new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
      onRefresh={fetchVideos}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-4">
        {/* Sort Toggle */}
        <div className="flex justify-end">
          <button
            onClick={() => setSortDesc((v) => !v)}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
            title={sortDesc ? 'Sort by oldest' : 'Sort by newest'}
          >
            {sortDesc ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                Newest
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                Oldest
              </>
            )}
          </button>
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
          ) : sortedVideos.length === 0 ? (
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              No videos found
            </div>
          ) : (
            sortedVideos.map((video) => (
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
                        onError={() => setImgError((prev) => ({ ...prev, [video.id]: true }))}
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
                        <Play className="h-4 w-4" /> Play
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(video.videoId);
                        }}
                        className="flex items-center gap-1 text-gray-500 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs"
                      >
                        <ExternalLink className="h-4 w-4" /> YouTube
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Embedded Player Modal */}
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