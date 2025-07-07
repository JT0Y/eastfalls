import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { getRedditPosts } from '../../services/api';
import { RedditPost } from '../../types';
import { 
  MessageCircle, 
  ArrowUpRight, 
  ThumbsUp, 
  Clock, 
  TrendingUp, 
  Calendar,
  User,
  Tag,
  Image as ImageIcon,
  Link as LinkIcon,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import WidgetContainer from '../ui/WidgetContainer';
import { useDashboardData } from '../../DataContext';

const SUBREDDITS = [
  { id: 'philadelphia', label: 'r/philadelphia' },
  { id: 'phillylist', label: 'r/phillylist' },
  { id: 'philly', label: 'r/philly' },
  { id: 'PhiladelphiaEats', label: 'r/PhiladelphiaEats' }
];

const SORT_OPTIONS = [
  { id: 'hot', label: 'Most Popular', icon: TrendingUp },
  { id: 'new', label: 'Newest', icon: Calendar },
  { id: 'top', label: 'Top Rated', icon: ThumbsUp }
];

interface RedditWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

// State interface
interface RedditState {
  posts: RedditPost[];
  loading: boolean;
  error: string | null;
  activeSubreddit: string;
  activeSort: string;
  expandedPosts: Set<string>;
  cache: Record<string, RedditPost[]>; // Cache by subreddit|sort
  lastFetched: Record<string, number>; // Track when each subreddit|sort was last fetched
}

// Action types
type RedditAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_POSTS'; payload: { subreddit: string; posts: RedditPost[] } }
  | { type: 'SET_ACTIVE_SUBREDDIT'; payload: string }
  | { type: 'SET_ACTIVE_SORT'; payload: string }
  | { type: 'TOGGLE_POST_EXPANSION'; payload: string }
  | { type: 'CLEAR_ERROR' };

// Initial state
const initialState: RedditState = {
  posts: [],
  loading: false,
  error: null,
  activeSubreddit: SUBREDDITS[0].id,
  activeSort: SORT_OPTIONS[0].id,
  expandedPosts: new Set(),
  cache: {},
  lastFetched: {},
};

// Reducer function
const redditReducer = (state: RedditState, action: RedditAction): RedditState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_POSTS':
      return {
        ...state,
        posts: action.payload.posts,
        loading: false,
        error: null,
        cache: {
          ...state.cache,
          [action.payload.subreddit]: action.payload.posts
        },
        lastFetched: {
          ...state.lastFetched,
          [action.payload.subreddit]: Date.now()
        }
      };
    
    case 'SET_ACTIVE_SUBREDDIT':
      return { ...state, activeSubreddit: action.payload };
    
    case 'SET_ACTIVE_SORT':
      return { ...state, activeSort: action.payload };
    
    case 'TOGGLE_POST_EXPANSION':
      const newExpanded = new Set(state.expandedPosts);
      if (newExpanded.has(action.payload)) {
        newExpanded.delete(action.payload);
      } else {
        newExpanded.add(action.payload);
      }
      return { ...state, expandedPosts: newExpanded };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Sort functions
const sortPosts = (posts: RedditPost[], sortType: string): RedditPost[] => {
  const sorted = [...posts];
  switch (sortType) {
    case 'new':
      return sorted.sort((a, b) => b.created - a.created);
    case 'top':
      return sorted.sort((a, b) => b.score - a.score);
    case 'hot':
    default:
      return sorted;
  }
};

const RedditWidget: React.FC<RedditWidgetProps> = ({ 
  width = 'half', 
  onRefresh, 
  onMoveTop, 
  onMoveBottom, 
  onToggleWidth, 
  onHide, 
  dragHandleProps 
}) => {
  const { state: globalState, dispatch: globalDispatch } = useDashboardData();
  const [state, dispatch] = useReducer(redditReducer, initialState);

  // Check if we need to fetch data for a subreddit
  const needsFetch = useCallback((subreddit: string) => {
    const lastFetched = state.lastFetched[subreddit];
    const cacheAge = Date.now() - (lastFetched || 0);
    const fiveMinutes = 5 * 60 * 1000;
    
    return !state.cache[subreddit] || cacheAge > fiveMinutes;
  }, [state.cache, state.lastFetched]);

  // Fetch posts for a subreddit and sort
  const fetchPosts = useCallback(async (subreddit: string, sort: string) => {
    const cacheKey = `${subreddit}|${sort}`;
    if (!needsFetch(cacheKey)) {
      const cachedPosts = state.cache[cacheKey];
      dispatch({ type: 'SET_POSTS', payload: { subreddit: cacheKey, posts: cachedPosts } });
      return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });
    try {
      const data = await getRedditPosts(subreddit, sort);
      dispatch({ type: 'SET_POSTS', payload: { subreddit: cacheKey, posts: data } });
      globalDispatch({ type: 'SET_REDDIT_POSTS', payload: data });
    } catch (error) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Failed to fetch Reddit posts' 
      });
    }
  }, [needsFetch]);

  // Handle subreddit change
  const handleSubredditChange = useCallback((subreddit: string) => {
    dispatch({ type: 'SET_ACTIVE_SUBREDDIT', payload: subreddit });
  }, []);

  // Handle sort change
  const handleSortChange = useCallback((sort: string) => {
    dispatch({ type: 'SET_ACTIVE_SORT', payload: sort });
  }, []);

  // Handle post expansion toggle
  const togglePostExpansion = useCallback((postId: string) => {
    dispatch({ type: 'TOGGLE_POST_EXPANSION', payload: postId });
  }, []);

  // Effect to fetch data when subreddit or sort changes
  useEffect(() => {
    const cacheKey = `${state.activeSubreddit}|${state.activeSort}`;
    const lastFetched = state.lastFetched[cacheKey];
    const cacheAge = Date.now() - (lastFetched || 0);
    const fiveMinutes = 5 * 60 * 1000;
    const cachedPosts = state.cache[cacheKey];
    if (!cachedPosts || cacheAge > fiveMinutes) {
      fetchPosts(state.activeSubreddit, state.activeSort);
    } else {
      dispatch({ type: 'SET_POSTS', payload: { subreddit: cacheKey, posts: cachedPosts } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.activeSubreddit, state.activeSort]);

  const formatTime = (timestamp: number) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      return `${Math.floor(diff / 60)}m ago`;
    } else if (diff < 86400) {
      return `${Math.floor(diff / 3600)}h ago`;
    } else {
      return `${Math.floor(diff / 86400)}d ago`;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getPostType = (post: RedditPost) => {
    if (post.thumbnail && post.thumbnail !== 'self' && post.thumbnail !== 'default') {
      return 'image';
    }
    if (post.content) {
      return 'text';
    }
    return 'link';
  };

  // Manual refresh function
  const handleRefresh = useCallback(() => {
    // Clear cache for current subreddit/sort to force fresh fetch
    const cacheKey = `${state.activeSubreddit}|${state.activeSort}`;
    const newCache = { ...state.cache };
    delete newCache[cacheKey];
    dispatch({ type: 'SET_LOADING', payload: true });
    fetchPosts(state.activeSubreddit, state.activeSort);
  }, [state.activeSubreddit, state.activeSort, fetchPosts]);

  if (state.loading) {
    return (
      <WidgetContainer
        title="Reddit"
        width={width}
        onRefresh={handleRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      >
        <div className="animate-pulse p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="flex space-x-4">
                <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </WidgetContainer>
    );
  }

  return (
    <WidgetContainer
      title="Reddit"
      width={width}
      onRefresh={handleRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="p-4">
        {/* Subreddit Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-hide mb-4">
          <ul className="flex flex-nowrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400 whitespace-nowrap min-w-full">
            {SUBREDDITS.map(subreddit => (
              <li key={subreddit.id} className="me-2">
                <button
                  onClick={() => handleSubredditChange(subreddit.id)}
                  className={`inline-flex items-center justify-center p-4 border-b-2 rounded-t-lg transition-colors whitespace-nowrap ${
                    state.activeSubreddit === subreddit.id
                      ? 'text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500'
                      : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                  }`}
                >
                  {subreddit.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Sort Options */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SORT_OPTIONS.map(sort => {
            const IconComponent = sort.icon;
            return (
              <button
                key={sort.id}
                onClick={() => handleSortChange(sort.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all duration-200 flex items-center gap-1.5 font-medium ${
                  state.activeSort === sort.id
                    ? 'bg-green-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <IconComponent className="h-3.5 w-3.5" />
                {sort.label}
              </button>
            );
          })}
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto overflow-x-hidden">
          {state.error ? (
            <div className="text-center py-8 text-red-500">
              <p className="font-medium text-lg mb-2">Reddit API Error</p>
              <p className="text-sm text-gray-500 mb-4">{state.error}</p>
              <button 
                onClick={handleRefresh}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Retry
              </button>
            </div>
          ) : state.posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-lg font-medium mb-2">No posts available</p>
              <p className="text-sm">Try switching subreddits or sorting options</p>
            </div>
          ) : (
            state.posts.map((post) => {
              const postType = getPostType(post);
              const isExpanded = state.expandedPosts.has(post.id);
              
              return (
                <div
                  key={post.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  {/* Post Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
                          >
                            {post.title}
                            <ArrowUpRight className="h-4 w-4 inline-block ml-1" />
                          </a>
                        </h3>
                        
                        {/* Post Type Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {postType === 'image' && <ImageIcon className="h-3 w-3 mr-1" />}
                            {postType === 'link' && <LinkIcon className="h-3 w-3 mr-1" />}
                            {postType === 'text' && <MessageCircle className="h-3 w-3 mr-1" />}
                            {postType === 'image' ? 'Image' : postType === 'link' ? 'Link' : 'Text'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {post.subreddit}
                          </span>
                        </div>
                      </div>
                      
                      {/* Thumbnail */}
                      {post.thumbnail && (
                        <div className="flex-shrink-0 ml-3">
                          <img 
                            src={post.thumbnail} 
                            alt={post.title}
                            className="w-16 h-16 object-cover rounded-lg"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Post Content */}
                    {post.content && (
                      <div className="mb-3">
                        <p className={`text-xs text-gray-600 dark:text-gray-400 leading-relaxed ${
                          isExpanded ? '' : 'line-clamp-2'
                        }`}>
                          {post.content}
                        </p>
                        {post.content.length > 150 && (
                          <button
                            onClick={() => togglePostExpansion(post.id)}
                            className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1 flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3" />
                                Show less
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3" />
                                Read more
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Post Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{post.author}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatTime(post.created)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          <span className="font-medium">{formatNumber(post.score)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span className="font-medium">{formatNumber(post.numComments)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </WidgetContainer>
  );
};

export default RedditWidget;