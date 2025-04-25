"use client";

import React from "react";
import Link from "next/link";
import { Stethoscope, BarChart3, Activity, Users } from "lucide-react";

const NAV_TILES = [
  {
    href: "/doctor-analysis",
    icon: Stethoscope,
    title: "Doctor Analysis",
    desc: "Deep dive into doctor performance and trends."
  },
  {
    href: "/financial-analysis",
    icon: BarChart3,
    title: "Financial Analysis",
    desc: "Monitor revenue, billing, and financial KPIs."
  },
  {
    href: "/mbt-scenario-modeling",
    icon: Activity,
    title: "MBT Scenario Modeling",
    desc: "Model the impact of MBT changes and scenarios."
  },
  {
    href: "/patient-history",
    icon: Users,
    title: "Patient History",
    desc: "Review and analyze patient histories."
  }
];

const quickMetrics = [
  { label: "Doctors", value: 12 },
  { label: "Patients", value: 320 },
  { label: "Revenue (YTD)", value: "$1.2M" },
  { label: "Outstanding", value: "$150K" }
];

const PracticeOverview: React.FC = () => {
  return (
    <div className="bg-gradient-to-b from-white to-blue-50 min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">

        {/* Welcome Section */}
        <div className="max-w-2xl text-center mb-10 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4">Welcome to Your Practice Dashboard</h1>
          <p className="text-lg md:text-xl text-gray-700 mb-2">
            A unified view for medical professionals to analyze performance, model scenarios, and monitor key metrics—all in one place.
          </p>
        </div>
        {/* Navigation Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
          {NAV_TILES.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                href={tile.href}
                key={tile.href}
                className="group bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center transition-transform transform hover:-translate-y-1 hover:shadow-2xl hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 animate-fade-in-up"
              >
                <div className="mb-4 group-hover:scale-110 transition-transform duration-200">
                  <Icon className="h-10 w-10 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-blue-900 mb-2">{tile.title}</h2>
                <p className="text-gray-600 text-center text-base mb-2">{tile.desc}</p>
              </Link>
            );
          })}
        </div>
      </main>
      <style jsx global>{`
        .animate-fade-in {
          animation: fadeIn 0.7s ease-in;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.7s cubic-bezier(.39,.575,.565,1.000);
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {/* User Indicator */}
      <div className="fixed bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow text-sm text-blue-900 font-medium z-50">
        Dr. Ras is logged in
      </div>
    </div>
  );
};

export default PracticeOverview;
