import React from 'react';
import { X } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterBarProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
  doctors: FilterOption[];
  selectedDoctor: string;
  onDoctorChange: (value: string) => void;
  locations: FilterOption[];
  selectedLocation: string;
  onLocationChange: (value: string) => void;
  procedures?: FilterOption[];
  selectedProcedure?: string;
  onProcedureChange?: (value: string) => void;
  onClearFilters: () => void;
  isOpen: boolean;
}

const DATE_RANGES = [
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '45', label: 'Last 45 days' },
  { value: '60', label: 'Last 60 days' },
  { value: '90', label: 'Last 90 days' },
  { value: '180', label: 'Last 180 days' },
  { value: '365', label: 'Last 365 days' },
];

export default function FilterBar({
  dateRange,
  onDateRangeChange,
  doctors,
  selectedDoctor,
  onDoctorChange,
  locations,
  selectedLocation,
  onLocationChange,
  procedures,
  selectedProcedure,
  onProcedureChange,
  onClearFilters,
  isOpen
}: FilterBarProps) {
  if (!isOpen) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Filters</h2>
        <button
          onClick={onClearFilters}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
        >
          <X className="w-4 h-4 mr-1" />
          Clear filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Time Period
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {DATE_RANGES.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Doctor
          </label>
          <select
            value={selectedDoctor}
            onChange={(e) => onDoctorChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Doctors</option>
            {doctors.map((doctor) => (
              <option key={doctor.value} value={doctor.value}>
                {doctor.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <select
            value={selectedLocation}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.value} value={location.value}>
                {location.label}
              </option>
            ))}
          </select>
        </div>

        {/* Procedure Filter */}
        {procedures && onProcedureChange && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Procedure
            </label>
            <select
              value={selectedProcedure}
              onChange={(e) => onProcedureChange(e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">All Procedures</option>
              {procedures.map((procedure) => (
                <option key={procedure.value} value={procedure.value}>
                  {procedure.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
} 