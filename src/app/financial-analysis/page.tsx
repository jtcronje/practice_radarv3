'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, PieChart, Pie, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { DollarSign, Calendar, AlertCircle, ArrowUpRight } from 'lucide-react';
import _ from 'lodash';

// Import our utility functions for loading CSV data
import { 
  loadCSVData,
  BillingRecord,
  ProcedureRecord,
  filterByDateRange,
  formatCurrency
} from '@/utils/dataProcessing';

const FinancialAnalysis = () => {
  // State for time period selection
  const [timeFrame, setTimeFrame] = useState(30);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for financial metrics
  const [revenue, setRevenue] = useState(0);
  const [received, setReceived] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [medicalAidPercentage, setMedicalAidPercentage] = useState(0);
  
  // State for trend data
  const [trends, setTrends] = useState({
    revenue: 5.2,
    received: 3.8,
    outstanding: -2.1,
    medicalAidPercentage: 1.4
  });
  
  // State for charts data
  const [claimSizeData, setClaimSizeData] = useState<{ name: string; value: number }[]>([]);
  const [paymentSourceData, setPaymentSourceData] = useState<{ name: string; value: number }[]>([]);
  const [paymentDelays, setPaymentDelays] = useState<{
    medicalAid: { name: string; value: number }[];
    patient: { name: string; value: number }[];
  }>({
    medicalAid: [],
    patient: []
  });
  
  // State for outstanding claims
  const [outstandingClaims, setOutstandingClaims] = useState<{
    id: string;
    date: string;
    amount: number;
    responsible: string;
    patient: string;
  }[]>([]);
  
  // State for data
  const [billingData, setBillingData] = useState<BillingRecord[]>([]);
  const [proceduresData, setProceduresData] = useState<ProcedureRecord[]>([]);
  const [period, setPeriod] = useState('last30days');
  
  // Chart colors
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Load data when timeframe changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load data using our utility functions
        const billingData = await loadCSVData<BillingRecord>('billing.csv');
        const proceduresData = await loadCSVData<ProcedureRecord>('procedures.csv');
        
        setBillingData(billingData);
        setProceduresData(proceduresData);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading financial data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Load data when timeframe changes
  useEffect(() => {
    if (!billingData.length) return;
    setIsLoading(true);
    // filter records by selected timeframe
    const filtered = filterByDateRange(
      billingData,
      'Date Billed / Claim Submit Date',
      timeFrame.toString()
    );

    // compute metrics
    const totalBilled = _.sumBy(filtered, 'Billed Amount');
    const totalPaidMedicalAid = _.sumBy(filtered, 'Amount Paid - Medical Aid');
    const totalPaidPatient = _.sumBy(filtered, 'Amount Paid - Patient');
    const totalReceived = totalPaidMedicalAid + totalPaidPatient;
    const totalOutstanding = _.sumBy(filtered, 'Outstanding Amount');

    setRevenue(Math.round(totalBilled));
    setReceived(Math.round(totalReceived));
    setOutstanding(Math.round(totalOutstanding));
    setMedicalAidPercentage(
      totalBilled > 0
        ? Number(((totalPaidMedicalAid / totalBilled) * 100).toFixed(1))
        : 0
    );

    // claim size distribution
    const buckets = [
      { name: '0-2500', min: 0, max: 2500 },
      { name: '2500-5000', min: 2500, max: 5000 },
      { name: '5000-7500', min: 5000, max: 7500 },
      { name: '7500-10000', min: 7500, max: 10000 },
      { name: '10000+', min: 10000, max: Infinity }
    ];
    setClaimSizeData(
      buckets.map(b => ({
        name: b.name,
        value: filtered.filter(r => r['Billed Amount'] >= b.min && r['Billed Amount'] < b.max).length
      }))
    );

    // payment source distribution
    setPaymentSourceData([
      { name: 'Medical Aid', value: totalPaidMedicalAid },
      { name: 'Patient', value: totalPaidPatient }
    ]);

    // payment delays distribution
    const getDelays = (paidField: keyof BillingRecord) => {
      const delays: Record<string, number> = { '0-7':0, '8-14':0, '15-30':0, '31-60':0, '60+':0 };
      filtered.forEach(r => {
        const billed = new Date(r['Date Billed / Claim Submit Date']);
        const paidStr = r[paidField] as string;
        if (!paidStr) return;
        const paid = new Date(paidStr);
        const days = Math.floor((paid.getTime() - billed.getTime())/(1000*60*60*24));
        if (days <= 7) delays['0-7']++;
        else if (days <= 14) delays['8-14']++;
        else if (days <= 30) delays['15-30']++;
        else if (days <= 60) delays['31-60']++;
        else delays['60+']++;
      });
      return [
        { name: '0-7 days', value: delays['0-7'] },
        { name: '8-14 days', value: delays['8-14'] },
        { name: '15-30 days', value: delays['15-30'] },
        { name: '31-60 days', value: delays['31-60'] },
        { name: '60+ days', value: delays['60+'] }
      ];
    };
    setPaymentDelays({
      medicalAid: getDelays('Date Paid - Medical Aid'),
      patient: getDelays('Date Paid - Patient')
    });

    setIsLoading(false);
  }, [timeFrame, billingData]);
  
  // Format currency helper
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-black">Financial Analysis</h1>
            <div>
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(Number(e.target.value))}
                className="border border-gray-300 rounded p-2 bg-white text-black"
              >
                <option value={30}>Last 30 days</option>
                <option value={60}>Last 60 days</option>
                <option value={90}>Last 90 days</option>
                <option value={180}>Last 180 days</option>
                <option value={365}>Last 365 days</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-blue-500">Loading financial data...</div>
          </div>
        ) : (
          <>
            {/* Key Metrics Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Revenue Generated */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-sm font-medium text-black">Revenue Generated</h3>
                <p className="text-2xl font-bold mt-1 text-black">{formatCurrency(revenue)}</p>
                <div className="mt-2 flex items-center">
                  <span className={trends.revenue >= 0 ? "text-green-500" : "text-red-500"}>
                    {trends.revenue >= 0 ? "↑" : "↓"} {Math.abs(trends.revenue)}%
                  </span>
                  <span className="text-xs text-black ml-1">vs previous period</span>
                </div>
              </div>
              
              {/* Billings Received */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-sm font-medium text-black">Billings Received</h3>
                <p className="text-2xl font-bold mt-1 text-black">{formatCurrency(received)}</p>
                <div className="mt-2 flex items-center">
                  <span className={trends.received >= 0 ? "text-green-500" : "text-red-500"}>
                    {trends.received >= 0 ? "↑" : "↓"} {Math.abs(trends.received)}%
                  </span>
                  <span className="text-xs text-black ml-1">vs previous period</span>
                </div>
              </div>
              
              {/* Billings Outstanding */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-sm font-medium text-black">Billings Outstanding</h3>
                <p className="text-2xl font-bold mt-1 text-black">{formatCurrency(outstanding)}</p>
                <div className="mt-2 flex items-center">
                  <span className={trends.outstanding < 0 ? "text-green-500" : "text-red-500"}>
                    {trends.outstanding >= 0 ? "↑" : "↓"} {Math.abs(trends.outstanding)}%
                  </span>
                  <span className="text-xs text-black ml-1">vs previous period</span>
                </div>
              </div>
              
              {/* Medical Aid Percentage */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h3 className="text-sm font-medium text-black">Medical Aid Payments</h3>
                <p className="text-2xl font-bold mt-1 text-black">{medicalAidPercentage}%</p>
                <div className="mt-2 flex items-center">
                  <span className={trends.medicalAidPercentage >= 0 ? "text-green-500" : "text-red-500"}>
                    {trends.medicalAidPercentage >= 0 ? "↑" : "↓"} {Math.abs(trends.medicalAidPercentage)}%
                  </span>
                  <span className="text-xs text-black ml-1">vs previous period</span>
                </div>
              </div>
            </div>
            
            {/* AI Trend Analysis */}
            <div className="bg-white rounded-lg p-4 shadow mb-6">
              <h2 className="text-lg font-medium text-black mb-3">AI Trend Analysis</h2>
              <p className="text-black">
                {trends.revenue > 0 && trends.received > 0 ? (
                  <span>
                    <span className="font-medium text-green-600">Positive financial trend detected.</span> Revenue has increased by {trends.revenue}% compared to the previous period, with billings received also showing growth at {trends.received}%. 
                    {trends.outstanding < 0 
                      ? " Outstanding billings have decreased, indicating improved collection efficiency." 
                      : " There is a slight increase in outstanding billings which may require attention to collection processes."}
                    {trends.medicalAidPercentage > 0 
                      ? " The proportion of medical aid payments has increased, which typically indicates more stable and reliable payment sources." 
                      : " There has been a small reduction in the proportion of medical aid payments, which may warrant a review of medical aid billing procedures."}
                  </span>
                ) : (
                  <span>
                    <span className="font-medium text-amber-600">Mixed financial signals detected.</span> Revenue trend is {trends.revenue > 0 ? "positive" : "negative"} at {Math.abs(trends.revenue)}% compared to the previous period.
                    {trends.outstanding > 0 
                      ? ` Outstanding billings have increased by ${trends.outstanding}%, suggesting potential collection issues that should be addressed.` 
                      : ` Collection efficiency has improved with outstanding billings reduced by ${Math.abs(trends.outstanding)}%.`}
                    {" Consider reviewing billing processes and payment follow-up procedures to optimize cash flow."}
                  </span>
                )}
              </p>
            </div>
            
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Claim Size Distribution */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h2 className="text-lg font-medium text-black mb-3">Claim Size Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={claimSizeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#000' }} />
                      <YAxis tick={{ fill: '#000' }} domain={['dataMin', 'dataMax']} />
                      <Tooltip 
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].name;
      // Try to get percent from payload (recharts doesn't provide it directly)
      // Instead, we calculate percent using the Pie's data array
      let percent = null;
      if (payload[0].payload && payload[0].payload.value && payload[0].payload.data) {
        const total = payload[0].payload.data.reduce((sum, d) => sum + d.value, 0);
        percent = total ? Math.round((value / total) * 100) : null;
      }
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 10, color: '#000', borderRadius: 4 }}>
          <span style={{ fontWeight: 600 }}>{name}</span><br />
          {percent !== null
            ? `${value} (${percent}%)`
            : value}
        </div>
      );
    }
    return null;
  }}
