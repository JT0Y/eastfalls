import React, { ReactNode } from 'react';

interface WidgetCardProps {
  title: string;
  children: ReactNode;
  className?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-md overflow-hidden border border-gray-100 dark:border-gray-800 transition-all duration-300 hover:shadow-lg min-w-0 ${className}`}>
      <div className="border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between">
        <h2 className="font-medium text-gray-800 dark:text-gray-200 truncate">{title}</h2>
      </div>
      <div className="overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default WidgetCard;