import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WeatherWidget from '../widgets/WeatherWidget';
import PhiladelphiaDataExplorerWidget from '../widgets/PhiladelphiaDataExplorerWidget';
import NewsWidget from '../widgets/NewsWidget';
import TrafficWidget from '../widgets/TrafficWidget';
import SystemInfoWidget from '../widgets/SystemInfoWidget';
import RedditWidget from '../widgets/RedditWidget';
import MarketInsightsWidget from '../widgets/MarketInsightsWidget';
import EventsWidget from '../widgets/EventsWidget';
import SeptaWidget from '../widgets/SeptaWidget';
import ItineraryWidget from '../widgets/ItineraryWidget';

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
  { key: 'itinerary', component: ItineraryWidget, needsZip: false },
];

// Sortable wrapper for each widget
function SortableWidget({ id, children }: { id: string; children: React.ReactElement }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.7 : 1,
  };

  // Pass listeners/attributes to the drag handle only
  return (
    <div ref={setNodeRef} style={style} className="mb-4 break-inside-avoid">
      {React.cloneElement(children, {
        dragHandleProps: { ...attributes, ...listeners }
      })}
    </div>
  );
}

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

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // dnd-kit drag end handler
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setWidgetStates((items) => {
        const oldIndex = items.findIndex(w => w.key === active.id);
        const newIndex = items.findIndex(w => w.key === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Helper to render widget by key
  const renderWidget = (key: string, width: 'half' | 'full', dragHandleProps?: any) => {
    const commonProps = {
      width,
      onMoveTop: () => moveWidgetToTop(key),
      onMoveBottom: () => moveWidgetToBottom(key),
      onToggleWidth: () => toggleWidgetWidth(key),
      onHide: () => hideWidget(key),
      dragHandleProps,
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
      case 'itinerary':
        return <ItineraryWidget {...commonProps} onRefresh={() => {}} />;
      default:
        return null;
    }
  };

  return (
    <main className="container mx-auto px-4 py-8 mt-16">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={widgetStates.map(w => w.key)} strategy={verticalListSortingStrategy}>
          <div className="columns-1 md:columns-2 gap-4">
            {widgetStates.map(({ key, width }) => {
              const widget = renderWidget(key, width);
              return widget ? (
                <SortableWidget key={key} id={key}>
                  {widget}
                </SortableWidget>
              ) : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </main>
  );
};

export default Dashboard;