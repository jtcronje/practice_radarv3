import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  description?: string;
}

export default function MetricCard({ title, value, icon: Icon, trend, description }: MetricCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-blue-50 p-2 rounded-lg mr-4">
            <Icon className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">{title}</h3>
            <div className="text-2xl font-semibold mt-1">{value}</div>
          </div>
        </div>
        {trend && (
          <div className={`text-sm ${
            trend.direction === 'up' ? 'text-green-600' :
            trend.direction === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {trend.value}
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
} 