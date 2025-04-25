'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, AlertCircle, Activity, Users, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import _ from 'lodash';

// Import our utility functions for loading CSV data
import { 
  loadCSVData,
  BillingRecord,
  ProcedureRecord,
  DoctorRecord,
  HospitalRecord,
  PatientRecord,
  formatCurrency
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

// Define filters interface
interface Filters {
  selectedDoctor: string;
  comparisonDoctor: string;
  startDate: string;
  endDate: string;
  location: string;
}

// MetricCard component
interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, trend, icon, color }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-black text-sm font-medium">{title}</h3>
        <div className={`p-2 rounded-full bg-${color}-100`}>
          {icon}
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-semibold text-black">{value}</div>
        {trend && (
          <div className="flex items-center mt-1">
            {trend.direction === 'up' && <TrendingUp className="h-4 w-4 text-green-500 mr-1" />}
            {trend.direction === 'down' && <TrendingDown className="h-4 w-4 text-red-500 mr-1" />}
            {trend.direction === 'neutral' && <Minus className="h-4 w-4 text-black mr-1" />}
            <span className={`text-sm ${
              trend.direction === 'up' ? 'text-green-500' : 
              trend.direction === 'down' ? 'text-red-500' : 'text-black'
            }`}>
              {trend.value}
            </span>
          </div>
        )}
      </div>
      {/* User Indicator */}
  <div className="fixed bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow text-sm text-blue-900 font-medium z-50">
    Dr. Ras is logged in
  </div>
