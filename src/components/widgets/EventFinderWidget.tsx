import React, {
  useState,
  useEffect,
  useReducer,
  useContext,
  createContext,
} from "react";
import WidgetContainer from "../ui/WidgetContainer";
import { MapPin } from "lucide-react";

interface EventFinderWidgetProps {
  width?: "half" | "full";
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

interface Event {
  id: string;
  name: string;
  url: string;
  date: string;
  time: string;
  venue: string;
  image?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  venueHref?: string;
  segment: string;
  genre: string;
}

interface EventPageData {
  events: Event[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
  links: {
    next?: string;
    prev?: string;
    first?: string;
    last?: string;
  };
  category: string;
}

interface State {
  pages: { [page: number]: EventPageData };
  currentPage: number;
  loading: boolean;
  error: string | null;
  selectedCategory: string;
  sortBy: string;
  sortDirection: "asc" | "desc";
}

type Action =
  | { type: "FETCH_START"; page: number }
  | { type: "FETCH_SUCCESS"; page: number; data: EventPageData }
  | { type: "FETCH_ERROR"; page: number; error: string }
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_CATEGORY"; category: string }
  | { type: "SET_SORT"; sortBy: string };

const CATEGORIES = [
  { label: "All", value: "" },
  { label: "Music", value: "Music" },
  { label: "Comedy", value: "Comedy" },
  { label: "Sports", value: "Sports" },
  { label: "Arts & Theatre", value: "Arts & Theatre" },
  { label: "Film", value: "Film" },
  { label: "Miscellaneous", value: "Miscellaneous" },
];

const initialState: State = {
  pages: {},
  currentPage: 0,
  loading: false,
  error: null,
  selectedCategory: "",
  sortBy: "date",
  sortDirection: "asc",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "FETCH_START":
      return { ...state, loading: true, error: null };
    case "FETCH_SUCCESS":
      return {
        ...state,
        loading: false,
        error: null,
        pages: { ...state.pages, [action.page]: action.data },
      };
    case "FETCH_ERROR":
      return { ...state, loading: false, error: action.error };
    case "SET_PAGE":
      return { ...state, currentPage: action.page };
    case "SET_CATEGORY":
      return {
        ...state,
        selectedCategory: action.category,
        currentPage: 0,
        pages: {},
      };
    case "SET_SORT":
      let direction: "asc" | "desc" = "asc";
      if (state.sortBy === action.sortBy) {
        direction = state.sortDirection === "asc" ? "desc" : "asc";
      }
      return { ...state, sortBy: action.sortBy, sortDirection: direction };
    default:
      return state;
  }
}

const EventFinderContext = createContext<
  | {
  state: State;
  dispatch: React.Dispatch<Action>;
    }
  | undefined
>(undefined);

const TICKETMASTER_API_KEY = import.meta.env.VITE_TICKETMASTER_API_KEY;

function EventFinderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <EventFinderContext.Provider value={{ state, dispatch }}>
      {children}
    </EventFinderContext.Provider>
  );
}

function useEventFinder() {
  const context = useContext(EventFinderContext);
  if (!context)
    throw new Error("useEventFinder must be used within EventFinderProvider");
  return context;
}

const EventFinderWidget: React.FC<EventFinderWidgetProps> = ({
  width = "half",
  onRefresh,
  onMoveTop,
  onMoveBottom,
  onToggleWidth,
  onHide,
  dragHandleProps,
}) => {
  return (
    <EventFinderProvider>
      <EventFinderWidgetInner
        width={width}
        onRefresh={onRefresh}
        onMoveTop={onMoveTop}
        onMoveBottom={onMoveBottom}
        onToggleWidth={onToggleWidth}
        onHide={onHide}
        dragHandleProps={dragHandleProps}
      />
    </EventFinderProvider>
  );
};

const EventFinderWidgetInner: React.FC<EventFinderWidgetProps> = (props) => {
  const { state, dispatch } = useEventFinder();
  const { sortBy, sortDirection } = state;
  const pageData = state.pages[state.currentPage];

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const EVENTS_PER_PAGE = 10;

  // Fetch 100 events on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`https://app.ticketmaster.com/discovery/v2/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=40.0170,-75.1884&radius=10&unit=miles&size=100&sort=date,asc`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch events');
        return res.json();
      })
      .then(data => {
        const eventsRaw = data._embedded?.events || [];
        const events: Event[] = eventsRaw.map((ev: any) => {
          const venue = ev._embedded?.venues?.[0];
          let genre = ev.classifications?.[0]?.genre?.name;
          if (!genre || genre === 'Undefined' || genre === undefined || genre === null) genre = 'Other';
          return {
            id: ev.id,
            name: ev.name,
            url: ev.url,
            date: ev.dates?.start?.localDate || '',
            time: ev.dates?.start?.localTime || '',
            venue: venue?.name || '',
            image: ev.images?.[0]?.url || undefined,
            address: venue?.address?.line1 || '',
            latitude: venue?.location?.latitude || '',
            longitude: venue?.location?.longitude || '',
            venueHref: venue?._links?.self?.href || '',
            genre,
            segment: ev.classifications?.[0]?.segment?.name || '',
          };
        });
        setAllEvents(events);
        // Build unique category list from genre
        let cats = Array.from(new Set(events.map(e => e.genre).filter(Boolean)));
        if (!cats.includes('Other') && events.some(e => e.genre === 'Other')) {
          cats.push('Other');
        }
        cats = cats.filter(cat => cat !== 'Undefined');
        setCategories(['All', ...cats]);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message || 'Error fetching events');
        setLoading(false);
      });
  }, []);

  // Filter events by selected category
  const filteredEvents = selectedCategory === 'All'
    ? allEvents
    : allEvents.filter(e => e.genre === selectedCategory);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const pagedEvents = filteredEvents.slice(currentPage * EVENTS_PER_PAGE, (currentPage + 1) * EVENTS_PER_PAGE);

  // Sorting logic
  const sortedEvents = React.useMemo(() => {
    if (!pageData?.events) return [];
    const sorted = [...pageData.events];
    sorted.sort((a, b) => {
      let aVal = a[sortBy as keyof Event];
      let bVal = b[sortBy as keyof Event];
      if (sortBy === "date") {
        aVal = a.date + (a.time || "");
        bVal = b.date + (b.time || "");
      }
      if (aVal === undefined || bVal === undefined) return 0;
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [pageData, sortBy, sortDirection]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 0) return;
    if (pageData && pageData.page && newPage >= pageData.page.totalPages)
      return;
    dispatch({ type: "SET_PAGE", page: newPage });
  };

  return (
    <WidgetContainer
      title="Events"
      width={"half"}
      onRefresh={() => dispatch({ type: "SET_PAGE", page: 0 })}
      onMoveTop={props.onMoveTop}
      onMoveBottom={props.onMoveBottom}
      onToggleWidth={props.onToggleWidth}
      onHide={props.onHide}
      dragHandleProps={props.dragHandleProps}
    >
      <div className="p-2 sm:p-4 flex flex-col h-[60vh]">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center py-4">{error}</div>
        ) : (
          <>
            <div className="mb-2 flex items-center gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category:
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={e => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(0); // Reset to first page on category change
                }}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="flex flex-col gap-4 pb-2">
                {pagedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 w-full flex flex-col md:flex-row min-h-[112px] md:h-28"
                  >
                    {event.image && (
                      <div className="overflow-hidden w-full h-28 md:w-28 md:h-28 flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.name}
                          className="w-full h-full object-cover md:rounded-l-lg rounded-t-lg md:rounded-t-none"
                        />
                      </div>
                    )}
                    <div className="p-2 flex flex-col flex-1 justify-between">
                      <div>
                        <a
                          href={event.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-base mb-1 line-clamp-1 text-blue-700 dark:text-blue-400 hover:underline"
                        >
                          {event.name}
                        </a>
                        <div className="text-xs text-gray-500 mb-1">
                          {event.date} {event.time && <span>• {event.time}</span>}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-300 mb-1 line-clamp-1">
                          {event.venue}
                        </div>
                        {event.address && (
                          <div className="flex items-center text-xs text-gray-500 mb-1 gap-1">
                            <span>{event.address}</span>
                            {event.latitude && event.longitude && (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                                title="View on Google Maps"
                              >
                                <MapPin className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {pagedEvents.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No events found.
                  </div>
                )}
              </div>
            </div>
            {/* Pagination Controls - simplified */}
            <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold disabled:opacity-50"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </WidgetContainer>
  );
};

const buildApiUrl = (category: string, page: number) => {
  let url = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${
    import.meta.env.VITE_TICKETMASTER_API_KEY
  }&city=Philadelphia&size=20&page=${page}`;
  if (category) {
    url += `&segmentName=${encodeURIComponent(category)}`;
  }
  return url;
};

export default EventFinderWidget;
