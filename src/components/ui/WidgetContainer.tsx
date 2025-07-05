import React from 'react';
import { RotateCcw, ArrowUp, ArrowDown, Maximize2, Minimize2, X } from 'lucide-react';

interface WidgetContainerProps {
  title: string;
  width: 'half' | 'full';
  onRefresh?: () => void;
  onMoveTop?: () => void;
  onMoveBottom?: () => void;
  onToggleWidth?: () => void;
  onHide?: () => void;
  children: React.ReactNode;
  className?: string;
}

const WidgetContainer: React.FC<WidgetContainerProps> = ({
  title,
  width,
  onRefresh,
  onMoveTop,
  onMoveBottom,
  onToggleWidth,
  onHide,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-md p-4 mb-4 transition-all duration-300 overflow-hidden ${className}`}
      style={{ minHeight: 120, maxWidth: width === 'full' ? '100%' : '100%', transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold truncate mr-2" title={title}>{title}</h2>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <button onClick={onRefresh} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Refresh">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
          {onMoveTop && (
            <button onClick={onMoveTop} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Move to Top">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
          {onMoveBottom && (
            <button onClick={onMoveBottom} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Move to Bottom">
              <ArrowDown className="h-4 w-4" />
            </button>
          )}
          {onToggleWidth && (
            <button onClick={onToggleWidth} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title={width === 'full' ? 'Set to 50%' : 'Set to 100%'}>
              {width === 'full' ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
          )}
          {onHide && (
            <button onClick={onHide} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Hide">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="overflow-hidden text-ellipsis" style={{ maxHeight: '60vh' }}>
        {children}
      </div>
    </div>
  );
};

export default WidgetContainer; 