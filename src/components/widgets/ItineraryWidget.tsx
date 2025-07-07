import React, { useState, useEffect } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Wand2, Save, Loader2, Settings, Map } from 'lucide-react';
import { useDashboardData } from '../../DataContext';

interface ItineraryWidgetProps {
  width?: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
}

const MAIN_CATEGORIES = [
  'Dog Friendly', 'Healthy', 'Family Friendly', 'Shopping', 'City Day', 'Relax', 'Enjoy Weather'
];
const EXPERIENCE_CATEGORIES = [
  'Historical', 'Cultural', 'Outdoors', 'Nightlife', 'Food/Drink', 'Art/Museums'
];
const phillyNeighborhoods = [
  'Center City', 'Old City', 'Fishtown', 'Northern Liberties', 'University City', 'South Philly', 'Rittenhouse Square', 'Fairmount', 'East Falls', 'Chestnut Hill', 'Manayunk', 'Kensington', 'Queen Village', 'Point Breeze', 'Graduate Hospital'
];
const EXTRA_CATEGORIES = [
  'Outside of the City', 'Hiking', 'Free'
];

const ItineraryWidget: React.FC<ItineraryWidgetProps> = ({ 
  width = 'half', 
  onRefresh, 
  onMoveTop, 
  onMoveBottom, 
  onToggleWidth, 
  onHide, 
  dragHandleProps 
}): JSX.Element => {
  const { state } = useDashboardData();
  const [selectedMain, setSelectedMain] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [selectedExtra, setSelectedExtra] = useState<string[]>([]);
  const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);
  const [customInterest, setCustomInterest] = useState('');
  const [distanceEnabled, setDistanceEnabled] = useState(false);
  const [distance, setDistance] = useState(10); // miles
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'itinerary'>('settings');

  // Load from localStorage on mount
  useEffect(() => {
    const savedItinerary = localStorage.getItem('eastfalls-itinerary');
    if (savedItinerary) {
      setOutput(savedItinerary);
    }
  }, []);

  // Save to localStorage when itinerary changes
  useEffect(() => {
    localStorage.setItem('eastfalls-itinerary', output);
  }, [output]);

  const toggle = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    setArr(arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]);
  };

  const handleCheckbox = (arr: string[], setArr: (v: string[]) => void, value: string) => {
    if (arr.includes(value)) {
      setArr(arr.filter(v => v !== value));
    } else {
      setArr([...arr, value]);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setOutput('');
    try {
      // Compose human-readable preferences summary
      const preferences: string[] = [];
      if (selectedMain.length) preferences.push(`Main: ${selectedMain.join(', ')}`);
      if (selectedExperience.length) preferences.push(`Experience: ${selectedExperience.join(', ')}`);
      if (selectedExtra.length) preferences.push(`Other: ${selectedExtra.join(', ')}`);
      if (selectedNeighborhoods.length) preferences.push(`Neighborhoods: ${selectedNeighborhoods.join(', ')}`);
      if (distanceEnabled) preferences.push(`Distance: within ${distance} miles`);
      if (customInterest.trim()) preferences.push(`IMPORTANT: ${customInterest.trim()}`);

      // Prepare context data for today's itinerary
      const today = new Date();
      const todayString = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Get today's weather (simplified)
      const weather = state.weather ? `${state.weather.temperature}°F, ${state.weather.condition}, Wind: ${state.weather.windSpeed} mph` : '';

      // Get today's events (up to 3, essential fields)
      const events = (state.events || [])
        .filter(event => {
          if (!event.date) return false;
          const eventDate = new Date(event.date);
          const diffTime = eventDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays >= 0 && diffDays <= 7;
        })
        .slice(0, 3)
        .map(event => `- ${event.title} (${event.date}, ${event.location}${event.category ? ', ' + event.category : ''})`);

      // Get recent news (up to 2)
      const news = (state.news || [])
        .slice(0, 2)
        .map(item => `- ${item.title} (${item.source}, ${item.publishedAt})`);

      // Get trending Reddit posts (up to 2)
      const reddit = (state.reddit.posts || [])
        .slice(0, 2)
        .map(post => `- ${post.title} (${post.subreddit}, ${post.score} upvotes, ${post.numComments} comments)`);

      // Build the prompt
      let prompt = `You are a knowledgeable Philadelphia local guide. Create a detailed, well-curated list of local attractions, events, and activities for ${todayString}, based on the following user preferences and context.`;
      if (preferences.length) {
        prompt += `\n**Preferences:**\n- ${preferences.join('\n- ')}\n`;
      }
      if (weather) {
        prompt += `\n**Weather:**\n- ${weather}\n`;
      }
      if (events.length) {
        prompt += `\n**Events:**\n${events.join('\n')}\n`;
      }
      if (news.length) {
        prompt += `\n**News:**\n${news.join('\n')}\n`;
      }
      if (reddit.length) {
        prompt += `\n**Reddit Trends:**\n${reddit.join('\n')}\n`;
      }
      prompt += `\nInstructions:\n- Create a realistic possible list of things to do for today\n- Consider the weather and events\n- Suggest local things for tourists and locals\n- Include both indoor and outdoor options\n- Format with clear bullets with possible times and/or addresses. If necessary search web for additional events, markets, tours, etc.`;

      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        }
      };
console.log("prompt ---->", prompt)
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        throw new Error('Gemini API key is missing. Please set VITE_GEMINI_API_KEY in your environment variables.');
      }
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Invalid response format from Gemini API');
      }
      const generatedText = data.candidates[0].content.parts[0].text;
      setOutput(generatedText);
      setLoading(false);
      setActiveTab('itinerary');
    } catch (e: any) {
      setError(e.message || 'Error generating itinerary');
      setLoading(false);
    }
  };

  const formatItineraryText = (text: string) => {
    // Split by lines and format each line
    const lines = text.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return <br key={index} />;
      
      // Check for markdown headings (# ## ###)
      if (trimmedLine.startsWith('#')) {
        const level = trimmedLine.match(/^#+/)?.[0].length || 1;
        const content = trimmedLine.replace(/^#+\s*/, '');
        const HeadingComponent = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3';
        const className = level === 1 
          ? 'text-2xl font-bold text-blue-800 dark:text-blue-300 mt-6 mb-4'
          : level === 2 
          ? 'text-xl font-bold text-blue-700 dark:text-blue-400 mt-5 mb-3'
          : 'text-lg font-bold text-blue-600 dark:text-blue-400 mt-4 mb-2';
        
        return React.createElement(HeadingComponent, {
          key: index,
          className: className
        }, formatInlineMarkdown(content));
      }
      
      // Check for bullet points or numbered lists
      if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
        return (
          <div key={index} className="flex items-start gap-2 mb-2">
            <span className="text-blue-400 dark:text-blue-300 mt-1 flex-shrink-0">•</span>
            <span className="flex-1">{formatInlineMarkdown(trimmedLine.substring(1).trim())}</span>
          </div>
        );
      }
      
      // Check for numbered lists
      if (/^\d+\./.test(trimmedLine)) {
        const match = trimmedLine.match(/^(\d+)\.\s*(.*)/);
        if (match) {
          const [, number, content] = match;
          return (
            <div key={index} className="flex items-start gap-2 mb-2">
              <span className="text-blue-400 dark:text-blue-300 mt-1 font-semibold flex-shrink-0">
                {number}.
              </span>
              <span className="flex-1">{formatInlineMarkdown(content)}</span>
            </div>
          );
        }
      }
      
      // Check for horizontal rules
      if (trimmedLine.match(/^[-*_]{3,}$/)) {
        return <hr key={index} className="my-4 border-gray-300 dark:border-gray-600" />;
      }
      
      // Check for blockquotes
      if (trimmedLine.startsWith('>')) {
        return (
          <blockquote key={index} className="border-l-4 border-blue-300 dark:border-blue-600 pl-4 py-2 my-3 bg-blue-50 dark:bg-blue-900/20 italic">
            {formatInlineMarkdown(trimmedLine.substring(1).trim())}
          </blockquote>
        );
      }
      
      // Regular paragraph
      return (
        <p key={index} className="mb-2 leading-relaxed">
          {formatInlineMarkdown(trimmedLine)}
        </p>
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    // Convert markdown to React elements directly
    const elements: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Handle bold text (**text** or __text__)
    text = text.replace(/\*\*(.*?)\*\*/g, (match, content, offset) => {
      elements.push(text.slice(currentIndex, offset));
      elements.push(<strong key={`bold-${offset}`} className="font-bold">{content}</strong>);
      currentIndex = offset + match.length;
      return '';
    });
    
    // Handle italic text (*text* or _text_)
    text = text.replace(/\*(.*?)\*/g, (match, content, offset) => {
      elements.push(text.slice(currentIndex, offset));
      elements.push(<em key={`italic-${offset}`} className="italic">{content}</em>);
      currentIndex = offset + match.length;
      return '';
    });
    
    // Handle inline code (`code`)
    text = text.replace(/`(.*?)`/g, (match, content, offset) => {
      elements.push(text.slice(currentIndex, offset));
      elements.push(<code key={`code-${offset}`} className="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">{content}</code>);
      currentIndex = offset + match.length;
      return '';
    });
    
    // Handle links [text](url)
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url, offset) => {
      elements.push(text.slice(currentIndex, offset));
      elements.push(
        <a 
          key={`link-${offset}`}
          href={url} 
          className="text-blue-600 dark:text-blue-400 hover:underline" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          {linkText}
        </a>
      );
      currentIndex = offset + match.length;
      return '';
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      elements.push(text.slice(currentIndex));
    }
    
    return elements.length > 0 ? elements : text;
  };

  return (
    <WidgetContainer
      title="Itinerary"
      width={width}
      onRefresh={onRefresh}
      onMoveTop={onMoveTop}
      onMoveBottom={onMoveBottom}
      onToggleWidth={onToggleWidth}
      onHide={onHide}
      dragHandleProps={dragHandleProps}
    >
      <div className="flex flex-col h-full max-h-[80vh]">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'itinerary'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Map className="h-4 w-4" />
            Itinerary
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'settings' && (
          <div className="space-y-4 flex-1 overflow-y-auto pr-1 pb-48">
            {/* Main Categories */}
            <div>
              <div className="font-semibold text-sm mb-2">Main Categories</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MAIN_CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedMain.includes(cat)}
                      onChange={() => handleCheckbox(selectedMain, setSelectedMain, cat)}
                      className="accent-blue-600 h-4 w-4 rounded"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Experience Categories */}
            <div>
              <div className="font-semibold text-sm mb-2">Experience Types</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXPERIENCE_CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedExperience.includes(cat)}
                      onChange={() => handleCheckbox(selectedExperience, setSelectedExperience, cat)}
                      className="accent-blue-600 h-4 w-4 rounded"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Extra Categories */}
            <div>
              <div className="font-semibold text-sm mb-2">Other Options</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {EXTRA_CATEGORIES.map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={selectedExtra.includes(cat)}
                      onChange={() => handleCheckbox(selectedExtra, setSelectedExtra, cat)}
                      className="accent-blue-600 h-4 w-4 rounded"
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Neighborhoods */}
            <div>
              <div className="font-semibold text-sm mb-2">Neighborhoods</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {phillyNeighborhoods.map(nh => (
                  <label key={nh} className="flex items-center gap-2 cursor-pointer text-sm whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedNeighborhoods.includes(nh)}
                      onChange={() => handleCheckbox(selectedNeighborhoods, setSelectedNeighborhoods, nh)}
                      className="accent-blue-600 h-4 w-4 rounded"
                    />
                    <span>{nh}</span>
                  </label>
                ))}
              </div>
            </div>
            {/* Distance Filter */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  id="distance-enabled"
                  checked={distanceEnabled}
                  onChange={e => setDistanceEnabled(e.target.checked)}
                  className="accent-blue-600 h-4 w-4 rounded"
                />
                <label htmlFor="distance-enabled" className="text-sm font-medium">Limit by distance</label>
              </div>
              {distanceEnabled && (
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={distance}
                    onChange={e => setDistance(Number(e.target.value))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 min-w-[48px]">{distance} mi</span>
                </div>
              )}
            </div>
            {/* Custom Interest Input */}
            <div>
              <div className="font-semibold text-sm mb-2">Anything specific you want to do or see?</div>
              <input
                type="text"
                value={customInterest}
                onChange={e => setCustomInterest(e.target.value)}
                placeholder="e.g. I want to see Pandas, I want the best coffee, etc."
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className="flex-1 overflow-y-auto">
            {!output && !loading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Map className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-sm">No itinerary generated yet. Go to Settings to configure your preferences and generate an itinerary.</p>
              </div>
            )}
            
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600 dark:text-blue-500" />
              </div>
            )}
            
            {error && (
              <div className="text-center py-4 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg">
                {error}
              </div>
            )}
            
            {output && !loading && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-blue-200 dark:border-gray-700">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {formatItineraryText(output)}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Generate Button (only visible in settings tab) */}
        {activeTab === 'settings' && (
          <div className="pt-4 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent sticky bottom-0 z-10">
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={loading}
            >
              <Wand2 className="h-5 w-5" />
              Generate Itinerary
            </button>
          </div>
        )}
      </div>
    </WidgetContainer>
  );
};

export default ItineraryWidget; 