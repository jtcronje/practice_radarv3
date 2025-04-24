'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronLeft, Filter, X, Download } from 'lucide-react';
import _ from 'lodash';

// Import our shared components and utilities
import FilterBar from '@/components/shared/FilterBar';
import MetricCard from '@/components/shared/MetricCard';
import ChartContainer from '@/components/shared/ChartContainer';
import AIInsightPanel from '@/components/shared/AIInsightPanel';
import { 
  loadCSVData, 
  filterByDateRange, 
  formatCurrency,
  BillingRecord,
  ProcedureRecord,
  DoctorRecord,
  HospitalRecord
} from '@/utils/dataProcessing';

const PracticeOverview = () => {
  // State
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [proceduresData, setProceduresData] = useState<ProcedureRecord[]>([]);
  const [doctorsData, setDoctorsData] = useState<DoctorRecord[]>([]);
  const [hospitalsData, setHospitalsData] = useState<HospitalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState('');
  const [uniqueProcedures, setUniqueProcedures] = useState<{code: string, description: string}[]>([]);
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Load billing data
        const billingData = await loadCSVData<BillingRecord>('billing.csv');
        
        // Load procedures data
        const proceduresData = await loadCSVData<ProcedureRecord>('procedures.csv');
        
        // Load doctors data
        const doctorsData = await loadCSVData<DoctorRecord>('doctors.csv');
        
        // Load hospitals data
        const hospitalsData = await loadCSVData<HospitalRecord>('hospitals.csv');
        
        setBillingData(billingData);
        setProceduresData(proceduresData);
        setDoctorsData(doctorsData);
        setHospitalsData(hospitalsData);
        
        // Extract unique procedures for the filter
        const procedures = _.uniqBy(proceduresData, 'Procedure Code').map(proc => ({
          code: proc['Procedure Code'],
          description: proc['Procedure Description'] || 'No description'
        }));
        setUniqueProcedures(procedures);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Filter data by date range
  const filterByDateRangeLocal = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];
    
    const today = new Date();
    const cutoffDate = new Date();
    cutoffDate.setDate(today.getDate() - parseInt(dateRange));
    
    return data.filter((item: any) => {
      if (!item[dateField]) return false;
      const itemDate = new Date(item[dateField]);
      return itemDate >= cutoffDate && itemDate <= today;
    });
  };
  
  // Apply all selected filters to the data
  const applyFilters = (data: any[], dateField: string) => {
    if (!data || data.length === 0) return [];
    
    // Apply date filter
    let filteredData = filterByDateRangeLocal(data, dateField);
    
    // Apply doctor filter if selected
    if (selectedDoctor) {
      filteredData = filteredData.filter((item: any) => item['Provider ID'] === selectedDoctor);
    }
    
    // Apply location filter if selected
    if (selectedLocation) {
      filteredData = filteredData.filter((item: any) => item['Location ID'] === selectedLocation);
    }
    
    // Apply procedure filter if selected
    if (selectedProcedure) {
      filteredData = filteredData.filter((item: any) => item['Procedure Code'] === selectedProcedure);
    }
    
    return filteredData;
  };
  
  // Get filtered procedures data
  const getFilteredProcedures = () => {
    return applyFilters(proceduresData, 'Date of Service');
  };
  
  // Get filtered billings data
  const getFilteredBillings = () => {
    const filteredProcedures = getFilteredProcedures();
    
    if (selectedDoctor || selectedLocation || selectedProcedure) {
      // Get procedure IDs that match our filters
      const procedureIds = filteredProcedures.map((p: any) => p['Procedure Record ID']);
      
      // Filter billings that match these procedure IDs
      const filteredBillings = filterByDateRangeLocal(billingData, 'Date Billed / Claim Submit Date')
        .filter((billing: any) => procedureIds.includes(billing['Procedure Record ID']));
      
      return filteredBillings;
    }
    
    // If no doctor/location/procedure filters, just apply date filter
    return filterByDateRangeLocal(billingData, 'Date Billed / Claim Submit Date');
  };
  
  // Calculate billing metrics
  const getBillingMetrics = () => {
    const filteredBillings = getFilteredBillings();
    
    const totalBilled = filteredBillings.reduce((sum, record) => sum + (record['Billed Amount'] || 0), 0);
    const outstandingAmount = filteredBillings.reduce((sum, record) => sum + (record['Outstanding Amount'] || 0), 0);
    
    return {
      totalBilled,
      outstandingAmount,
      procedureCount: getFilteredProcedures().length
    };
  };
  
  // Get weekly billing trend data
  const getWeeklyBillingTrend = () => {
    const filteredBillings = getFilteredBillings();
    if (!filteredBillings.length) return [];
    
    // Group by week
    const billingsByWeek = _.groupBy(filteredBillings, item => {
      if (!item['Date Billed / Claim Submit Date']) return 'Unknown';
      const date = new Date(item['Date Billed / Claim Submit Date']);
      const weekOfYear = Math.ceil((date.getDate() + 6 - date.getDay()) / 7);
      
      return `Week ${weekOfYear}, ${date.getFullYear()}`;
    });
    
    return Object.keys(billingsByWeek).map(weekKey => {
      const weekBillings = billingsByWeek[weekKey];
      const totalBilled = weekBillings.reduce((sum, record) => sum + (record['Billed Amount'] || 0), 0);
      const outstanding = weekBillings.reduce((sum, record) => sum + (record['Outstanding Amount'] || 0), 0);
      
      return {
        week: weekKey,
        billed: totalBilled,
        outstanding: outstanding
      };
    }).sort((a, b) => {
      const weekA = parseInt(a.week.split(' ')[1]);
      const weekB = parseInt(b.week.split(' ')[1]);
      return weekA - weekB;
    });
  };
  
  // Get doctor billing by procedure type
  const getDoctorBillingByType = () => {
    const filteredProcedures = getFilteredProcedures();
    const filteredBillings = getFilteredBillings();
    
    if (!filteredProcedures.length || !doctorsData.length) return [];
    
    // Map procedure records to doctors and billing amounts
    const doctorBillings = {};
    
    filteredProcedures.forEach(proc => {
      const doctorId = proc['Provider ID'];
      const doctor = doctorsData.find(d => d['Provider ID'] === doctorId);
      
      if (!doctor) return;
      
      const procedureId = proc['Procedure Record ID'];
      const billing = filteredBillings.find(b => b['Procedure Record ID'] === procedureId);
      
      if (!billing) return;
      
      const billedAmount = billing['Billed Amount'] || 0;
      const procedureType = proc['Procedure Code']?.charAt(0) || 'Other';
      
      if (!doctorBillings[doctorId]) {
        doctorBillings[doctorId] = {
          id: doctorId,
          name: doctor['Provider Name'],
          totalBilled: 0,
          A: 0, B: 0, C: 0, D: 0, Other: 0
        };
      }
      
      doctorBillings[doctorId].totalBilled += billedAmount;
      
      // Categorize by first character of procedure code (simplified)
      if (['A', 'B', 'C', 'D'].includes(procedureType)) {
        doctorBillings[doctorId][procedureType] += billedAmount;
      } else {
        doctorBillings[doctorId].Other += billedAmount;
      }
    });
    
    // Convert to array and sort by total billed (smallest to largest)
    return Object.values(doctorBillings)
      .sort((a, b) => a.totalBilled - b.totalBilled);
  };
  
  // Get doctor billing and procedure counts
  const getDoctorBillingAndCounts = () => {
    const filteredProcedures = getFilteredProcedures();
    const filteredBillings = getFilteredBillings();
    
    if (!filteredProcedures.length || !doctorsData.length) return [];
    
    // Group procedures by doctor
    const proceduresByDoctor = _.groupBy(filteredProcedures, 'Provider ID');
    
    // Create mapping from procedure ID to billing amount
    const procedureToBilling = {};
    filteredBillings.forEach(billing => {
      procedureToBilling[billing['Procedure Record ID']] = billing['Billed Amount'] || 0;
    });
    
    // Build doctor stats
    return doctorsData.map(doctor => {
      const doctorId = doctor['Provider ID'];
      const procedures = proceduresByDoctor[doctorId] || [];
      let totalBilled = 0;
      
      procedures.forEach(proc => {
        totalBilled += procedureToBilling[proc['Procedure Record ID']] || 0;
      });
      
      return {
        id: doctorId,
        name: doctor['Provider Name'],
        procedureCount: procedures.length,
        totalBilled
      };
    }).filter(doctor => doctor.procedureCount > 0)
      .sort((a, b) => a.name.localeCompare(b.name));
  };
  
  // Get procedure counts by hospital
  const getHospitalProcedureCounts = () => {
    const filteredProcedures = getFilteredProcedures();
    if (!filteredProcedures.length || !hospitalsData.length) return [];
    
    const proceduresByLocation = _.groupBy(filteredProcedures, 'Location ID');
    
    return hospitalsData.map(hospital => {
      const locId = hospital['Location ID'];
      const procedures = proceduresByLocation[locId] || [];
      
      return {
        id: locId,
        name: hospital['Location Name'],
        procedures: procedures.length
      };
    }).filter(hospital => hospital.procedures > 0)
      .sort((a, b) => b.procedures - a.procedures);
  };
  
  // Handle date range change
  const handleDateRangeChange = (e) => {
    setDateRange(e.target.value);
  };
  
  // Handle filter changes
  const handleDoctorChange = (e) => {
    setSelectedDoctor(e.target.value);
  };
  
  const handleLocationChange = (e) => {
    setSelectedLocation(e.target.value);
  };
  
  const handleProcedureChange = (e) => {
    setSelectedProcedure(e.target.value);
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSelectedDoctor('');
    setSelectedLocation('');
    setSelectedProcedure('');
  };
  
  // Toggle filter sidebar
  const toggleFilters = () => {
    setFiltersOpen(!filtersOpen);
  };
  
  // Generate and download report
  const downloadReport = () => {
    const metrics = getBillingMetrics();
    const doctorData = getDoctorBillingByType();
    const hospitalData = getHospitalProcedureCounts();
    
    let csvContent = "PracticeRadar Billing Report\n";
    csvContent += `Date Range: Last ${dateRange} days\n\n`;
    
    // Add summary metrics
    csvContent += "Summary Metrics:\n";
    csvContent += `Total Billed: $${metrics.totalBilled.toFixed(2)}\n`;
    csvContent += `Outstanding: $${metrics.outstandingAmount.toFixed(2)}\n`;
    csvContent += `Total Procedures: ${metrics.procedureCount}\n\n`;
    
    // Add doctor billing breakdown
    csvContent += "Doctor Billing Breakdown:\n";
    csvContent += "Doctor,Total Billed\n";
    
    doctorData.forEach(doctor => {
      csvContent += `"${doctor.name}",$${doctor.totalBilled.toFixed(2)}\n`;
    });
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'PracticeRadar_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Convert doctor data for the filter component
  const doctorOptions = doctorsData.map(doctor => ({
    value: doctor['Provider ID'],
    label: doctor['Provider Name']
  }));

  // Convert hospital data for the filter component
  const locationOptions = hospitalsData.map(hospital => ({
    value: hospital['Location ID'],
    label: hospital['Location Name']
  }));

  // Convert procedure data for the filter component
  const procedureOptions = uniqueProcedures.map(procedure => ({
    value: procedure.code,
    label: `${procedure.code}: ${procedure.description}`
  }));
  
  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-xl font-semibold text-gray-700">Loading dashboard data...</div>
      </div>
    );
  }
  
  // Calculate all metrics and data for charts
  const metrics = getBillingMetrics();
  const weeklyTrend = getWeeklyBillingTrend();
  const doctorBillingByType = getDoctorBillingByType();
  const doctorStats = getDoctorBillingAndCounts();
  const hospitalStats = getHospitalProcedureCounts();
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex">
        {/* Left Filter Pane */}
        <div className={`${filtersOpen ? 'w-64' : 'w-14'} bg-white min-h-screen shadow-md transition-all duration-300`}>
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              {filtersOpen && <h2 className="font-semibold text-gray-700">Filters</h2>}
              <button 
                onClick={toggleFilters} 
                className="p-1 rounded-full hover:bg-gray-100"
              >
                {filtersOpen ? <ChevronLeft size={18} /> : <Filter size={18} />}
              </button>
            </div>
          </div>
          
          {filtersOpen && (
            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                <select 
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm"
                >
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="45">Last 45 Days</option>
                  <option value="60">Last 60 Days</option>
                  <option value="90">Last 90 Days</option>
                  <option value="180">Last 180 Days</option>
                  <option value="365">Last 365 Days</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select 
                  value={selectedDoctor}
                  onChange={handleDoctorChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm"
                >
                  <option value="">All Doctors</option>
                  {doctorOptions.map(doctor => (
                    <option key={doctor.value} value={doctor.value}>
                      {doctor.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select 
                  value={selectedLocation}
                  onChange={handleLocationChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm"
                >
                  <option value="">All Locations</option>
                  {locationOptions.map(location => (
                    <option key={location.value} value={location.value}>
                      {location.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
                <select 
                  value={selectedProcedure}
                  onChange={handleProcedureChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 bg-white text-sm"
                >
                  <option value="">All Procedures</option>
                  {procedureOptions.map(procedure => (
                    <option key={procedure.value} value={procedure.value}>
                      {procedure.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {(selectedDoctor || selectedLocation || selectedProcedure) && (
                <button 
                  onClick={clearFilters}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <X size={14} className="mr-1" />
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <h1 className="text-2xl font-bold text-gray-800">Practice Overview</h1>
                
                <button 
                  onClick={downloadReport}
                  className="mt-2 md:mt-0 flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  <Download size={16} className="mr-2" />
                  Download Report
                </button>
              </div>
            </div>
            
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Billed</h3>
                <p className="text-3xl font-bold text-blue-600">
                  ${metrics.totalBilled.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-2">Last {dateRange} days</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Outstanding</h3>
                <p className="text-3xl font-bold text-red-600">
                  ${metrics.outstandingAmount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  {metrics.totalBilled > 0 ? 
                    `${((metrics.outstandingAmount / metrics.totalBilled) * 100).toFixed(1)}% of total` : 
                    '0% of total'}
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Total Procedures</h3>
                <p className="text-3xl font-bold text-green-600">{metrics.procedureCount}</p>
                <p className="text-sm text-gray-500 mt-2">Last {dateRange} days</p>
              </div>
            </div>
            
            {/* Performance Insight */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex items-center mb-2">
                <span className="bg-purple-100 text-purple-800 font-medium rounded-full px-3 py-1 text-sm mr-2">Insight</span>
                <h2 className="text-xl font-semibold text-gray-800">Performance Trends</h2>
              </div>
              <p className="text-gray-700">
                Analyzing your practice data over the last {dateRange} days shows 
                {metrics.totalBilled > 100000 ? 
                  ' strong billing performance.' : 
                  metrics.totalBilled > 50000 ? 
                    ' steady billing performance.' : 
                    ' potential opportunities to increase billing volume.'}
                {metrics.outstandingAmount / metrics.totalBilled > 0.3 ? 
                  ' Consider focusing on outstanding payment collection.' : 
                  ' Your outstanding balance ratio is healthy.'}
              </p>
            </div>
            
            {/* Weekly Billing Trend Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Billing Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={weeklyTrend}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Line type="monotone" dataKey="billed" stroke="#0088FE" name="Total Billed" />
                    <Line type="monotone" dataKey="outstanding" stroke="#FF8042" name="Outstanding" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Doctor Billing By Type - Horizontal Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Billing by Procedure Type</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={doctorBillingByType}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="A" stackId="a" fill="#0088FE" name="Type A" />
                    <Bar dataKey="B" stackId="a" fill="#00C49F" name="Type B" />
                    <Bar dataKey="C" stackId="a" fill="#FFBB28" name="Type C" />
                    <Bar dataKey="D" stackId="a" fill="#FF8042" name="Type D" />
                    <Bar dataKey="Other" stackId="a" fill="#8884d8" name="Other" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Doctor Billing and Procedures - Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Doctor Billing vs Procedure Count</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={doctorStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#0088FE" />
                    <YAxis yAxisId="right" orientation="right" stroke="#FF8042" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="totalBilled" fill="#0088FE" name="Total Billed ($)" />
                    <Bar yAxisId="right" dataKey="procedureCount" fill="#FF8042" name="Procedure Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Hospital Procedures - Bar Chart */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Procedures by Location</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hospitalStats}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="procedures" fill="#82ca9d" name="Procedure Count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeOverview;