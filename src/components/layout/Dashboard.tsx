import React, { useState } from 'react';
import WeatherWidget from '../widgets/WeatherWidget';
import PhiladelphiaDataExplorerWidget from '../widgets/BitcoinWidget';
import NewsWidget from '../widgets/NewsWidget';
import TrafficWidget from '../widgets/TrafficWidget';
import SystemInfoWidget from '../widgets/SystemInfoWidget';
import RedditWidget from '../widgets/RedditWidget';
import MarketInsightsWidget from '../widgets/MarketInsightsWidget';
import EventsWidget from '../widgets/EventsWidget';
import SeptaWidget from '../widgets/HousingWidget';

interface DashboardProps {
  zipCode: string;
}

// Widget registry for order and type
const WIDGETS = [
  { key: 'weather', component: WeatherWidget, needsZip: true },
  { key: 'system', component: SystemInfoWidget, needsZip: false },
  { key: 'events', component: EventsWidget, needsZip: true },
  { key: 'reddit', component: RedditWidget, needsZip: false },
  { key: 'traffic', component: TrafficWidget, needsZip: true },
  { key: 'news', component: NewsWidget, needsZip: true },
  { key: 'market', component: MarketInsightsWidget, needsZip: false },
  { key: 'phillyDataExplorer', component: PhiladelphiaDataExplorerWidget, needsZip: false },
  { key: 'septa', component: SeptaWidget, needsZip: false },
];

const Dashboard: React.FC<DashboardProps> = ({ zipCode }) => {
  // Each widget has a width: 'half' (50%) or 'full' (100%)
  const [widgetStates, setWidgetStates] = useState(
    WIDGETS.map((w, i) => ({ key: w.key, width: 'half' as 'half' | 'full' }))
  );

  // Move widget to top
  const moveWidgetToTop = (key: string) => {
    setWidgetStates((prev) => {
      const idx = prev.findIndex(w => w.key === key);
      if (idx === -1) return prev;
      const widget = prev[idx];
      const newArr = prev.slice();
      newArr.splice(idx, 1);
      newArr.unshift(widget);
      return newArr;
    });
  };

  // Move widget to bottom
  const moveWidgetToBottom = (key: string) => {
    setWidgetStates((prev) => {
      const idx = prev.findIndex(w => w.key === key);
      if (idx === -1) return prev;
      const widget = prev[idx];
      const newArr = prev.slice();
      newArr.splice(idx, 1);
      newArr.push(widget);
      return newArr;
    });
  };

  // Toggle widget width
  const toggleWidgetWidth = (key: string) => {
    setWidgetStates((prev) =>
      prev.map(w =>
        w.key === key ? { ...w, width: w.width === 'half' ? 'full' : 'half' } : w
      )
    );
  };

  // Hide widget
  const hideWidget = (key: string) => {
    setWidgetStates((prev) => prev.filter(w => w.key !== key));
  };

  // Helper to render widget by key
  const renderWidget = (key: string, width: 'half' | 'full') => {
    const commonProps = {
      width,
      onMoveTop: () => moveWidgetToTop(key),
      onMoveBottom: () => moveWidgetToBottom(key),
      onToggleWidth: () => toggleWidgetWidth(key),
      onHide: () => hideWidget(key),
    };
    switch (key) {
      case 'weather':
        return (
          <WeatherWidget
            zipCode={zipCode}
            {...commonProps}
            onRefresh={() => {}}
          />
        );
      case 'system':
        return <SystemInfoWidget {...commonProps} onRefresh={() => {}} />;
      case 'events':
        return <EventsWidget zipCode={zipCode} {...commonProps} onRefresh={() => {}} />;
      case 'reddit':
        return <RedditWidget {...commonProps} onRefresh={() => {}} />;
      case 'traffic':
        return <TrafficWidget zipCode={zipCode} {...commonProps} onRefresh={() => {}} />;
      case 'news':
        return <NewsWidget zipCode={zipCode} {...commonProps} onRefresh={() => {}} />;
      case 'market':
        return <MarketInsightsWidget {...commonProps} onRefresh={() => {}} />;
      case 'phillyDataExplorer':
        return <PhiladelphiaDataExplorerWidget {...commonProps} onRefresh={() => {}} />;
      case 'septa':
        return <SeptaWidget {...commonProps} onRefresh={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 mt-16">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 auto-rows-min">
        {widgetStates.map(({ key, width }, idx) => (
          <div
            key={key}
            className={width === 'full' ? 'col-span-2' : 'col-span-1'}
            style={{ transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}
          >
            {renderWidget(key, width)}
          </div>
        ))}
      </div>
    </main>
  );
};

export default Dashboard;