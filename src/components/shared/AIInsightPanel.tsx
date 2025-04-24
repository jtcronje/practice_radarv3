import React from 'react';
import { Lightbulb } from 'lucide-react';

interface AIInsightPanelProps {
  insights: {
    title: string;
    description: string;
    metrics?: {
      label: string;
      value: string;
      change?: string;
      trend?: 'up' | 'down' | 'neutral';
    }[];
  }[];
}

export default function AIInsightPanel({ insights }: AIInsightPanelProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center mb-4">
        <Lightbulb className="w-5 h-5 text-blue-500 mr-2" />
        <h2 className="text-lg font-semibold">AI Insights</h2>
      </div>
      <div className="space-y-4">
        {insights.map((insight, index) => (
          <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
            <h3 className="font-medium text-gray-900 mb-2">{insight.title}</h3>
            <p className="text-black text-sm mb-3">{insight.description}</p>
            {insight.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {insight.metrics.map((metric, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded">
                    <div className="text-sm text-black">{metric.label}</div>
                    <div className="font-semibold">{metric.value}</div>
                    {metric.change && (
                      <div className={`text-sm ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' :
                        'text-black'
                      }`}>
                        {metric.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 