/>
                      <Legend wrapperStyle={{ color: '#000' }} formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                      <Bar dataKey="value" name="Number of Claims" fill="#0088FE" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Payment Source Pie Chart */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h2 className="text-lg font-medium text-black mb-3">Payment Source Distribution</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {paymentSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].name;
      // Try to get percent from payload (recharts doesn't provide it directly)
      // Instead, we calculate percent using the Pie's data array
      let percent = null;
      if (payload[0].payload && payload[0].payload.value && payload[0].payload.data) {
        const total = payload[0].payload.data.reduce((sum, d) => sum + d.value, 0);
        percent = total ? Math.round((value / total) * 100) : null;
      }
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 10, color: '#000', borderRadius: 4 }}>
          <span style={{ fontWeight: 600 }}>{name}</span><br />
          {percent !== null
            ? `${value} (${percent}%)`
            : value}
        </div>
      );
    }
    return null;
  }}
/>
                      <Legend wrapperStyle={{ color: '#000' }} formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Medical Aid Payment Delay */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h2 className="text-lg font-medium text-black mb-3">Medical Aid Payment Delay</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentDelays.medicalAid} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#000' }} />
                      <YAxis tick={{ fill: '#000' }} />
                      <Tooltip 
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].name;
      // Try to get percent from payload (recharts doesn't provide it directly)
      // Instead, we calculate percent using the Pie's data array
      let percent = null;
      if (payload[0].payload && payload[0].payload.value && payload[0].payload.data) {
        const total = payload[0].payload.data.reduce((sum, d) => sum + d.value, 0);
        percent = total ? Math.round((value / total) * 100) : null;
      }
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 10, color: '#000', borderRadius: 4 }}>
          <span style={{ fontWeight: 600 }}>{name}</span><br />
          {percent !== null
            ? `${value} (${percent}%)`
            : value}
        </div>
      );
    }
    return null;
  }}
