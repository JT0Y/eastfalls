// Services for fetching data from APIs

import { WeatherData, TobaccoPermit, TobaccoPermitData, Demolition, DemolitionData, BusDetour, BusDetourData, SeptaAlert, SeptaAlertData, ElevatorOutage, ElevatorOutageData, Landmark, LandmarkData, NewsItem, TrafficData, SystemInfo, RedditPost, Event, MarketData, Property, BuildingPermit, SmartHomeDevice, BusLocation } from '../types';

// Tobacco Retailer Permits API
export const getTobaccoPermits = async (zipCode: string = '19129'): Promise<TobaccoPermitData> => {
  try {
    const url = `https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Tobacco_Retailer_Permits/FeatureServer/0/query?where=ZIP_CODE='${zipCode}'&outFields=BUSINESS_NAME,STREET_ADDRESS,PERMIT_YEAR,LATITUDE,LONGITUDE&f=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.features) {
      throw new Error('Invalid response format from ArcGIS API');
    }

    const permits: TobaccoPermit[] = data.features.map((feature: any, index: number) => {
      const attributes = feature.attributes;
      return {
        id: `permit-${index}`,
        businessName: attributes.BUSINESS_NAME || 'Unknown Business',
        streetAddress: attributes.STREET_ADDRESS || 'Unknown Address',
        permitYear: attributes.PERMIT_YEAR || 'Unknown',
        latitude: attributes.LATITUDE || 0,
        longitude: attributes.LONGITUDE || 0,
        zipCode: zipCode,
      };
    });

    return {
      permits,
      totalCount: permits.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching tobacco permits:', error);
    
    // Fallback to mock data if API fails
    const mockPermits: TobaccoPermit[] = [
      {
        id: 'permit-1',
        businessName: 'Corner Store',
        streetAddress: '123 Main St',
        permitYear: '2024',
        latitude: 40.0094,
        longitude: -75.1333,
        zipCode: zipCode,
      },
      {
        id: 'permit-2',
        businessName: 'Gas Station Market',
        streetAddress: '456 Oak Ave',
        permitYear: '2024',
        latitude: 40.0095,
        longitude: -75.1334,
        zipCode: zipCode,
      },
      {
        id: 'permit-3',
        businessName: 'Convenience Mart',
        streetAddress: '789 Pine St',
        permitYear: '2023',
        latitude: 40.0096,
        longitude: -75.1335,
        zipCode: zipCode,
      },
    ];

    return {
      permits: mockPermits,
      totalCount: mockPermits.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Building Demolitions API
export const getDemolitions = async (zipCode: string = '19129'): Promise<DemolitionData> => {
  try {
    // Using the Carto API for demolitions
    const url = `https://phl.carto.com/api/v2/sql?q=SELECT address, demolition_date, reason, latitude, longitude FROM demolitions WHERE zip_code = '${zipCode}' ORDER BY demolition_date DESC LIMIT 50`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.rows) {
      throw new Error('Invalid response format from Carto API');
    }

    const demolitions: Demolition[] = data.rows.map((row: any, index: number) => ({
      id: `demolition-${index}`,
      address: row.address || 'Unknown Address',
      demolitionDate: row.demolition_date || 'Unknown',
      reason: row.reason || 'Unknown',
      latitude: row.latitude || 0,
      longitude: row.longitude || 0,
      zipCode: zipCode,
    }));

    return {
      demolitions,
      totalCount: demolitions.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching demolitions:', error);
    
    // Fallback to mock data if API fails
    const mockDemolitions: Demolition[] = [
      {
        id: 'demolition-1',
        address: '123 Old Building St',
        demolitionDate: '2024-01-15',
        reason: 'Structural Issues',
        latitude: 40.0094,
        longitude: -75.1333,
        zipCode: zipCode,
      },
      {
        id: 'demolition-2',
        address: '456 Vacant Lot Ave',
        demolitionDate: '2024-02-20',
        reason: 'Development',
        latitude: 40.0095,
        longitude: -75.1334,
        zipCode: zipCode,
      },
    ];

    return {
      demolitions: mockDemolitions,
      totalCount: mockDemolitions.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Bus Detours API
export const getBusDetours = async (): Promise<BusDetourData> => {
  try {
    const url = 'https://www3.septa.org/api/BusDetours/';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from SEPTA API');
    }

    const detours: BusDetour[] = data.flatMap((route: any) => 
      route.route_info.map((detour: any, index: number) => ({
        id: `detour-${route.route_id}-${index}`,
        routeId: route.route_id,
        routeDirection: detour.route_direction,
        reason: detour.reason,
        startLocation: detour.start_location,
        endLocation: detour.end_location,
        startDateTime: detour.start_date_time,
        endDateTime: detour.end_date_time,
        currentMessage: detour.current_message,
      }))
    );

    return {
      detours,
      totalCount: detours.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching bus detours:', error);
    
    // Fallback to mock data if API fails
    const mockDetours: BusDetour[] = [
      {
        id: 'detour-1',
        routeId: '1',
        routeDirection: 'NB',
        reason: 'Construction',
        startLocation: 'Main St & Oak Ave',
        endLocation: 'Main St & Pine St',
        startDateTime: '2024-01-15 6:00 AM',
        endDateTime: '2024-02-15 6:00 PM',
        currentMessage: 'Route 1 Northbound detoured due to construction',
      },
      {
        id: 'detour-2',
        routeId: '2',
        routeDirection: 'SB',
        reason: 'Road Work',
        startLocation: 'Broad St & Market St',
        endLocation: 'Broad St & South St',
        startDateTime: '2024-01-20 7:00 AM',
        endDateTime: '2024-01-25 7:00 PM',
        currentMessage: 'Route 2 Southbound detoured due to road work',
      },
    ];

    return {
      detours: mockDetours,
      totalCount: mockDetours.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Weather API
export const getWeatherData = async (zipCode: string): Promise<WeatherData> => {
  try {
    console.log('Fetching weather data for ZIP:', zipCode);
    
    // Convert ZIP code to coordinates (using Philadelphia coordinates as default)
    const coordinates = await getCoordinatesFromZip(zipCode);
    console.log('Using coordinates:', coordinates);
    
    // Step 1: Get forecast office and grid coordinates
    const pointsUrl = `https://api.weather.gov/points/${coordinates.lat},${coordinates.lon}`;
    console.log('Fetching points from:', pointsUrl);
    
    // Use CORS proxy to avoid CORS issues
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(pointsUrl)}`;
    console.log('Using proxy URL:', proxyUrl);
    
    const pointsResponse = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/geo+json',
        'User-Agent': 'EastFalls-Dashboard/1.0'
      }
    });
    
    if (!pointsResponse.ok) {
      throw new Error(`Failed to get weather points data: ${pointsResponse.status}`);
    }
    
    const pointsData = await pointsResponse.json();
    console.log('Points data received:', pointsData);
    
    const forecastUrl = pointsData.properties.forecast;
    console.log('Forecast URL:', forecastUrl);
    
    // Step 2: Get the actual forecast
    // Use CORS proxy for forecast URL as well
    const forecastProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(forecastUrl)}`;
    console.log('Using forecast proxy URL:', forecastProxyUrl);
    
    const forecastResponse = await fetch(forecastProxyUrl, {
      headers: {
        'Accept': 'application/geo+json',
        'User-Agent': 'EastFalls-Dashboard/1.0'
      }
    });
    
    if (!forecastResponse.ok) {
      throw new Error(`Failed to get forecast data: ${forecastResponse.status}`);
    }
    
    const forecastData = await forecastResponse.json();
    console.log('Forecast data received:', forecastData);
    
    const periods = forecastData.properties.periods;
    console.log('Number of periods:', periods.length);
    
    // Process the forecast data
    const currentPeriod = periods.find((period: any) => period.isDaytime);
    const forecast = periods
      .filter((period: any) => period.isDaytime)
      .slice(0, 7)
      .map((period: any, index: number) => ({
        day: index === 0 ? 'Today' : new Date(period.startTime).toLocaleDateString('en-US', { weekday: 'short' }),
        fullDay: index === 0 ? 'Today' : new Date(period.startTime).toLocaleDateString('en-US', { weekday: 'long' }),
        condition: period.shortForecast,
        icon: getWeatherIconFromDescription(period.shortForecast),
        high: Math.round(period.temperature),
        low: Math.round(period.temperature), // NWS doesn't provide separate low temps in this format
      }));
    
    // Get current conditions (first period)
    const current = periods[0];
    console.log('Current weather:', current);
    
    const weatherData = {
      temperature: Math.round(current.temperature),
      condition: current.shortForecast,
      icon: getWeatherIconFromDescription(current.shortForecast),
      feelsLike: Math.round(current.temperature), // NWS doesn't provide feels like
      humidity: 60, // NWS doesn't provide humidity in this endpoint
      windSpeed: parseInt(current.windSpeed.split(' ')[0]) || 5,
      forecast,
    };
    
    console.log('Processed weather data:', weatherData);
    return weatherData;
    
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Instead of falling back to mock data, throw the error to show the real issue
    throw new Error(`Weather API failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

// Helper function to convert ZIP code to coordinates
const getCoordinatesFromZip = async (zipCode: string): Promise<{ lat: number; lon: number }> => {
  // For now, use Philadelphia coordinates as default
  // In a real app, you'd use a geocoding service
  return { lat: 40.0142, lon: -75.1839 };
};

// Helper function to map weather descriptions to icons
const getWeatherIconFromDescription = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('sunny') || desc.includes('clear')) {
    return 'sun';
  } else if (desc.includes('partly cloudy') || desc.includes('mostly cloudy')) {
    return 'cloud-sun';
  } else if (desc.includes('cloudy') || desc.includes('overcast')) {
    return 'cloud';
  } else if (desc.includes('rain') || desc.includes('showers')) {
    return 'cloud-rain';
  } else if (desc.includes('snow')) {
    return 'cloud-snow';
  } else if (desc.includes('thunder') || desc.includes('storm')) {
    return 'cloud-lightning';
  } else {
    return 'cloud-sun';
  }
};

// News API - Using mock data for production
export const getNewsData = async (zipCode: string): Promise<NewsItem[]> => {
  // Return realistic mock news data
  const mockNews = [
    {
      id: 'news-1',
      title: 'Philadelphia Weather Update: Partly Cloudy Skies Expected This Week',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/weather',
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/209831/pexels-photo-209831.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'news-2',
      title: 'Local Community Event Brings East Falls Neighbors Together',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/news/local',
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/1157557/pexels-photo-1157557.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'news-3',
      title: 'SEPTA Transportation Updates Affect Philadelphia Commuters',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/news/local',
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'news-4',
      title: 'New Restaurant Opens in Manayunk, Features Local Ingredients',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/news/local',
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/262978/pexels-photo-262978.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'news-5',
      title: 'Philadelphia Parks Department Announces Spring Events',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/news/local',
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/1619317/pexels-photo-1619317.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 'news-6',
      title: 'Local Business District Sees Growth in Small Enterprises',
      source: 'NBC Philadelphia',
      url: 'https://www.nbcphiladelphia.com/news/local',
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      imageUrl: 'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  return mockNews.slice(0, 8);
};

// Traffic API
export const getTrafficData = async (zipCode: string): Promise<TrafficData> => {
  // Generate realistic traffic data based on time of day
  const hour = new Date().getHours();
  let status: 'light' | 'moderate' | 'heavy';
  let commuteTime: number;
  
  // Rush hour logic
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) {
    status = Math.random() > 0.3 ? 'heavy' : 'moderate';
    commuteTime = 35 + Math.floor(Math.random() * 15);
  } else if (hour >= 10 && hour <= 16) {
    status = Math.random() > 0.5 ? 'moderate' : 'light';
    commuteTime = 20 + Math.floor(Math.random() * 10);
  } else {
    status = 'light';
    commuteTime = 15 + Math.floor(Math.random() * 8);
  }

  const incidents = [];
  
  // Randomly add incidents based on traffic status
  if (status === 'heavy' && Math.random() > 0.4) {
    incidents.push({
      id: 't1',
      type: 'accident',
      description: 'Multiple vehicle accident causing delays',
      location: 'I-76 Eastbound near Montgomery Drive',
    });
  }
  
  if (Math.random() > 0.6) {
    incidents.push({
      id: 't2',
      type: 'construction',
      description: 'Road work - single lane closure',
      location: 'Ridge Ave between Midvale and Calumet',
    });
  }

  return {
    status,
    commuteTime,
    incidents,
  };
};

// System Information API
export const getSystemInfo = async (): Promise<SystemInfo> => {
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const memory = (performance as any).memory;
  const timing = performance.timing;
  const resources = performance.getEntriesByType('resource');

  // Calculate performance metrics
  const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
  const domainLookupTime = timing.domainLookupEnd - timing.domainLookupStart;
  const serverResponseTime = timing.responseEnd - timing.requestStart;
  const pageRenderTime = timing.domComplete - timing.domLoading;

  return {
    browser: {
      name: navigator.userAgent.includes('Firefox') ? 'Firefox' : 
             navigator.userAgent.includes('Chrome') ? 'Chrome' : 
             navigator.userAgent.includes('Safari') ? 'Safari' : 
             navigator.userAgent.includes('Edge') ? 'Edge' : 'Unknown',
      version: navigator.appVersion,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack,
      vendor: navigator.vendor,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: (navigator as any).deviceMemory,
      pdfViewerEnabled: (navigator as any).pdfViewerEnabled,
    },
    screen: {
      width: window.screen.width,
      height: window.screen.height,
      colorDepth: window.screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      orientation: {
        type: screen.orientation.type,
        angle: screen.orientation.angle,
      },
    },
    network: {
      type: connection?.type,
      downlink: connection?.downlink,
      rtt: connection?.rtt,
      effectiveType: connection?.effectiveType,
      online: navigator.onLine,
      saveData: connection?.saveData,
    },
    memory: memory ? {
      total: memory.totalJSHeapSize,
      used: memory.usedJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    } : undefined,
    performance: {
      pageLoadTime,
      resourceCount: resources.length,
      domainLookupTime,
      serverResponseTime,
      pageRenderTime,
    },
  };
};

// Reddit API
export const getRedditPosts = async (subreddit: string = 'philadelphia', sort: string = 'hot'): Promise<RedditPost[]> => {
  try {
    console.log('Fetching Reddit posts for subreddit:', subreddit, 'sort:', sort);
    // Use Reddit JSON API via CORS proxy
    const redditUrl = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=25`;
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(redditUrl)}`;
    console.log('Reddit JSON Proxy URL:', proxyUrl);
    const response = await fetch(proxyUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    if (!response.ok) {
      throw new Error(`Reddit JSON API failed: ${response.status}`);
    }
    const jsonText = await response.text();
    return parseRedditJSON(jsonText, subreddit);
  } catch (error) {
    console.error('Error fetching Reddit posts:', error);
    // Fallback to mock data for development
    return getMockRedditPosts(subreddit, sort);
  }
};

// Helper function to parse Reddit JSON
const parseRedditJSON = (jsonText: string, subreddit: string): RedditPost[] => {
  try {
    const data = JSON.parse(jsonText);
    const posts = data.data.children.map((child: any) => child.data);
    return posts.map((post: any, index: number) => {
      // Extract thumbnail
      let thumbnail: string | undefined = undefined;
      if (post.preview && post.preview.images && post.preview.images.length > 0) {
        thumbnail = post.preview.images[0].source.url;
      } else if (post.thumbnail && post.thumbnail.startsWith('http')) {
        thumbnail = post.thumbnail;
      }
      // Clean up selftext content
      let content = '';
      if (post.selftext) {
        content = post.selftext.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      return {
        id: post.id || `reddit-${index}`,
        title: post.title || '',
        url: `https://www.reddit.com${post.permalink}`,
        score: post.score || 0,
        numComments: post.num_comments || 0,
        created: post.created_utc || Date.now() / 1000,
        subreddit: `r/${subreddit}`,
        author: post.author || '',
        content: content,
        thumbnail: thumbnail,
      };
    });
  } catch (error) {
    console.error('Error parsing Reddit JSON:', error);
    throw new Error('Failed to parse Reddit JSON response');
  }
};

// Mock Reddit data for development
const getMockRedditPosts = (subreddit: string, sort: string): RedditPost[] => {
  const mockPosts: RedditPost[] = [
    {
      id: 'mock-1',
      title: 'Best cheesesteak in Philadelphia? Looking for recommendations!',
      url: 'https://www.reddit.com/r/philadelphia/comments/mock1',
      score: 156,
      numComments: 23,
      created: Date.now() / 1000 - 3600 * 2, // 2 hours ago
      subreddit: `r/${subreddit}`,
      author: 'phillyfoodie',
      content: 'I\'m visiting Philadelphia for the first time and want to try the best cheesesteak. Any recommendations for authentic places?',
      thumbnail: 'https://via.placeholder.com/150x150/FF6B6B/FFFFFF?text=🍖',
    },
    {
      id: 'mock-2',
      title: 'Beautiful sunset over the Philadelphia skyline tonight',
      url: 'https://www.reddit.com/r/philadelphia/comments/mock2',
      score: 89,
      numComments: 12,
      created: Date.now() / 1000 - 3600 * 4, // 4 hours ago
      subreddit: `r/${subreddit}`,
      author: 'skyline_photographer',
      content: 'Caught this amazing view from the Art Museum steps. The city looks magical at golden hour!',
      thumbnail: 'https://via.placeholder.com/150x150/4ECDC4/FFFFFF?text=🌅',
    },
    {
      id: 'mock-3',
      title: 'New restaurant opening in Fishtown - anyone tried it yet?',
      url: 'https://www.reddit.com/r/philadelphia/comments/mock3',
      score: 67,
      numComments: 18,
      created: Date.now() / 1000 - 3600 * 6, // 6 hours ago
      subreddit: `r/${subreddit}`,
      author: 'fishtown_local',
      content: 'Saw a new place opening on Frankford Ave. Has anyone been there yet? Looking for reviews before I try it.',
      thumbnail: 'https://via.placeholder.com/150x150/45B7D1/FFFFFF?text=🍽️',
    },
    {
      id: 'mock-4',
      title: 'SEPTA delays this morning - what\'s going on?',
      url: 'https://www.reddit.com/r/philadelphia/comments/mock4',
      score: 234,
      numComments: 45,
      created: Date.now() / 1000 - 3600 * 1, // 1 hour ago
      subreddit: `r/${subreddit}`,
      author: 'commuter_problems',
      content: 'Anyone else experiencing major delays on the Market-Frankford line? Been waiting 20 minutes for a train.',
      thumbnail: 'https://via.placeholder.com/150x150/96CEB4/FFFFFF?text=🚇',
    },
    {
      id: 'mock-5',
      title: 'Weekend events in Philadelphia - what\'s happening?',
      url: 'https://www.reddit.com/r/philadelphia/comments/mock5',
      score: 123,
      numComments: 31,
      created: Date.now() / 1000 - 3600 * 8, // 8 hours ago
      subreddit: `r/${subreddit}`,
      author: 'weekend_planner',
      content: 'Looking for fun things to do this weekend. Any festivals, concerts, or events happening?',
      thumbnail: 'https://via.placeholder.com/150x150/FFEAA7/FFFFFF?text=🎉',
    },
  ];
  
  // Sort mock data based on sort parameter
  if (sort === 'new') {
    mockPosts.sort((a, b) => b.created - a.created);
  } else if (sort === 'top') {
    mockPosts.sort((a, b) => b.score - a.score);
  }
  // 'hot' is default order
  
  return mockPosts;
};

function decodeHtmlEntities(str: string): string {
  const txt = typeof window !== 'undefined' ? document.createElement('textarea') : null;
  if (txt) {
    txt.innerHTML = str;
    return txt.value;
  }
  // Fallback for SSR: basic replacements
  return str.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'");
}

export const getMarketData = async (): Promise<MarketData> => {
  // Generate realistic market data with some randomness
  const basePrice = 5137.08;
  const randomChange = (Math.random() - 0.5) * 100; // Random change between -50 and +50
  const currentPrice = basePrice + randomChange;
  const changePercent = (randomChange / basePrice) * 100;

  return {
    sp500: {
      price: currentPrice,
      change: randomChange,
      changePercent: changePercent,
      history: Array.from({ length: 100 }, (_, i) => ({
        timestamp: Date.now() - (99 - i) * 5 * 60 * 1000, // 5-minute intervals
        price: currentPrice + (Math.random() - 0.5) * 20,
      })),
    },
    fearGreedIndex: {
      value: 50 + Math.floor(Math.random() * 40), // Random between 50-90
      rating: ['Fear', 'Neutral', 'Greed', 'Extreme Greed'][Math.floor(Math.random() * 4)] as any,
      previousClose: 63,
      previousWeek: 60,
      previousMonth: 55,
    },
    mortgageRates: {
      thirtyYear: 6.5 + Math.random() * 0.8, // Random between 6.5-7.3%
      fifteenYear: 5.8 + Math.random() * 0.6, // Random between 5.8-6.4%
      fiveOneArm: 6.0 + Math.random() * 0.8, // Random between 6.0-6.8%
      lastUpdated: new Date().toISOString(),
    },
  };
};

// Helper function to parse RSS XML
const parseRSSXML = (xmlText: string): Event[] => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  
  // Check for parsing errors
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Failed to parse RSS XML');
  }
  
  const items = xmlDoc.querySelectorAll('item');
  console.log('Found RSS items:', items.length);
  const events: Event[] = [];
  
  items.forEach((item, index) => {
    const title = item.querySelector('title')?.textContent?.trim() || '';
    const link = item.querySelector('link')?.textContent?.trim() || '';
    const description = item.querySelector('description')?.textContent?.trim() || '';
    const pubDate = item.querySelector('pubDate')?.textContent?.trim() || '';
    const creator = item.querySelector('dc\\:creator')?.textContent?.trim() || item.querySelector('creator')?.textContent?.trim() || 'PhillyVoice';
    
    // Extract categories
    const categoryElements = item.querySelectorAll('category');
    const categories = Array.from(categoryElements).map(cat => cat.textContent?.trim() || '');
    console.log('Event categories:', categories);
    
    // Extract media thumbnail
    const mediaThumbnail = item.querySelector('media\\:thumbnail') || item.querySelector('thumbnail');
    const imageUrl = mediaThumbnail?.getAttribute('url') || undefined;
    
    // Determine category based on RSS categories
    let eventCategory: Event['category'] = 'other';
    if (categories.some(cat => cat.toLowerCase().includes('concert') || cat.toLowerCase().includes('music') || cat.toLowerCase().includes('dj'))) {
      eventCategory = 'concert';
    } else if (categories.some(cat => cat.toLowerCase().includes('festival') || cat.toLowerCase().includes('festivals'))) {
      eventCategory = 'festival';
    } else if (categories.some(cat => cat.toLowerCase().includes('sport') || cat.toLowerCase().includes('sports'))) {
      eventCategory = 'sports';
    } else if (categories.some(cat => cat.toLowerCase().includes('tech') || cat.toLowerCase().includes('technology'))) {
      eventCategory = 'tech';
    } else if (categories.some(cat => cat.toLowerCase().includes('community') || cat.toLowerCase().includes('charity'))) {
      eventCategory = 'community';
    } else if (categories.some(cat => cat.toLowerCase().includes('entertainment') || cat.toLowerCase().includes('events'))) {
      eventCategory = 'entertainment';
    } else if (categories.some(cat => cat.toLowerCase().includes('pride') || cat.toLowerCase().includes('lgbtq'))) {
      eventCategory = 'pride';
    } else if (categories.some(cat => cat.toLowerCase().includes('health') || cat.toLowerCase().includes('wellness'))) {
      eventCategory = 'health';
    } else if (categories.some(cat => cat.toLowerCase().includes('outdoors') || cat.toLowerCase().includes('outdoor'))) {
      eventCategory = 'outdoors';
    } else if (categories.some(cat => cat.toLowerCase().includes('education') || cat.toLowerCase().includes('environmental') || cat.toLowerCase().includes('schuylkill'))) {
      eventCategory = 'education';
    } else if (categories.some(cat => cat.toLowerCase().includes('family') || cat.toLowerCase().includes('family-friendly'))) {
      eventCategory = 'family';
    } else if (categories.some(cat => cat.toLowerCase().includes('holiday') || cat.toLowerCase().includes('juneteenth'))) {
      eventCategory = 'holiday';
    }
    
    if (title && link) {
      events.push({
        id: `pv-event-${index}`,
        title,
        description,
        date: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
        location: 'Philadelphia Area', // RSS doesn't provide specific location
        category: eventCategory,
        source: 'PhillyVoice',
        url: link,
        imageUrl,
      });
    }
  });
  
  console.log('Parsed events:', events.length);
  return events;
};

