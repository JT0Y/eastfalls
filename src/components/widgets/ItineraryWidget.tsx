import React, { useState, useEffect } from 'react';
import WidgetContainer from '../ui/WidgetContainer';
import { Wand2, Save, Loader2 } from 'lucide-react';
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

interface PromptToggles {
  dogFriendly: boolean;
  healthy: boolean;
  food: boolean;
  familyFriendly: boolean;
  shopping: boolean;
  enjoyWeather: boolean;
  cityDay: boolean;
  relax: boolean;
}

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
  const [itinerary, setItinerary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptToggles, setPromptToggles] = useState<PromptToggles>({
    dogFriendly: false,
    healthy: false,
    food: false,
    familyFriendly: false,
    shopping: false,
    enjoyWeather: false,
    cityDay: false,
    relax: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedItinerary = localStorage.getItem('eastfalls-itinerary');
    if (savedItinerary) {
      setItinerary(savedItinerary);
    }

    const savedToggles = localStorage.getItem('eastfalls-itinerary-toggles');
    if (savedToggles) {
      setPromptToggles(JSON.parse(savedToggles));
    }
  }, []);

  // Save to localStorage when itinerary changes
  useEffect(() => {
    localStorage.setItem('eastfalls-itinerary', itinerary);
  }, [itinerary]);

  // Save toggles to localStorage
  useEffect(() => {
    localStorage.setItem('eastfalls-itinerary-toggles', JSON.stringify(promptToggles));
  }, [promptToggles]);

  const generateItinerary = async () => {
    setIsGenerating(true);
    
    try {
      // Prepare focused context data for today's itinerary
      const today = new Date();
      const todayString = today.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      // Get today's weather (simplified)
      const weather = state.weather ? {
        temp: state.weather.temperature,
        condition: state.weather.condition,
        wind: state.weather.windSpeed
      } : null;

      // Get today's events (simplified, only essential fields)
      const events = state.events?.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date);
        const diffTime = eventDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
      }).slice(0, 3).map(event => ({
        title: event.title,
        date: event.date,
        location: event.location,
        category: event.category
      })) || [];

      // Get recent news (simplified)
      const news = state.news?.slice(0, 3).map(item => ({
        title: item.title,
        source: item.source,
        publishedAt: item.publishedAt
      })) || [];

      // Get trending Reddit posts (simplified)
      const reddit = state.reddit.posts?.slice(0, 3).map(post => ({
        title: post.title,
        score: post.score,
        comments: post.numComments,
        subreddit: post.subreddit
      })) || [];

      const contextData = {
        date: todayString,
        weather,
        events,
        news,
        reddit,
        location: "Philadelphia"
      };
      
      console.log("Clean context data for Gemini:", contextData);

      // Build focused prompt based on toggles
      let prompt = `You are a knowledgeable Philadelphia local guide. Create a detailed, practical itinerary for ${contextData.date} based on the current weather, local events, news, and community discussions.`;
      
      const activeToggles = Object.entries(promptToggles)
        .filter(([_, active]) => active)
        .map(([key, _]) => key);

      if (activeToggles.length > 0) {
        prompt += `\n\nPREFERENCES: Focus on activities that are ${activeToggles.join(', ')}.`;
      }

      prompt += `\n\nCURRENT CONDITIONS: ${JSON.stringify(contextData, null, 2)}`;
      
      prompt += `\n\nINSTRUCTIONS:
- Create a realistic, time-based itinerary for today
- Consider the weather conditions when suggesting activities
- Include specific events happening today if available
- Mention relevant news or community discussions
- Suggest local things for tourists and locals
- Include both indoor and outdoor options based on weather
- Make it practical and achievable for a day in Philadelphia
- Format as a clear timeline with times and locations`;

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

      console.log('Sending request to Gemini:', requestBody);
      console.log('Sending request to Gemini:', prompt);

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
        console.error('Gemini API response:', response.status, errorText);
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini API response:', data);
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Invalid response format from Gemini API');
      }
      
      const generatedText = data.candidates[0].content.parts[0].text;
      setItinerary(generatedText);
    } catch (error) {
      console.error('Error generating itinerary:', error);
      setItinerary('Error generating itinerary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePrompt = (key: keyof PromptToggles) => {
    setPromptToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
      <div className="space-y-4">
        {/* Prompt Toggles */}
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(promptToggles).map(([key, active]) => (
            <button
              key={key}
              onClick={() => togglePrompt(key as keyof PromptToggles)}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                active 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateItinerary}
          disabled={isGenerating}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              Generate Itinerary
            </>
          )}
        </button>

        {/* Itinerary Text Area */}
        <textarea
          value={itinerary}
          onChange={(e) => setItinerary(e.target.value)}
          placeholder="Your itinerary will appear here... Type or generate an itinerary using AI."
          className="w-full h-48 p-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </WidgetContainer>
  );
};

export default ItineraryWidget; 