'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PieChart, Pie, Cell } from 'recharts';
import Papa from 'papaparse';
import _ from 'lodash';

// Import our utility functions for loading CSV data
import { 
  loadCSVData,
  BillingRecord,
  ProcedureRecord,
  DoctorRecord,
  HospitalRecord,
  PatientRecord,
  formatCurrency as formatCurrencyUtil
} from '@/utils/dataProcessing';

// Define interface for app data
interface AppData {
  doctors: DoctorRecord[];
  procedures: ProcedureRecord[];
  billing: BillingRecord[];
  patients: PatientRecord[];
  hospitals: HospitalRecord[];
}

// Define doctor metrics interface
interface DoctorMetrics {
  totalBillings: number;
  outstandingBillings: number;
  proceduresCount: number;
  uniquePatients: number;
}

// Define comparison metrics interface
interface ComparisonMetrics {
  totalBillings: number;
  outstandingBillings: number;
  proceduresCount: number;
  uniquePatients: number;
}

// Define metrics interface
interface Metrics {
  doctor: DoctorMetrics;
  comparison: ComparisonMetrics;
}

const DoctorAnalysisPage = () => {
  // State to store loaded data
  const [data, setData] = useState<AppData>({
    doctors: [],
    procedures: [],
    billing: [],
    patients: [],
    hospitals: []
  });
  
  // State for UI filters
  const [filters, setFilters] = useState({
    selectedDoctor: '',
    comparisonDoctors: [],
    startDate: '',
    endDate: '',
    location: 'all'
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Add metrics state with proper typing
  const [metrics, setMetrics] = useState<Metrics>({
    doctor: {
      totalBillings: 0,
      outstandingBillings: 0,
      proceduresCount: 0,
      uniquePatients: 0
    },
    comparison: {
      totalBillings: 0,
      outstandingBillings: 0,
      proceduresCount: 0,
      uniquePatients: 0
    }
  });
  
  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Parallel file loading using our utility function
        const [doctors, procedures, billing, patients, hospitals] = await Promise.all([
          loadCSVData<DoctorRecord>('doctors.csv'),
          loadCSVData<ProcedureRecord>('procedures.csv'),
          loadCSVData<BillingRecord>('billing.csv'),
          loadCSVData<PatientRecord>('patients.csv'),
          loadCSVData<HospitalRecord>('hospitals.csv')
        ]);
        
        // Set state with parsed data
        setData({ doctors, procedures, billing, patients, hospitals });
        
        // Set default selected doctor if available
        if (doctors.length > 0) {
          setFilters(prev => ({
            ...prev,
            selectedDoctor: doctors[0]['Provider ID']
          }));
        }
        
        // Set default date range (last 6 months)
        const today = new Date();
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        
        setFilters(prev => ({
          ...prev,
          startDate: sixMonthsAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }));
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error loading data:", error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Memoize filtered procedures to avoid recalculation
  const filteredProcedures = useMemo(() => {
    if (isLoading || !filters.selectedDoctor) return { doctor: [], comparison: [] };
    
    const { procedures } = data;
    const { selectedDoctor, comparisonDoctors, startDate, endDate, location } = filters;
    
    // Filter by date range and location
    const dateAndLocationFiltered = procedures.filter(proc => 
      new Date(proc['Date of Service']) >= new Date(startDate) &&
      new Date(proc['Date of Service']) <= new Date(endDate) &&
      (location === 'all' || proc['Location ID'] === location)
    );
    
    // Doctor's procedures
    const doctorProcedures = dateAndLocationFiltered.filter(proc => 
      proc['Provider ID'] === selectedDoctor
    );
    
    // Comparison procedures
    let comparisonProviderIds;
    if (comparisonDoctors.length > 0) {
      comparisonProviderIds = comparisonDoctors;
    } else {
      comparisonProviderIds = data.doctors
        .map(doc => doc['Provider ID'])
        .filter(id => id !== selectedDoctor);
    }
    
    const comparisonProcedures = dateAndLocationFiltered.filter(proc => 
      comparisonProviderIds.includes(proc['Provider ID'])
    );
    
    return { 
      doctor: doctorProcedures, 
      comparison: comparisonProcedures, 
      comparisonProviderIds
    };
  }, [data, filters, isLoading]);
  
  // Memoize metrics calculations
  const metricsCalculations = useMemo(() => {
    if (isLoading || !filters.selectedDoctor || !filteredProcedures.doctor) {
      return { doctor: {}, comparison: {} };
    }
    
    const { doctor: doctorProcedures, comparison: comparisonProcedures, comparisonProviderIds } = filteredProcedures;
    const totalComparisonDoctors = comparisonProviderIds?.length || 1;
    
    // Get procedure IDs
    const doctorProcedureIds = doctorProcedures.map(proc => proc['Procedure Record ID']);
    const comparisonProcedureIds = comparisonProcedures.map(proc => proc['Procedure Record ID']);
    
    // Filter billing data by procedures
    const doctorBillings = data.billing.filter(bill => 
      doctorProcedureIds.includes(bill['Procedure Record ID'])
    );
    
    const comparisonBillings = data.billing.filter(bill => 
      comparisonProcedureIds.includes(bill['Procedure Record ID'])
    );
    
    // Calculate doctor metrics
    const doctorMetrics = {
      totalBillings: _.sumBy(doctorBillings, bill => Number(bill['Billed Amount']) || 0),
      outstandingBillings: _.sumBy(doctorBillings, bill => Number(bill['Outstanding Amount']) || 0),
      proceduresCount: doctorProcedures.length,
      uniquePatients: _.uniqBy(doctorProcedures, 'Patient ID').length
    };
    
    // Calculate comparison metrics (average per doctor)
    const comparisonMetrics = {
      totalBillings: _.sumBy(comparisonBillings, bill => Number(bill['Billed Amount']) || 0) / totalComparisonDoctors,
      outstandingBillings: _.sumBy(comparisonBillings, bill => Number(bill['Outstanding Amount']) || 0) / totalComparisonDoctors,
      proceduresCount: comparisonProcedures.length / totalComparisonDoctors
    };
    
    // Calculate unique patients per doctor on average
    const patientsByDoctor = _.groupBy(comparisonProcedures, 'Provider ID');
    const uniquePatientsPerDoctor = Object.values(patientsByDoctor).map(
      doctorProcs => _.uniqBy(doctorProcs, 'Patient ID').length
    );
    comparisonMetrics.uniquePatients = uniquePatientsPerDoctor.length ? 
      _.sum(uniquePatientsPerDoctor) / uniquePatientsPerDoctor.length : 0;
    
    return { doctor: doctorMetrics, comparison: comparisonMetrics };
  }, [filteredProcedures, data.billing, isLoading, filters.selectedDoctor]);
  
  // Memoize trend data calculations
  const trendData = useMemo(() => {
    if (isLoading || !filters.selectedDoctor || !filteredProcedures.doctor) {
      return { procedures: [], billings: [] };
    }
    
    const { doctor: doctorProcedures, comparison: comparisonProcedures, comparisonProviderIds } = filteredProcedures;
    const totalComparisonDoctors = comparisonProviderIds?.length || 1;
    
    // Get procedure IDs
    const doctorProcedureIds = doctorProcedures.map(proc => proc['Procedure Record ID']);
    const comparisonProcedureIds = comparisonProcedures.map(proc => proc['Procedure Record ID']);
    
    // Filter billing data by procedures
    const doctorBillings = data.billing.filter(bill => 
      doctorProcedureIds.includes(bill['Procedure Record ID'])
    );
    
    const comparisonBillings = data.billing.filter(bill => 
      comparisonProcedureIds.includes(bill['Procedure Record ID'])
    );
    
    // Group procedures by month
    const doctorProceduresByMonth = _.groupBy(doctorProcedures, proc => 
      new Date(proc['Date of Service']).toISOString().slice(0, 7)
    );
    
    const comparisonProceduresByMonth = _.groupBy(comparisonProcedures, proc => 
      new Date(proc['Date of Service']).toISOString().slice(0, 7)
    );
    
    // Group billings by month
    const doctorBillingsByMonth = _.groupBy(doctorBillings, bill => 
      new Date(bill['Date Billed / Claim Submit Date']).toISOString().slice(0, 7)
    );
    
    const comparisonBillingsByMonth = _.groupBy(comparisonBillings, bill => 
      new Date(bill['Date Billed / Claim Submit Date']).toISOString().slice(0, 7)
    );
    
    // Get all months from both datasets
    const allMonths = new Set([
      ...Object.keys(doctorProceduresByMonth),
      ...Object.keys(comparisonProceduresByMonth),
      ...Object.keys(doctorBillingsByMonth),
      ...Object.keys(comparisonBillingsByMonth)
    ]);
    
    // Create combined procedures data
    const proceduresData = Array.from(allMonths).sort().map(month => ({
      month,
      selectedDoctor: (doctorProceduresByMonth[month] || []).length,
      comparison: (comparisonProceduresByMonth[month] || []).length / totalComparisonDoctors
    }));
    
    // Create combined billings data
    const billingsData = Array.from(allMonths).sort().map(month => ({
      month,
      selectedDoctor: _.sumBy(
        doctorBillingsByMonth[month] || [], 
        bill => Number(bill['Billed Amount']) || 0
      ),
      comparison: _.sumBy(
        comparisonBillingsByMonth[month] || [], 
        bill => Number(bill['Billed Amount']) || 0
      ) / totalComparisonDoctors
    }));
    
    return { procedures: proceduresData, billings: billingsData };
  }, [filteredProcedures, data.billing, isLoading, filters.selectedDoctor]);
  
  // Generate AI insight
  const aiInsight = useMemo(() => {
    if (isLoading || !metrics.doctor.proceduresCount || !metrics.comparison.proceduresCount) {
      return 'Insufficient data to generate insights.';
    }
    
    const { doctor: doctorMetrics, comparison: comparisonMetrics } = metrics;
    const selectedDoctorName = data.doctors.find(d => d['Provider ID'] === filters.selectedDoctor)?.['Provider Name'] || 'Selected doctor';
    
    // Calculate performance differences
    const billingDiffPercent = ((doctorMetrics.totalBillings / comparisonMetrics.totalBillings) - 1) * 100;
    const proceduresDiffPercent = ((doctorMetrics.proceduresCount / comparisonMetrics.proceduresCount) - 1) * 100;
    const patientsDiffPercent = ((doctorMetrics.uniquePatients / comparisonMetrics.uniquePatients) - 1) * 100;
    const outstandingRatio = doctorMetrics.outstandingBillings / doctorMetrics.totalBillings;
    const compOutstandingRatio = comparisonMetrics.outstandingBillings / comparisonMetrics.totalBillings;
    
    // Detect trends
    let procedureTrend = "stable";
    if (trendData.procedures.length > 1) {
      const firstHalf = trendData.procedures.slice(0, trendData.procedures.length / 2);
      const secondHalf = trendData.procedures.slice(trendData.procedures.length / 2);
      
      const firstHalfAvg = _.meanBy(firstHalf, 'selectedDoctor');
      const secondHalfAvg = _.meanBy(secondHalf, 'selectedDoctor');
      
      if (secondHalfAvg > firstHalfAvg * 1.1) {
        procedureTrend = "increasing";
      } else if (secondHalfAvg < firstHalfAvg * 0.9) {
        procedureTrend = "decreasing";
      }
    }
    
    // Generate insight text
    let insight = `${selectedDoctorName}'s performance analysis: `;
    
    // Overall performance assessment
    if (Math.abs(billingDiffPercent) < 10 && Math.abs(proceduresDiffPercent) < 10) {
      insight += `Performance is generally on par with peers. `;
    } else if (billingDiffPercent > 10 && proceduresDiffPercent > 10) {
      insight += `Performance is significantly above average, with ${billingDiffPercent.toFixed(1)}% higher billing and ${proceduresDiffPercent.toFixed(1)}% more procedures than peers. `;
    } else if (billingDiffPercent < -10 && proceduresDiffPercent < -10) {
      insight += `Performance is below average, with ${Math.abs(billingDiffPercent).toFixed(1)}% lower billing and ${Math.abs(proceduresDiffPercent).toFixed(1)}% fewer procedures than peers. `;
    } else {
      insight += `Mixed performance metrics compared to peers. `;
    }
    
    // Outstanding billing assessment
    if (outstandingRatio > compOutstandingRatio * 1.2) {
      insight += `Outstanding billing ratio (${(outstandingRatio * 100).toFixed(1)}%) is higher than peers (${(compOutstandingRatio * 100).toFixed(1)}%), suggesting potential collection issues. `;
    } else if (outstandingRatio < compOutstandingRatio * 0.8) {
      insight += `Outstanding billing ratio (${(outstandingRatio * 100).toFixed(1)}%) is lower than peers (${(compOutstandingRatio * 100).toFixed(1)}%), indicating effective collection practices. `;
    }
    
    // Trend assessment
    insight += `Procedure volume has been ${procedureTrend} over the selected period. `;
    
    // Patient volume assessment
    if (patientsDiffPercent > 10) {
      insight += `The doctor sees ${patientsDiffPercent.toFixed(1)}% more unique patients than peers, suggesting higher patient retention or referral rates.`;
    } else if (patientsDiffPercent < -10) {
      insight += `The doctor sees ${Math.abs(patientsDiffPercent).toFixed(1)}% fewer unique patients than peers, which may indicate opportunities for improved patient retention.`;
    } else {
      insight += `Patient volume is comparable to peers.`;
    }
    
    return insight;
  }, [metrics, trendData.procedures, data.doctors, filters.selectedDoctor, isLoading]);
  
  // Use our formatCurrency utility function
  const formatCurrency = (value: number): string => {
    return formatCurrencyUtil(value);
  };
  
  // Handle doctor selection
  const handleDoctorChange = (e) => {
    setFilters(prev => ({
      ...prev,
      selectedDoctor: e.target.value
    }));
  };
  
  // Handle comparison doctors selection
  const handleComparisonChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(option => option.value);
    setFilters(prev => ({
      ...prev,
      comparisonDoctors: selected
    }));
  };
  
  // Handle date change
  const handleDateChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle location change
  const handleLocationChange = (e) => {
    setFilters(prev => ({
      ...prev,
      location: e.target.value
    }));
  };
  
  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-2 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Doctor Performance Analysis</h1>
      
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Doctor
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.selectedDoctor}
              onChange={handleDoctorChange}
            >
              {data.doctors.map(doctor => (
                <option key={doctor['Provider ID']} value={doctor['Provider ID']}>
                  {doctor['Provider Name']}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compare With
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              multiple
              value={filters.comparisonDoctors}
              onChange={handleComparisonChange}
              size="1"
            >
              {data.doctors
                .filter(doctor => doctor['Provider ID'] !== filters.selectedDoctor)
                .map(doctor => (
                  <option key={doctor['Provider ID']} value={doctor['Provider ID']}>
                    {doctor['Provider Name']}
                  </option>
                ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              If none selected, comparison uses average of all other doctors
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              value={filters.location}
              onChange={handleLocationChange}
            >
              <option value="all">All Locations</option>
              {data.hospitals.map(hospital => (
                <option key={hospital['Location ID']} value={hospital['Location ID']}>
                  {hospital['Location Name']}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Key Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Billings</h3>
          <div className="text-2xl font-bold">{formatCurrency(metrics.doctor.totalBillings || 0)}</div>
          <div className="text-sm text-gray-500 mt-1">
            vs {formatCurrency(metrics.comparison.totalBillings || 0)} average
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Outstanding Billings</h3>
          <div className="text-2xl font-bold">{formatCurrency(metrics.doctor.outstandingBillings || 0)}</div>
          <div className="text-sm text-gray-500 mt-1">
            vs {formatCurrency(metrics.comparison.outstandingBillings || 0)} average
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Procedures Performed</h3>
          <div className="text-2xl font-bold">{metrics.doctor.proceduresCount || 0}</div>
          <div className="text-sm text-gray-500 mt-1">
            vs {(metrics.comparison.proceduresCount || 0).toFixed(0)} average
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Unique Patients</h3>
          <div className="text-2xl font-bold">{metrics.doctor.uniquePatients || 0}</div>
          <div className="text-sm text-gray-500 mt-1">
            vs {(metrics.comparison.uniquePatients || 0).toFixed(0)} average
          </div>
        </div>
      </div>
      
      {/* Comparison Charts Section */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Comparison</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Total Billings Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.billings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="selectedDoctor" 
                  name={data.doctors.find(d => d['Provider ID'] === filters.selectedDoctor)?.['Provider Name'] || 'Selected Doctor'}
                  stroke="#2563eb" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="comparison" 
                  name={filters.comparisonDoctors.length > 0 ? 'Selected Comparison' : 'Average of Other Doctors'} 
                  stroke="#dc2626" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Procedures Performed Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData.procedures}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="selectedDoctor" 
                  name={data.doctors.find(d => d['Provider ID'] === filters.selectedDoctor)?.['Provider Name'] || 'Selected Doctor'}
                  stroke="#2563eb" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="comparison" 
                  name={filters.comparisonDoctors.length > 0 ? 'Selected Comparison' : 'Average of Other Doctors'} 
                  stroke="#dc2626" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* AI Insights Section */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">AI Insights</h2>
        <div className="flex items-start">
          <svg className="h-6 w-6 text-blue-500 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <p className="text-gray-700">
            {aiInsight}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DoctorAnalysisPage;