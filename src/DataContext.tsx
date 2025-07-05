import React, { createContext, useReducer, useContext, ReactNode, Dispatch } from 'react';
import { WeatherData, NewsItem, TrafficData, Event, RedditPost, MarketData } from './types';

// Example state slices (expand as needed)
interface DashboardState {
  weather: WeatherData | null;
  news: NewsItem[] | null;
  traffic: TrafficData | null;
  events: Event[] | null;
  reddit: {
    posts: RedditPost[];
    loading: boolean;
    error: string | null;
  };
  market: MarketData | null;
  // Add phillyData, septa, etc. as needed
}

const initialState: DashboardState = {
  weather: null,
  news: null,
  traffic: null,
  events: null,
  reddit: { posts: [], loading: false, error: null },
  market: null,
};

// Action types
export type DashboardAction =
  | { type: 'SET_WEATHER'; payload: WeatherData }
  | { type: 'SET_NEWS'; payload: NewsItem[] }
  | { type: 'SET_TRAFFIC'; payload: TrafficData }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'SET_REDDIT_POSTS'; payload: RedditPost[] }
  | { type: 'SET_REDDIT_LOADING'; payload: boolean }
  | { type: 'SET_REDDIT_ERROR'; payload: string | null }
  | { type: 'SET_MARKET'; payload: MarketData };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_WEATHER':
      return { ...state, weather: action.payload };
    case 'SET_NEWS':
      return { ...state, news: action.payload };
    case 'SET_TRAFFIC':
      return { ...state, traffic: action.payload };
    case 'SET_EVENTS':
      return { ...state, events: action.payload };
    case 'SET_REDDIT_POSTS':
      return { ...state, reddit: { ...state.reddit, posts: action.payload } };
    case 'SET_REDDIT_LOADING':
      return { ...state, reddit: { ...state.reddit, loading: action.payload } };
    case 'SET_REDDIT_ERROR':
      return { ...state, reddit: { ...state.reddit, error: action.payload } };
    case 'SET_MARKET':
      return { ...state, market: action.payload };
    default:
      return state;
  }
}

// Context
const DataContext = createContext<{
  state: DashboardState;
  dispatch: Dispatch<DashboardAction>;
}>({ state: initialState, dispatch: () => undefined });

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useDashboardData = () => useContext(DataContext); 