// Events API - Using Vite proxy to avoid CORS issues
export const getLocalEvents = async (zipCode: string, category: string = 'all'): Promise<Event[]> => {
  try {
    // Use Vite proxy to avoid CORS issues
    const response = await fetch('/api/phillyvoice/feed/section/events/', {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (compatible; Dashboard/1.0)',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xmlText = await response.text();
    console.log('RSS XML length:', xmlText.length);
    const events = parseRSSXML(xmlText);
    
    // Filter by category if not 'all'
    const filteredEvents = category !== 'all' 
      ? events.filter(event => event.category === category)
      : events;
    
    console.log('Final events returned:', filteredEvents.length);
    return filteredEvents; // Return all events, no limit
    
  } catch (error) {
    console.error('Error fetching events from PhillyVoice RSS:', error);
    
    // Return empty array instead of mock data
    return [];
  }
};

export const getExpensiveProperties = async (zipCode: string): Promise<Property[]> => {
  // Return mock property data since the Carto API requires specific configuration
  return [
    {
      cartodb_id: 1,
      market_value: 850000,
      total_livable_area: 2400,
      year_built: 1925,
      street_address: '123 RIDGE AVE',
      zip_code: zipCode,
      building_code_description: 'SINGLE FAMILY',
      owner_1: 'PRIVATE OWNER',
    },
    {
      cartodb_id: 2,
      market_value: 720000,
      total_livable_area: 2100,
      year_built: 1930,
      street_address: '456 MIDVALE AVE',
      zip_code: zipCode,
      building_code_description: 'SINGLE FAMILY',
      owner_1: 'PRIVATE OWNER',
    },
    {
      cartodb_id: 3,
      market_value: 680000,
      total_livable_area: 1950,
      year_built: 1928,
      street_address: '789 CALUMET ST',
      zip_code: zipCode,
      building_code_description: 'SINGLE FAMILY',
      owner_1: 'PRIVATE OWNER',
    },
  ];
};

export const getRecentPermits = async (zipCode: string): Promise<BuildingPermit[]> => {
  // Return mock permit data since the Carto API requires specific configuration
  return [
    {
      cartodb_id: 1,
      permitnumber: 'BP-2025-001',
      permitdescription: 'RESIDENTIAL ADDITION',
      permittype: 'BUILDING',
      street_address: '123 RIDGE AVE',
      zip_code: zipCode,
      issue_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ISSUED',
      estimated_cost: 45000,
    },
    {
      cartodb_id: 2,
      permitnumber: 'BP-2025-002',
      permitdescription: 'KITCHEN RENOVATION',
      permittype: 'BUILDING',
      street_address: '456 MIDVALE AVE',
      zip_code: zipCode,
      issue_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'COMPLETED',
      estimated_cost: 25000,
    },
  ];
};

export const getSmartHomeDevices = async (): Promise<SmartHomeDevice[]> => {
  // Return mock smart home devices data
  return [
    {
      id: 'device-1',
      name: 'Living Room Speaker',
      type: 'speaker',
      status: 'active',
      castingStatus: {
        isPlaying: true,
        title: 'Smooth Jazz Playlist',
        artist: 'Various Artists',
        albumArt: 'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=100',
        progress: 125,
        duration: 240,
      },
    },
    {
      id: 'device-2',
      name: 'Kitchen Display',
      type: 'speaker',
      status: 'online',
    },
    {
      id: 'device-3',
      name: 'Security Camera',
      type: 'camera',
      status: 'online',
      batteryLevel: 85,
    },
  ];
};

// SEPTA Alerts API
export const getSeptaAlerts = async (): Promise<SeptaAlertData> => {
  try {
    // Use a CORS proxy to bypass CORS restrictions
    const url = 'https://www3.septa.org/api/Alerts/get_alert_data.php';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    console.log('Fetching SEPTA alerts from:', proxyUrl);
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('SEPTA API response length:', data?.length || 0);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from SEPTA Alerts API');
    }

    // Debug: Count alerts with and without messages
    const alertsWithMessages = data.filter((alert: any) => alert && (alert.current_message || alert.advisory_message || alert.detour_message));
    const alertsWithoutMessages = data.filter((alert: any) => alert && !(alert.current_message || alert.advisory_message || alert.detour_message));
    console.log('Alerts with messages:', alertsWithMessages.length);
    console.log('Alerts without messages:', alertsWithoutMessages.length);

    // Process all alerts, including those without messages (they might have other useful info)
    const alerts: SeptaAlert[] = data
      .filter((alert: any) => alert && alert.route_id) // Only filter out completely null alerts
      .map((alert: any, index: number) => ({
        id: `alert-${index}`,
        routeId: alert.route_id || 'unknown',
        routeName: alert.route_name || 'Unknown Route',
        currentMessage: alert.current_message,
        advisoryMessage: alert.advisory_message,
        detourMessage: alert.detour_message,
        detourReason: alert.detour_reason,
        detourStartLocation: alert.detour_start_location,
        detourStartDateTime: alert.detour_start_date_time,
        detourEndDateTime: alert.detour_end_date_time,
        lastUpdated: alert.last_updated || new Date().toISOString(),
        isSnow: alert.isSnow || 'N',
      }));

    console.log('Filtered alerts count:', alerts.length);
    return {
      alerts,
      totalCount: alerts.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching SEPTA alerts:', error);
    
    // Fallback to mock data if API fails
    const mockAlerts: SeptaAlert[] = [
      {
        id: 'alert-1',
        routeId: 'bus_route_1',
        routeName: 'Route 1',
        currentMessage: 'Route 1 experiencing delays due to construction',
        advisoryMessage: null,
        detourMessage: 'Route 1 detoured due to road work',
        detourReason: 'Construction',
        detourStartLocation: 'Main St & Oak Ave',
        detourStartDateTime: '2024-01-15 6:00 AM',
        detourEndDateTime: '2024-02-15 6:00 PM',
        lastUpdated: '2024-01-15 10:30 AM',
        isSnow: 'N',
      },
      {
        id: 'alert-2',
        routeId: 'rr_route_bsl',
        routeName: 'Broad Street Line',
        currentMessage: 'Broad Street Line operating normally',
        advisoryMessage: 'Broad Street Line is now the "B" as part of system-wide wayfinding improvements',
        detourMessage: null,
        detourReason: null,
        detourStartLocation: null,
        detourStartDateTime: null,
        detourEndDateTime: null,
        lastUpdated: '2024-01-15 09:15 AM',
        isSnow: 'N',
      },
    ];

    return {
      alerts: mockAlerts,
      totalCount: mockAlerts.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// SEPTA Elevator Outages API
export const getElevatorOutages = async (): Promise<ElevatorOutageData> => {
  try {
    const url = 'https://www3.septa.org/api/elevator/index.php';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error('Invalid response format from SEPTA Elevator API');
    }

    const outages: ElevatorOutage[] = data.results.map((outage: any, index: number) => ({
      id: `elevator-${index}`,
      line: outage.line || 'Unknown Line',
      station: outage.station || 'Unknown Station',
      elevator: outage.elevator || 'Unknown Elevator',
      message: outage.message || 'No access',
      messageHtml: outage.message_html || '',
      alternateUrl: outage.alternate_url || '',
    }));

    return {
      outages,
      totalOut: data.meta?.elevators_out || outages.length,
      lastUpdated: data.meta?.updated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching elevator outages:', error);
    
    // Fallback to mock data if API fails
    const mockOutages: ElevatorOutage[] = [
      {
        id: 'elevator-1',
        line: 'Broad Street Subway',
        station: 'Walnut-Locust',
        elevator: 'Street to Concourse',
        message: 'No access to/from station',
        messageHtml: '<ul><li>No access to/from station</li></ul>',
        alternateUrl: 'https://www5.septa.org/about/accessibility/alternative-transportation/bsl-alternate/',
      },
      {
        id: 'elevator-2',
        line: 'Market Frankford Line',
        station: 'Somerset',
        elevator: 'Westbound',
        message: 'No access to/from station',
        messageHtml: '<ul><li>No access to/from station</li></ul>',
        alternateUrl: 'https://www5.septa.org/about/accessibility/alternative-transportation/mfl-alternate/',
      },
    ];

    return {
      outages: mockOutages,
      totalOut: mockOutages.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// Philadelphia Landmarks API
export const getLandmarks = async (): Promise<LandmarkData> => {
  try {
    const url = 'https://services.arcgis.com/fLeGjb7u4uXqeF9q/arcgis/rest/services/Landmark_Points/FeatureServer/0/query?outFields=*&where=1%3D1&f=json';
    
    console.log('Fetching Philadelphia landmarks from:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Landmarks API response length:', data?.features?.length || 0);
    
    if (!data.features || !Array.isArray(data.features)) {
      throw new Error('Invalid response format from Landmarks API');
    }

    const landmarks: Landmark[] = data.features.map((feature: any, index: number) => {
      const attributes = feature.attributes;
      const geometry = feature.geometry;
      
      return {
        id: `landmark-${index}`,
        name: attributes.NAME || 'Unknown Landmark',
        type: attributes.TYPE || 0,
        subtype: attributes.SUBTYPE || 'Unknown',
        address: attributes.ADDRESS || '',
        bin: attributes.BIN || '',
        parentName: attributes.PARENT_NAME || '',
        parentSubtype: attributes.PARENT_SUBTYPE || '',
        source: attributes.SOURCE || '',
        isPublic: attributes.PUBLIC_ || 'N',
        archiveDate: attributes.ARCHIVE_DATE || '',
        archiveReason: attributes.ARCHIVE_REASON || '',
        editorComment: attributes.EDITOR_COMMENT || '',
        creator: attributes.CREATOR || '',
        dateCreated: attributes.DATE_CREATED || '',
        updater: attributes.UPDATER || '',
        dateUpdated: attributes.DATE_UPDATED || '',
        globalId: attributes.GLOBALID || '',
        oldId: attributes.OLDID || '',
        label: attributes.LABEL || 'N',
        latitude: geometry?.y || 0,
        longitude: geometry?.x || 0,
        geometry: geometry, // Keep original geometry for conversion
      };
    });

    console.log('Processed landmarks count:', landmarks.length);
    return {
      landmarks,
      totalCount: landmarks.length,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching landmarks:', error);
    
    // Fallback to mock data if API fails
    const mockLandmarks: Landmark[] = [
      {
        id: 'landmark-1',
        name: 'Swan Pond',
        type: 8,
        subtype: 'Lake / Pond / Reservoir',
        address: '',
        bin: '',
        parentName: 'Morris Arboretum of the University of Pennsylvania',
        parentSubtype: 'Park',
        source: '',
        isPublic: 'Y',
        archiveDate: '',
        archiveReason: '',
        editorComment: '',
        creator: '',
        dateCreated: '',
        updater: 'E3_CITYGEO',
        dateUpdated: '3/23/2018 7:36:53 PM',
        globalId: '55132acc-2469-40e8-9818-4a6aeaa4f384',
        oldId: '3',
        label: 'Y',
        latitude: 40.0094,
        longitude: -75.1333,
      },
      {
        id: 'landmark-2',
        name: 'Two Lines Sculpture',
        type: 10,
        subtype: 'Fountain / Monument / Statue',
        address: '',
        bin: '',
        parentName: 'Morris Arboretum of the University of Pennsylvania',
        parentSubtype: 'Park',
        source: '',
        isPublic: 'Y',
        archiveDate: '',
        archiveReason: '',
        editorComment: '',
        creator: '',
        dateCreated: '',
        updater: 'E3_CITYGEO',
        dateUpdated: '3/23/2018 7:33:57 PM',
        globalId: '06221863-ff76-4b3d-abb7-c5793aca96ca',
        oldId: '11',
        label: 'Y',
        latitude: 40.0095,
        longitude: -75.1334,
      },
    ];

    return {
      landmarks: mockLandmarks,
      totalCount: mockLandmarks.length,
      lastUpdated: new Date().toISOString(),
    };
  }
};

// SEPTA Bus Routes
export const septaBusRoutes = [
  1,2,3,5,6,7,8,9,12,14,17,18,19,20,21,22,23,24,25,26,27,28,29,30,
  31,32,33,35,37,38,39,40,42,43,44,46,47,48,50,52,53,54,55,56,
  57,58,59,60,61,62,64,65,66,67,68,70,71,73,75,77,78,79,80,84,88,
  89,90,91,92,93,94,95,96,97,98,99,103,104,105,106,107,108,109,110,
  111,112,113,114,115,116,117,118,119,120,123,124,125,127,128,129,
  130,131,132,134,139,150,201,204,205,206,304,306,310,314
];

// Real-time Bus Tracking API
export const getBusLocations = async (routeId?: string): Promise<BusLocation[]> => {
  console.log('getBusLocations called with routeId:', routeId);
  
  try {
    const url = 'https://www3.septa.org/hackathon/TransitViewAll/';
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    
    console.log('Fetching bus locations from:', proxyUrl);
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('SEPTA API response structure:', Object.keys(data));
    
    // Handle the correct SEPTA API format
    let buses: any[] = [];
    
    if (data && data.routes && Array.isArray(data.routes)) {
      // The API returns { routes: [{ "60": [...], "61": [...], etc }] }
      if (routeId) {
        // Get buses for specific route
        let routeBuses: any[] = [];
        data.routes.forEach((routeObject: any) => {
          if (routeObject[routeId] && Array.isArray(routeObject[routeId])) {
            routeBuses = routeBuses.concat(routeObject[routeId]);
          }
        });
        buses = routeBuses;
        console.log(`Found ${buses.length} buses for route ${routeId}`);
      } else {
        // Get all buses from all routes
        data.routes.forEach((routeObject: any) => {
          Object.values(routeObject).forEach((routeVehicles: any) => {
            if (Array.isArray(routeVehicles)) {
              buses = buses.concat(routeVehicles);
            }
          });
        });
        console.log(`Found ${buses.length} total buses across all routes`);
      }
    } else if (data && data.routes && typeof data.routes === 'object') {
      // Fallback for old format
      if (routeId) {
        // Get buses for specific route
        const routeBuses = data.routes[routeId];
        if (Array.isArray(routeBuses)) {
          buses = routeBuses;
          console.log(`Found ${buses.length} buses for route ${routeId}`);
        } else {
          console.log(`No buses found for route ${routeId}`);
        }
      } else {
        // Get all buses from all routes
        Object.values(data.routes).forEach((routeVehicles: any) => {
          if (Array.isArray(routeVehicles)) {
            buses = buses.concat(routeVehicles);
          }
        });
        console.log(`Found ${buses.length} total buses across all routes`);
      }
    } else if (Array.isArray(data)) {
      // Fallback for array format
      buses = data;
    } else if (data && typeof data === 'object') {
      // Try different possible response structures
      if (data.buses && Array.isArray(data.buses)) {
        buses = data.buses;
      } else if (data.vehicles && Array.isArray(data.vehicles)) {
        buses = data.vehicles;
      } else if (data.data && Array.isArray(data.data)) {
        buses = data.data;
      } else {
        // If it's an object but not the expected format, try to extract any array
        const keys = Object.keys(data);
        for (const key of keys) {
          if (Array.isArray(data[key])) {
            buses = data[key];
            break;
          }
        }
      }
    }
    
    if (!Array.isArray(buses)) {
      console.error('No valid bus data found in response:', data);
      throw new Error('Invalid response format from SEPTA TransitView API - no bus data found');
    }

    console.log(`Processing ${buses.length} buses`);
    
    const busLocations: BusLocation[] = buses.map((bus: any, index: number) => ({
      id: `bus-${bus.VehicleID || bus.vehicleId || bus.vehicle_id || index}`,
      vehicleId: bus.VehicleID || bus.vehicleId || bus.vehicle_id || `unknown-${index}`,
      routeId: bus.route_id || bus.routeId || bus.Route || bus.route || 'Unknown',
      direction: bus.Direction || bus.direction || 'Unknown',
      latitude: parseFloat(bus.lat) || parseFloat(bus.latitude) || 0,
      longitude: parseFloat(bus.lng) || parseFloat(bus.longitude) || 0,
      heading: bus.heading || 0,
      speed: bus.speed || 0,
      lastUpdated: new Date((bus.timestamp || Date.now()) * 1000).toISOString(),
      destination: bus.destination || 'Unknown',
      nextStop: bus.next_stop_name || bus.nextStop || bus.next_stop || 'Unknown',
      delay: bus.late || bus.delay || 0,
    }));

    console.log(`Processed ${busLocations.length} bus locations`);
    return busLocations;
  } catch (error) {
    console.error('Error fetching bus locations:', error);
    
    // Fallback to mock data if API fails
    console.log('Using mock bus data for route:', routeId);
    const mockBusLocations: BusLocation[] = [
      {
        id: 'bus-1',
        vehicleId: '1234',
        routeId: routeId || '60',
        direction: 'NB',
        latitude: 40.0094,
        longitude: -75.1333,
        heading: 45,
        speed: 25,
        lastUpdated: new Date().toISOString(),
        destination: 'Frankford Transportation Center',
        nextStop: 'Frankford & Bridge',
        delay: 2,
      },
      {
        id: 'bus-2',
        vehicleId: '5678',
        routeId: routeId || '60',
        direction: 'SB',
        latitude: 40.0095,
        longitude: -75.1334,
        heading: 225,
        speed: 30,
        lastUpdated: new Date().toISOString(),
        destination: 'Olney Transportation Center',
        nextStop: 'Olney & Broad',
        delay: 0,
      },
      {
        id: 'bus-3',
        vehicleId: '9012',
        routeId: routeId || '60',
        direction: 'NB',
        latitude: 40.0096,
        longitude: -75.1335,
        heading: 45,
        speed: 0,
        lastUpdated: new Date().toISOString(),
        destination: 'Frankford Transportation Center',
        nextStop: 'Frankford & Bridge',
        delay: -1,
      },
    ];

    console.log('Returning mock bus locations:', mockBusLocations);
    return mockBusLocations;
  }
};