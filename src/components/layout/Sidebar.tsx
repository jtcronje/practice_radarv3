'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  UserSquare2,
  DollarSign,
  Calculator,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';

const navigation = [
  {
    name: 'Practice Overview',
    href: '/practice-overview',
    icon: LayoutDashboard,
  },
  {
    name: 'Doctor Analysis',
    href: '/doctor-analysis',
    icon: UserSquare2,
  },
  {
    name: 'Financial Analysis',
    href: '/financial-analysis',
    icon: DollarSign,
  },
  {
    name: 'MBT Scenario Modeling',
    href: '/mbt-scenario-modeling',
    icon: Calculator,
  },
  {
    name: 'Patient History',
    href: '/patient-history',
    icon: ClipboardList,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">PracticeRadar</h1>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-md
                ${isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`
                w-5 h-5 mr-3
                ${isActive ? 'text-blue-500' : 'text-gray-400'}
              `} />
              {item.name}
              {isActive && (
                <ChevronRight className="w-4 h-4 ml-auto text-blue-500" />
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <img
              className="h-8 w-8 rounded-full"
              src="https://via.placeholder.com/32"
              alt="User avatar"
            />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Dr. Smith</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
} 