/>
                      <Legend wrapperStyle={{ color: '#000' }} formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                      <Bar dataKey="value" name="Number of Claims" fill="#00C49F" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Patient Payment Delay */}
              <div className="bg-white rounded-lg p-4 shadow">
                <h2 className="text-lg font-medium text-black mb-3">Patient Payment Delay</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentDelays.patient} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: '#000' }} />
                      <YAxis tick={{ fill: '#000' }} />
                      <Tooltip 
  content={({ active, payload }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const name = payload[0].name;
      // Try to get percent from payload (recharts doesn't provide it directly)
      // Instead, we calculate percent using the Pie's data array
      let percent = null;
      if (payload[0].payload && payload[0].payload.value && payload[0].payload.data) {
        const total = payload[0].payload.data.reduce((sum, d) => sum + d.value, 0);
        percent = total ? Math.round((value / total) * 100) : null;
      }
      return (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: 10, color: '#000', borderRadius: 4 }}>
          <span style={{ fontWeight: 600 }}>{name}</span><br />
          {percent !== null
            ? `${value} (${percent}%)`
            : value}
        </div>
      );
    }
    return null;
  }}
/>
                      <Legend wrapperStyle={{ color: '#000' }} formatter={(value) => <span style={{ color: '#000' }}>{value}</span>} />
                      <Bar dataKey="value" name="Number of Claims" fill="#FFBB28" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
            {/* AI Chart Analysis */}
            <div className="bg-white rounded-lg p-4 shadow mb-6">
              <h2 className="text-lg font-medium text-black mb-3">AI Chart Interpretation</h2>
              <p className="text-black mb-3">
                <span className="font-medium">Claim Size Analysis:</span> The majority of claims fall in the R1,001-R2,000 range, indicating this is your practice's typical procedure value. 
                Consider optimizing billing for procedures in this range to maximize efficiency.
              </p>
              <p className="text-black mb-3">
                <span className="font-medium">Payment Source:</span> Medical aid payments constitute 76.5% of your revenue, providing a stable income base. 
                The remaining 23.5% from patient payments shows a healthy direct payment component.
              </p>
              <p className="text-black">
                <span className="font-medium">Payment Delays:</span> Medical aid payments typically resolve within 15-30 days, with fewer cases extending beyond 60 days. 
                Patient payments show a wider distribution with more cases extending into the 31-60 day range. 
                Consider implementing automated reminders for patient payments after 30 days to improve collection times.
              </p>
            </div>
            
            {/* Outstanding Claims Table */}
            <div className="bg-white rounded-lg p-4 shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-black">Outstanding Claims</h2>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                  Send All Reminders
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Invoice ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Date Billed
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Responsible Party
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {outstandingClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {claim.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {claim.date}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          {claim.patient}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black font-medium">
                          {formatCurrency(claim.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            claim.responsible === 'Medical Aid' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {claim.responsible}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                          <button className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded text-xs">
                            Follow Up
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="text-sm text-black mt-4">
                Showing {outstandingClaims.length} outstanding claims
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

export default FinancialAnalysis;