import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Save, Trash2, ArrowRight } from 'lucide-react';

const MBTScenarioModeling = () => {
  const [timeperiods, setTimeperiods] = useState([
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'ytd', label: 'Year to Date' },
  ]);
  
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('last30days');
  const [procedureData, setProcedureData] = useState([]);
  const [scenarios, setScenarios] = useState([{ id: 'base', name: 'Base Scenario (Actual)' }]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [comparison, setComparison] = useState({ scenario1: 'base', scenario2: null });
  const [comparisonData, setComparisonData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate data fetching
  useEffect(() => {
    // In a real implementation, you would fetch this data from your database
    // based on the selected time period
    setIsLoading(true);
    
    // Simulated data - in reality, this would come from joining the procedures and billing tables
    setTimeout(() => {
      const simulatedData = [
        {
          id: 'PROC001',
          description: 'General Anesthesia - 30 minutes',
          currentMBT: 100,
          newMBT: 100,
          avgCost: 1500,
          procedureCount: 45
        },
        {
          id: 'PROC002',
          description: 'Epidural Anesthesia',
          currentMBT: 110,
          newMBT: 110,
          avgCost: 1800,
          procedureCount: 30
        },
        {
          id: 'PROC003',
          description: 'Spinal Anesthesia',
          currentMBT: 105,
          newMBT: 105,
          avgCost: 1600,
          procedureCount: 38
        },
        {
          id: 'PROC004',
          description: 'Regional Nerve Block',
          currentMBT: 95,
          newMBT: 95,
          avgCost: 1200,
          procedureCount: 55
        },
        {
          id: 'PROC005',
          description: 'Monitored Anesthesia Care',
          currentMBT: 90,
          newMBT: 90,
          avgCost: 950,
          procedureCount: 70
        }
      ];
      
      setProcedureData(simulatedData);
      setIsLoading(false);
    }, 800);
  }, [selectedTimePeriod]);
  
  // Handle MBT input change
  const handleMBTChange = (index, value) => {
    const updatedData = [...procedureData];
    updatedData[index].newMBT = parseInt(value) || 0;
    setProcedureData(updatedData);
  };
  
  // Handle procedure count change
  const handleCountChange = (index, value) => {
    const updatedData = [...procedureData];
    updatedData[index].procedureCount = parseInt(value) || 0;
    setProcedureData(updatedData);
  };
  
  // Calculate new revenue for a procedure
  const calculateNewRevenue = (procedure) => {
    return (procedure.newMBT / procedure.currentMBT) * procedure.procedureCount * procedure.avgCost;
  };
  
  // Calculate base revenue for a procedure
  const calculateBaseRevenue = (procedure) => {
    return procedure.procedureCount * procedure.avgCost;
  };
  
  // Create a new scenario
  const createScenario = () => {
    if (!newScenarioName.trim()) {
      alert('Please provide a scenario name');
      return;
    }
    
    const scenarioId = `scenario_${Date.now()}`;
    const newScenario = {
      id: scenarioId,
      name: newScenarioName,
      timeperiod: selectedTimePeriod,
      procedures: procedureData.map(proc => ({
        ...proc,
        mbtPercentage: proc.newMBT,
        revenue: calculateNewRevenue(proc)
      }))
    };
    
    setScenarios([...scenarios, newScenario]);
    setNewScenarioName('');
    
    // Reset newMBT to currentMBT
    setProcedureData(procedureData.map(proc => ({
      ...proc,
      newMBT: proc.currentMBT
    })));
    
    // Set this as the second comparison item
    setComparison({ ...comparison, scenario2: scenarioId });
  };
  
  // Delete a scenario
  const deleteScenario = (scenarioId) => {
    setScenarios(scenarios.filter(s => s.id !== scenarioId));
    
    // Update comparison if needed
    if (comparison.scenario1 === scenarioId) {
      setComparison({ ...comparison, scenario1: 'base' });
    } else if (comparison.scenario2 === scenarioId) {
      setComparison({ ...comparison, scenario2: null });
    }
  };
  
  // Update comparison data whenever comparison selection changes
  useEffect(() => {
    if (!comparison.scenario1 || !procedureData.length) return;
    
    const scenario1 = scenarios.find(s => s.id === comparison.scenario1);
    const scenario2 = comparison.scenario2 ? scenarios.find(s => s.id === comparison.scenario2) : null;
    
    if (!scenario1) return;
    
    // For the base scenario, calculate based on current procedureData
    const baseScenarioData = procedureData.map(proc => ({
      id: proc.id,
      description: proc.description,
      revenue: calculateBaseRevenue(proc)
    }));
    
    // For created scenarios, use their stored data
    const scenario1Data = scenario1.id === 'base' 
      ? baseScenarioData 
      : scenario1.procedures;
    
    const scenario2Data = scenario2 
      ? (scenario2.id === 'base' ? baseScenarioData : scenario2.procedures)
      : null;
    
    // Prepare comparison data
    const comparisonChartData = procedureData.map(proc => {
      const scenario1Proc = scenario1Data.find(p => p.id === proc.id);
      const scenario2Proc = scenario2Data ? scenario2Data.find(p => p.id === proc.id) : null;
      
      return {
        name: proc.description.length > 20 
          ? proc.description.substring(0, 20) + '...' 
          : proc.description,
        [scenario1.name]: scenario1Proc ? scenario1Proc.revenue : 0,
        ...(scenario2Proc ? { [scenario2.name]: scenario2Proc.revenue } : {})
      };
    });
    
    // Calculate totals
    const scenario1Total = scenario1Data.reduce((sum, proc) => sum + proc.revenue, 0);
    const scenario2Total = scenario2Data 
      ? scenario2Data.reduce((sum, proc) => sum + proc.revenue, 0) 
      : 0;
    
    const totalData = [{
      name: 'Total Revenue',
      [scenario1.name]: scenario1Total,
      ...(scenario2 ? { [scenario2.name]: scenario2Total } : {})
    }];
    
    setComparisonData({
      byProcedure: comparisonChartData,
      totals: totalData,
      scenario1Name: scenario1.name,
      scenario2Name: scenario2 ? scenario2.name : null,
      scenario1Total,
      scenario2Total,
      difference: scenario2 ? scenario2Total - scenario1Total : 0,
      percentageChange: scenario2 
        ? ((scenario2Total - scenario1Total) / scenario1Total * 100).toFixed(2) 
        : 0
    });
    
  }, [comparison, scenarios, procedureData]);
  
  // Generate random colors for the bars in chart
  const getRandomColor = (index) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];
    return colors[index % colors.length];
  };

  return (
    <div className="flex flex-col space-y-6 p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">MBT Scenario Modeling</h1>
        <p className="text-gray-600 mb-4">
          Model the impact of changing MBT (Medical Aid Base Tariff) percentages on your practice's revenue.
        </p>
        
        {/* Time Period Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Time Period:</label>
          <select 
            className="block w-full md:w-64 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={selectedTimePeriod}
            onChange={(e) => setSelectedTimePeriod(e.target.value)}
          >
            {timeperiods.map(period => (
              <option key={period.value} value={period.value}>{period.label}</option>
            ))}
          </select>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Procedure List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Adjust MBT Percentages</h2>
            <div className="grid grid-cols-1 gap-4">
              {procedureData.map((procedure, index) => (
                <div key={procedure.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{procedure.description}</h3>
                      <p className="text-sm text-gray-500">Avg. Cost: R{procedure.avgCost.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current MBT %</label>
                        <input
                          type="text"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 text-gray-700"
                          value={procedure.currentMBT}
                          readOnly
                        />
                      </div>
                      
                      <div className="hidden md:flex items-center justify-center">
                        <ArrowRight className="text-gray-400" size={20} />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New MBT %</label>
                        <input
                          type="number"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={procedure.newMBT}
                          onChange={(e) => handleMBTChange(index, e.target.value)}
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Count</label>
                        <input
                          type="number"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={procedure.procedureCount}
                          onChange={(e) => handleCountChange(index, e.target.value)}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Create Scenario Section */}
            <div className="mt-6 p-4 border border-dashed border-gray-300 rounded-lg">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scenario Name</label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={newScenarioName}
                    onChange={(e) => setNewScenarioName(e.target.value)}
                    placeholder="Enter scenario name"
                  />
                </div>
                
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                  onClick={createScenario}
                >
                  <Save className="mr-2" size={18} />
                  Save Scenario
                </button>
              </div>
            </div>
          </div>
          
          {/* Scenario Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Compare Scenarios</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scenario 1</label>
                <select 
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={comparison.scenario1}
                  onChange={(e) => setComparison({...comparison, scenario1: e.target.value})}
                >
                  {scenarios.map(scenario => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scenario 2</label>
                <select 
                  className="block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={comparison.scenario2 || ''}
                  onChange={(e) => setComparison({...comparison, scenario2: e.target.value || null})}
                >
                  <option value="">Select scenario</option>
                  {scenarios.filter(s => s.id !== comparison.scenario1).map(scenario => (
                    <option key={scenario.id} value={scenario.id}>{scenario.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Scenarios List */}
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-800 mb-2">Saved Scenarios</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time Period</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {scenarios.map(scenario => (
                      <tr key={scenario.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {scenario.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {scenario.id === 'base' ? 'All periods' : 
                            timeperiods.find(t => t.value === scenario.timeperiod)?.label || scenario.timeperiod}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {scenario.id !== 'base' && (
                            <button
                              className="text-red-600 hover:text-red-900 focus:outline-none flex items-center"
                              onClick={() => deleteScenario(scenario.id)}
                            >
                              <Trash2 size={16} className="mr-1" />
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Comparison Charts */}
            {comparisonData && (
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Revenue Comparison Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg shadow">
                      <p className="text-sm text-gray-500 mb-1">
                        {comparisonData.scenario1Name}
                      </p>
                      <p className="text-xl font-bold">
                        R{comparisonData.scenario1Total.toLocaleString()}
                      </p>
                    </div>
                    
                    {comparisonData.scenario2Name && (
                      <>
                        <div className="bg-white p-4 rounded-lg shadow">
                          <p className="text-sm text-gray-500 mb-1">
                            {comparisonData.scenario2Name}
                          </p>
                          <p className="text-xl font-bold">
                            R{comparisonData.scenario2Total.toLocaleString()}
                          </p>
                        </div>
                        
                        <div className={`bg-white p-4 rounded-lg shadow ${comparisonData.difference >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
                          <p className="text-sm text-gray-500 mb-1">Difference</p>
                          <p className="text-xl font-bold flex items-center">
                            <span className={comparisonData.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {comparisonData.difference >= 0 ? '+' : ''}
                              R{comparisonData.difference.toLocaleString()} 
                              ({comparisonData.difference >= 0 ? '+' : ''}
                              {comparisonData.percentageChange}%)
                            </span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Total Revenue Chart */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Total Revenue Comparison</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData.totals}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey={comparisonData.scenario1Name} fill="#8884d8" />
                        {comparisonData.scenario2Name && (
                          <Bar dataKey={comparisonData.scenario2Name} fill="#82ca9d" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Per Procedure Chart */}
                <div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Revenue by Procedure Type</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200" style={{ height: '400px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={comparisonData.byProcedure}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tickFormatter={(value) => `R${value.toLocaleString()}`} />
                        <YAxis dataKey="name" type="category" width={140} />
                        <Tooltip formatter={(value) => `R${value.toLocaleString()}`} />
                        <Legend />
                        <Bar dataKey={comparisonData.scenario1Name} fill="#8884d8" />
                        {comparisonData.scenario2Name && (
                          <Bar dataKey={comparisonData.scenario2Name} fill="#82ca9d" />
                        )}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* AI Interpretation */}
                {comparisonData.scenario2Name && (
                  <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <h3 className="text-lg font-medium text-blue-800 mb-2">
                      <span className="mr-2">✨</span>
                      AI Analysis
                    </h3>
                    <div className="prose text-blue-900">
                      {comparisonData.difference >= 0 ? (
                        <p>
                          The "{comparisonData.scenario2Name}" scenario shows a <strong className="text-green-700">positive impact of R{comparisonData.difference.toLocaleString()} ({comparisonData.percentageChange}%)</strong> compared to "{comparisonData.scenario1Name}". 
                          {comparisonData.difference > 50000 ? 
                            ' This significant increase suggests the MBT adjustments in this scenario could substantially improve your practice\'s revenue.' :
                            ' While positive, this moderate increase suggests carefully considering whether the MBT adjustments justify any potential impact on patient relationships.'}
                        </p>
                      ) : (
                        <p>
                          The "{comparisonData.scenario2Name}" scenario shows a <strong className="text-red-700">decrease of R{Math.abs(comparisonData.difference).toLocaleString()} ({comparisonData.percentageChange}%)</strong> compared to "{comparisonData.scenario1Name}". 
                          {comparisonData.difference < -50000 ? 
                            ' This significant decrease suggests reconsidering the MBT adjustments in this scenario as they could substantially impact your practice\'s revenue.' :
                            ' This moderate decrease might be acceptable if it leads to other benefits like increased patient volume or improved medical aid relationships.'}
                        </p>
                      )}
                      
                      <p className="mt-2">
                        <strong>Key insights:</strong> {comparisonData.byProcedure.length > 0 && (
                          <>
                            The most impacted procedure is "{procedureData.find(p => p.id === comparisonData.byProcedure.reduce((prev, current) => {
                              const prevDiff = Math.abs(
                                (prev[comparisonData.scenario2Name] || 0) - 
                                (prev[comparisonData.scenario1Name] || 0)
                              );
                              const currDiff = Math.abs(
                                (current[comparisonData.scenario2Name] || 0) - 
                                (current[comparisonData.scenario1Name] || 0)
                              );
                              return prevDiff > currDiff ? prev : current;
                            }).name)?.description || ''}".
                          </>
                        )} Consider reviewing your most profitable procedures to optimize your MBT strategy.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MBTScenarioModeling;