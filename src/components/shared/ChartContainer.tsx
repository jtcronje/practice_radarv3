import React, { ReactNode } from 'react';
import { Download } from 'lucide-react';

interface ChartContainerProps {
  title: string;
  children: ReactNode;
  onDownload?: () => void;
  description?: string;
}

export default function ChartContainer({
  title,
  children,
  onDownload,
  description
}: ChartContainerProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {onDownload && (
          <button
            onClick={onDownload}
            className="text-gray-500 hover:text-gray-700"
            title="Download data"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>
      <div className="w-full h-[300px]">
        {children}
      </div>
    </div>
  );
} 