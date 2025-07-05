// Define types for the application

export interface WeatherData {
  temperature: number;
  condition: string;
  icon: string;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  forecast: DayForecast[];
}

export interface DayForecast {
  day: string;
  fullDay?: string;
  condition: string;
  icon: string;
  high: number;
  low: number;
}

export interface TobaccoPermit {
  id: string;
  businessName: string;
  streetAddress: string;
  permitYear: string;
  latitude: number;
  longitude: number;
  zipCode: string;
}

export interface TobaccoPermitData {
  permits: TobaccoPermit[];
  totalCount: number;
  lastUpdated: string;
}

export interface Demolition {
  id: string;
  address: string;
  demolitionDate: string;
  reason: string;
  latitude: number;
  longitude: number;
  zipCode: string;
}

export interface DemolitionData {
  demolitions: Demolition[];
  totalCount: number;
  lastUpdated: string;
}

export interface BusDetour {
  id: string;
  routeId: string;
  routeDirection: string;
  reason: string;
  startLocation: string;
  endLocation: string;
  startDateTime: string;
  endDateTime: string;
  currentMessage: string;
}

export interface BusDetourData {
  detours: BusDetour[];
  totalCount: number;
  lastUpdated: string;
}

export interface PricePoint {
  timestamp: number;
  price: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface TrafficData {
  status: 'light' | 'moderate' | 'heavy';
  incidents: TrafficIncident[];
  commuteTime: number;
}

export interface TrafficIncident {
  id: string;
  type: string;
  description: string;
  location: string;
}

export interface SystemInfo {
  browser: {
    name: string;
    version: string;
    userAgent: string;
    language: string;
    platform: string;
    cookiesEnabled: boolean;
    doNotTrack?: string | null;
    vendor: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
    pdfViewerEnabled: boolean;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelRatio: number;
    orientation: {
      type: string;
      angle: number;
    };
  };
  network: {
    type?: string;
    downlink?: number;
    rtt?: number;
    effectiveType?: string;
    online: boolean;
    saveData?: boolean;
  };
  memory?: {
    total: number;
    used: number;
    limit: number;
  };
  performance: {
    pageLoadTime: number;
    resourceCount: number;
    domainLookupTime: number;
    serverResponseTime: number;
    pageRenderTime: number;
  };
}

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  created: number;
  subreddit: string;
  author: string;
  content?: string;
  thumbnail?: string;
}

export interface MarketData {
  sp500: {
    price: number;
    change: number;
    changePercent: number;
    history: PricePoint[];
  };
  fearGreedIndex: {
    value: number;
    rating: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
    previousClose: number;
    previousWeek: number;
    previousMonth: number;
  };
  mortgageRates: {
    thirtyYear: number;
    fifteenYear: number;
    fiveOneArm: number;
    lastUpdated: string;
  };
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time?: string;
  location: string;
  category: 'concert' | 'festival' | 'sports' | 'tech' | 'community' | 'entertainment' | 'pride' | 'health' | 'outdoors' | 'education' | 'family' | 'holiday' | 'other';
  source: string;
  url: string;
  imageUrl?: string;
  price?: string;
}

export interface Property {
  cartodb_id: number;
  market_value: number;
  total_livable_area: number;
  year_built: number;
  street_address: string;
  zip_code: string;
  building_code_description: string;
  owner_1: string;
}

export interface BuildingPermit {
  cartodb_id: number;
  permitnumber: string;
  permitdescription: string;
  permittype: string;
  street_address: string;
  zip_code: string;
  issue_date: string;
  status: string;
  estimated_cost: number;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  type: 'speaker' | 'camera' | 'outlet' | 'light' | 'thermostat';
  status: 'online' | 'offline' | 'active';
  batteryLevel?: number;
  castingStatus?: {
    isPlaying: boolean;
    title: string;
    artist?: string;
    albumArt?: string;
    progress?: number;
    duration?: number;
  };
}

export interface SeptaAlert {
  id: string;
  routeId: string;
  routeName: string;
  currentMessage: string | null;
  advisoryMessage: string | null;
  detourMessage: string | null;
  detourReason: string | null;
  detourStartLocation: string | null;
  detourStartDateTime: string | null;
  detourEndDateTime: string | null;
  lastUpdated: string;
  isSnow: string;
}

export interface SeptaAlertData {
  alerts: SeptaAlert[];
  totalCount: number;
  lastUpdated: string;
}

export interface ElevatorOutage {
  id: string;
  line: string;
  station: string;
  elevator: string;
  message: string;
  messageHtml: string;
  alternateUrl: string;
}

export interface ElevatorOutageData {
  outages: ElevatorOutage[];
  totalOut: number;
  lastUpdated: string;
}

export interface Landmark {
  id: string;
  name: string;
  type: number;
  subtype: string;
  address: string;
  bin: string;
  parentName: string;
  parentSubtype: string;
  source: string;
  isPublic: string;
  archiveDate: string;
  archiveReason: string;
  editorComment: string;
  creator: string;
  dateCreated: string;
  updater: string;
  dateUpdated: string;
  globalId: string;
  oldId: string;
  label: string;
  latitude: number;
  longitude: number;
}

export interface LandmarkData {
  landmarks: Landmark[];
  totalCount: number;
  lastUpdated: string;
}

export interface BusLocation {
  id: string;
  vehicleId: string;
  routeId: string;
  direction: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  lastUpdated: string;
  destination: string;
  nextStop: string;
  delay: number;
}