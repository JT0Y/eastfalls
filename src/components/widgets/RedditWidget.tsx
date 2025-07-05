import React, { useState, useEffect } from 'react';
import { getRedditPosts } from '../../services/api';
import { RedditPost } from '../../types';
import { MessageCircle, ArrowUpRight, ThumbsUp } from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';

const SUBREDDITS = [
  { id: 'philadelphia', label: 'r/philadelphia' },
  { id: 'phillylist', label: 'r/phillylist' },
  { id: 'philly', label: 'r/philly' }
];

interface RedditWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
}

const RedditWidget: React.FC<RedditWidgetProps> = ({ width = 'half', onRefresh, onMoveTop, onMoveBottom, onToggleWidth }) => {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSubreddit, setActiveSubreddit] = useState(SUBREDDITS[0].id);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await getRedditPosts(activeSubreddit);
      setPosts(data); // No limit - show all posts
    } catch (error) {
      console.error('Error fetching Reddit posts:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch Reddit posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [activeSubreddit]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`;
    } else {
      return `${Math.floor(diff / 86400)}d ago`;
    }
  };

  if (loading) {
    return (
      <WidgetContainer
        title="Reddit"
        width={width}
        onRefresh={fetchPosts}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
      >
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Reddit"
      width={width}
      onRefresh={fetchPosts}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
    >
      <div className="p-4">
        {/* Subreddit Tabs */}
        <div className="flex space-x-2 mb-4">
          {SUBREDDITS.map(subreddit => (
            <button
              key={subreddit.id}
              onClick={() => setActiveSubreddit(subreddit.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeSubreddit === subreddit.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {subreddit.label}
            </button>
          ))}
        </div>

        <div className="space-y-5 max-h-64 overflow-y-auto overflow-x-hidden">
          {error ? (
            <div className="text-center py-4 text-red-500">
              <p className="font-medium">Reddit API Error</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No posts available
            </div>
          ) : (
            posts.map((post) => (
              <a
                key={post.id}
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block group hover:bg-gray-50 dark:hover:bg-gray-800 -mx-4 px-4 py-4 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center space-x-4">
                  {post.thumbnail && (
                    <div className="flex-shrink-0">
                      <img 
                        src={post.thumbnail} 
                        alt={post.title}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.content && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {post.content}
                      </p>
                    )}
                    <div className="mt-1 flex items-center text-xs text-gray-500 space-x-2">
                      <span>{post.subreddit}</span>
                      <span>•</span>
                      <span>{formatTime(post.created)}</span>
                      <span>•</span>
                      <div className="flex items-center">
                        <ThumbsUp className="h-3 w-3 mr-1" />
                        <span>{post.score}</span>
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        <span>{post.numComments}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default RedditWidget;