</div>
  );
};

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
  const [filters, setFilters] = useState<Filters>({
    selectedDoctor: '',
    comparisonDoctor: '',
    startDate: '',
    endDate: '',
    location: 'all'
  });
  
  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  
  // Metrics state with proper typing
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
  
  // Memoize filtered procedures to avoid recalculation
  const filteredProcedures = useMemo(() => {
    if (isLoading || !filters.selectedDoctor) return { doctor: [], comparison: [], comparisonProviderIds: [] };
    
    const { procedures } = data;
    const { selectedDoctor, comparisonDoctor, startDate, endDate, location } = filters;
    
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
    let comparisonProviderIds: string[] = [];
    if (comparisonDoctor) {
      comparisonProviderIds = [comparisonDoctor];
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
      return {
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
      };
    }
    
    const { doctor: doctorProcedures, comparison: comparisonProcedures, comparisonProviderIds } = filteredProcedures;
    const totalComparisonDoctors = comparisonProviderIds.length || 1;
    
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
    const doctorMetrics: DoctorMetrics = {
      totalBillings: _.sumBy(doctorBillings, bill => Number(bill['Billed Amount']) || 0),
      outstandingBillings: _.sumBy(doctorBillings, bill => Number(bill['Outstanding Amount']) || 0),
      proceduresCount: doctorProcedures.length,
      uniquePatients: new Set(doctorProcedures.map(proc => proc['Patient ID'])).size
    };
    
    // Calculate comparison metrics (average per doctor)
    const comparisonMetrics: ComparisonMetrics = {
      totalBillings: _.sumBy(comparisonBillings, bill => Number(bill['Billed Amount']) || 0) / totalComparisonDoctors,
      outstandingBillings: _.sumBy(comparisonBillings, bill => Number(bill['Outstanding Amount']) || 0) / totalComparisonDoctors,
      proceduresCount: comparisonProcedures.length / totalComparisonDoctors,
      uniquePatients: 0 // Will be calculated below
    };
    
    // Calculate unique patients per doctor on average
    const patientsByDoctor = _.groupBy(comparisonProcedures, 'Provider ID');
    const uniquePatientsPerDoctor = Object.values(patientsByDoctor).map(
      doctorProcs => new Set(doctorProcs.map(proc => proc['Patient ID'])).size
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
    const totalComparisonDoctors = comparisonProviderIds.length || 1;
    
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
    if (isLoading || !metricsCalculations.doctor.proceduresCount || !metricsCalculations.comparison.proceduresCount) {
      return 'Insufficient data to generate insights.';
    }
    
    const { doctor: doctorMetrics, comparison: comparisonMetrics } = metricsCalculations;
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
  }, [metricsCalculations, trendData.procedures, data.doctors, filters.selectedDoctor, isLoading]);
  
  // Update metrics when calculations change
  useEffect(() => {
    if (!isLoading && metricsCalculations.doctor.proceduresCount > 0) {
      setMetrics(metricsCalculations);
    }
  }, [metricsCalculations, isLoading]);
  
  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load data from CSV files
        const doctors = await loadCSVData<DoctorRecord>('doctors.csv');
        const procedures = await loadCSVData<ProcedureRecord>('procedures.csv');
        const billing = await loadCSVData<BillingRecord>('billing.csv');
        const patients = await loadCSVData<PatientRecord>('patients.csv');
        const hospitals = await loadCSVData<HospitalRecord>('hospitals.csv');
        
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
  
  // Handle doctor selection change
  const handleDoctorChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      selectedDoctor: event.target.value
    }));
  };
  
  // Handle comparison doctor selection
  const handleComparisonChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      comparisonDoctor: event.target.value
    }));
  };
  
  // Handle date change
  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle location change
  const handleLocationChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({
      ...prev,
      location: event.target.value
    }));
  };
  
  
  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-black mb-6">Doctor Performance Analysis</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-blue-500">Loading data...</div>
          </div>
        ) : (
          <>
            {/* Filters Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Doctor
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
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
                  <label className="block text-sm font-medium text-black mb-2">
                    Compare With
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    value={filters.comparisonDoctor}
                    onChange={handleComparisonChange}
                  >
                    <option value="">Average of All Other Doctors</option>
                    {data.doctors
                      .filter(doctor => doctor['Provider ID'] !== filters.selectedDoctor)
                      .map(doctor => (
                        <option key={doctor['Provider ID']} value={doctor['Provider ID']}>
                          {doctor['Provider Name']}
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-black mt-1">
                    If none selected, comparison uses average of all other doctors
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    value={filters.startDate}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
                    value={filters.endDate}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Location
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <MetricCard
                title="Total Billings"
                value={formatCurrency(metrics.doctor.totalBillings)}
                icon={<DollarSign size={20} color="#3B82F6" />}
                trend={{
                  value: `${((metrics.doctor.totalBillings / metrics.comparison.totalBillings - 1) * 100).toFixed(1)}%`,
                  direction: metrics.doctor.totalBillings >= metrics.comparison.totalBillings ? 'up' : 'down'
                }}
                color="blue"
              />
              
              <MetricCard
                title="Outstanding Amount"
                value={formatCurrency(metrics.doctor.outstandingBillings)}
                icon={<AlertCircle size={20} color="#EAB308" />}
                trend={{
                  value: `${((metrics.doctor.outstandingBillings / metrics.doctor.totalBillings) * 100).toFixed(1)}%`,
                  direction: (metrics.doctor.outstandingBillings / metrics.doctor.totalBillings) <= (metrics.comparison.outstandingBillings / metrics.comparison.totalBillings) ? 'up' : 'down'
                }}
                color="yellow"
              />
              
              <MetricCard
                title="Procedures"
                value={metrics.doctor.proceduresCount}
                icon={<Activity size={20} color="#22C55E" />}
                trend={{
                  value: `${((metrics.doctor.proceduresCount / metrics.comparison.proceduresCount - 1) * 100).toFixed(1)}%`,
                  direction: metrics.doctor.proceduresCount >= metrics.comparison.proceduresCount ? 'up' : 'down'
                }}
                color="green"
              />
              
              <MetricCard
                title="Unique Patients"
                value={metrics.doctor.uniquePatients}
                icon={<Users size={20} color="#A855F7" />}
                trend={{
                  value: `${((metrics.doctor.uniquePatients / metrics.comparison.uniquePatients - 1) * 100).toFixed(1)}%`,
                  direction: metrics.doctor.uniquePatients >= metrics.comparison.uniquePatients ? 'up' : 'down'
                }}
                color="purple"
              />
            </div>
            
            {/* AI Insight */}
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-100 mb-6">
              <div className="flex items-start">
                <Lightbulb className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-2">Performance Insights</h3>
                  <p className="text-black">
                    {aiInsight}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Comparison Charts Section */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <h2 className="text-xl font-semibold text-black mb-4">Performance Comparison</h2>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-black mb-2">Total Billings Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData.billings}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
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
                        name={filters.comparisonDoctor ? data.doctors.find(d => d['Provider ID'] === filters.comparisonDoctor)?.['Provider Name'] : 'Average of Other Doctors'} 
                        stroke="#dc2626" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-black mb-2">Procedures Performed Trend</h3>
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
                        name={filters.comparisonDoctor ? data.doctors.find(d => d['Provider ID'] === filters.comparisonDoctor)?.['Provider Name'] : 'Average of Other Doctors'} 
                        stroke="#dc2626" 
                        strokeWidth={2} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      {/* User Indicator */}
  <div className="fixed bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow text-sm text-blue-900 font-medium z-50">
    Dr. Ras is logged in
  </div>
</div>
  );
};

export default DoctorAnalysisPage;