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
      // Prepare context data from dashboard state
      const contextData = {
        weather: state.weather,
        events: state.events,
        news: state.news,
        reddit: state.reddit.posts,
        // Add other relevant data as needed
      };

      // Build prompt based on toggles
      let prompt = "You are knowledgeable about the city of Philadelphia. Make an itinerary for someone to do for today.";
      
      const activeToggles = Object.entries(promptToggles)
        .filter(([_, active]) => active)
        .map(([key, _]) => key);

      if (activeToggles.length > 0) {
        prompt += ` Focus on: ${activeToggles.join(', ')}.`;
      }

      prompt += `\n\nUse this context data: ${JSON.stringify(contextData, null, 2)}`;

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

      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDVUQAPgwrUtHuxw9YuqQjA4euOtEI2F6M', {
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