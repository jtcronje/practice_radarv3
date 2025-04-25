'use client';

import { useState, useEffect } from 'react';
import Papa from 'papaparse';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Save, Trash2 } from 'lucide-react';

const MBTScenarioModeling = () => {
  const [timeperiods] = useState([
    { value: 'last30days', label: 'Last 30 Days' },
    { value: 'last90days', label: 'Last 90 Days' },
    { value: 'lastyear', label: 'Last Year' },
    { value: 'ytd', label: 'Year to Date' }
  ]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState('last30days');
  const [procedureData, setProcedureData] = useState<Array<any>>([]);
  const [scenarios, setScenarios] = useState<Array<any>>([
    { id: 'base', name: 'Base Scenario (Actual)' }
  ]);
  const [newScenarioName, setNewScenarioName] = useState('');

  const [comparisonData, setComparisonData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const fetchData = async () => {
      const now = new Date();
      let start: Date;
      switch (selectedTimePeriod) {
        case 'last30days':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last90days':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'lastyear':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        case 'ytd':
          start = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          start = new Date(0);
      }
      const [procRes, billRes] = await Promise.all([
        fetch('/data/procedures.csv'),
        fetch('/data/billing.csv')
      ]);
      const [procText, billText] = await Promise.all([procRes.text(), billRes.text()]);
      const procParsed = (Papa.parse(procText, { header: true }).data) as any[];
      const billParsed = (Papa.parse(billText, { header: true }).data) as any[];
      // Map record IDs for all procedures
      const recordDescMap: Record<string, string> = {};
      procParsed.forEach(row => {
        recordDescMap[row['Procedure Record ID']] = row['Procedure Description'];
      });
      // Count procedure occurrences within selected period
      const descCountMap: Record<string, number> = {};
      procParsed.forEach(row => {
        const procDate = new Date(row['Date of Service']);
        if (procDate < start) return;
        const desc = row['Procedure Description'];
        descCountMap[desc] = (descCountMap[desc] || 0) + 1;
      });
      const mbtSumCount: Record<string, { sum: number; count: number }> = {};
      billParsed.forEach(row => {
        const date = new Date(row['Date Billed / Claim Submit Date']);
        if (date < start) return;
        const rid = row['Procedure Record ID'];
        const desc = recordDescMap[rid];
        if (!desc) return;
        const mbt = parseFloat(row['MBT Percentage']) || 0;
        if (!mbtSumCount[desc]) mbtSumCount[desc] = { sum: 0, count: 0 };
        mbtSumCount[desc].sum += mbt;
        mbtSumCount[desc].count += 1;
      });
      const costSumCount: Record<string, { sum: number; count: number }> = {};
      billParsed.forEach(row => {
        const date2 = new Date(row['Date Billed / Claim Submit Date']);
        if (date2 < start) return;
        const rid2 = row['Procedure Record ID'];
        const desc2 = recordDescMap[rid2];
        if (!desc2) return;
        const billed = parseFloat(row['Billed Amount']) || 0;
        if (!costSumCount[desc2]) costSumCount[desc2] = { sum: 0, count: 0 };
        costSumCount[desc2].sum += billed;
        costSumCount[desc2].count += 1;
      });
      const initialData = Object.entries(mbtSumCount).map(([desc, { sum, count }]) => ({
        id: desc,
        description: desc,
        currentMBT: count > 0 ? sum / count : 0,
        newMBT: count > 0 ? sum / count : 0,
        avgCost: costSumCount[desc] && costSumCount[desc].count > 0
          ? costSumCount[desc].sum / costSumCount[desc].count
          : 0,
        procedureCount: descCountMap[desc] || 0
      }));
      setProcedureData(initialData);
      setIsLoading(false);
    };
    fetchData();
  }, [selectedTimePeriod]);

  const handleMBTChange = (index: number, value: string) => {
    const updated = [...procedureData];
    updated[index].newMBT = parseInt(value, 10) || 0;
    setProcedureData(updated);
  };

  const handleCountChange = (index: number, value: string) => {
    const updated = [...procedureData];
    updated[index].procedureCount = parseInt(value, 10) || 0;
    setProcedureData(updated);
  };

  const calculateNewRevenue = (proc: any) =>
    (proc.newMBT / proc.currentMBT) * proc.procedureCount * proc.avgCost;
  const calculateBaseRevenue = (proc: any) => proc.procedureCount * proc.avgCost;

  const createScenario = () => {
    if (!newScenarioName.trim()) {
      alert('Please provide a scenario name');
      return;
    }
    const id = `scenario_${Date.now()}`;
    const newSc = {
      id,
      name: newScenarioName,
      timeperiod: selectedTimePeriod,
      procedures: procedureData.map((p) => ({
        ...p,
        mbtPercentage: p.newMBT,
        revenue: calculateNewRevenue(p)
      }))
    };
    setScenarios((prev) => [...prev, newSc]);
    setNewScenarioName('');
    setProcedureData((prev) =>
      prev.map((p) => ({ ...p, newMBT: p.currentMBT }))
    );
    // prepare comparison data for metrics and chart
    const scenarioName = newSc.name;
    const baseRev = procedureData.map((p) => ({ name: p.description, base: calculateBaseRevenue(p) }));
    const scenarioRev = procedureData.map((p) => ({ name: p.description, [scenarioName]: calculateNewRevenue(p) }));
    const merged = baseRev.map((b, i) => ({ ...b, ...scenarioRev[i] }));
    const baseTotal = merged.reduce((acc, curr) => acc + curr.base, 0);
    const scenarioTotal = merged.reduce((acc, curr) => acc + (curr[scenarioName] || 0), 0);
    const diff = scenarioTotal - baseTotal;
    const pct = baseTotal ? ((diff / baseTotal) * 100).toFixed(1) + '%' : '0%';
    setComparisonData({
      byProcedure: merged,
      scenario1Name: 'Actual',
      scenario2Name: scenarioName,
      difference: diff,
      percentageChange: pct,
      baseTotal,
      scenarioTotal
    });
  };


  const deleteScenario = (sid: string) =>
    setScenarios((prev) => prev.filter((s) => s.id !== sid));


  return (
    <div className="p-6 bg-gray-50 min-h-screen text-black">
      <h1 className="text-2xl font-bold mb-4">MBT Scenario Modeling</h1>
      <div className="mb-4 flex items-center space-x-4">
        <select
          className="border px-2 py-1 rounded"
          value={selectedTimePeriod}
          onChange={(e) => setSelectedTimePeriod(e.target.value)}
        >
          {timeperiods.map((tp) => (
            <option key={tp.value} value={tp.value}>
              {tp.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="New Scenario Name"
          className="border px-2 py-1 rounded flex-1"
          value={newScenarioName}
          onChange={(e) => setNewScenarioName(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-1 rounded flex items-center"
          onClick={createScenario}
          disabled={isLoading}
        >
          <Save className="mr-2" />
          Create Scenario
        </button>
      </div>
      <div className="mb-6 space-y-2">
        {scenarios.map((s) => (
          <div
            key={s.id}
            className="flex justify-between items-center bg-white p-2 rounded shadow-sm"
          >
            <span>{s.name}</span>
            {s.id !== 'base' && (
              <button
                className="text-red-600"
                onClick={() => deleteScenario(s.id)}
              >
                <Trash2 />
              </button>
            )}
          </div>
        ))}
      </div>
      {!isLoading && procedureData.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow mb-6 text-black">
          <h2 className="text-xl font-semibold mb-4">Adjust MBT & Procedure Counts</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left px-4 py-2 rounded-tl-lg">Procedure</th>
                  <th className="text-left px-4 py-2">Avg Cost</th>
                  <th className="text-left px-4 py-2">Current MBT (%)</th>
                  <th className="text-left px-4 py-2">New MBT (%)</th>
                  <th className="text-left px-4 py-2 rounded-tr-lg"># Procedures</th>
                </tr>
              </thead>
              <tbody>
                {procedureData.map((proc, idx) => (
                  <tr key={proc.id} className="bg-white hover:bg-gray-50 transition">
                    <td className="px-4 py-2 font-medium w-1/3 border border-gray-200 rounded-l-lg">{proc.description}</td>
                    <td className="px-4 py-2 text-sm w-24">R{proc.avgCost.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}</td>
                    <td className="px-4 py-2 text-sm w-20">{Math.round(proc.currentMBT)}%</td>
                    <td className="px-4 py-2 w-24">
                      <input
                        type="number"
                        min="0"
                        value={Math.round(proc.newMBT)}
                        onChange={(e) => handleMBTChange(idx, String(Math.round(Number(e.target.value))))}
                        step={1}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 text-black font-semibold text-center shadow-sm"
                      />
                    </td>
                    <td className="px-4 py-2 w-24 rounded-r-lg">
                      <input
                        type="number"
                        min="0"
                        value={proc.procedureCount}
                        onChange={(e) => handleCountChange(idx, e.target.value)}
                        className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-400 text-black font-semibold text-center shadow-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {comparisonData && (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-8 mb-2">
            <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <span className="text-gray-500 text-sm mb-1">Base Revenue</span>
              <span className="text-2xl font-bold text-blue-900">R{comparisonData.baseTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <span className="text-gray-500 text-sm mb-1">Scenario Revenue</span>
              <span className="text-2xl font-bold text-green-800">R{comparisonData.scenarioTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <span className="text-gray-500 text-sm mb-1">Difference</span>
              <span className={`text-2xl font-bold ${comparisonData.difference >= 0 ? 'text-green-700' : 'text-red-700'}`}>{comparisonData.difference >= 0 ? '+' : '-'}R{Math.abs(comparisonData.difference).toLocaleString(undefined, { maximumFractionDigits: 0 })} ({comparisonData.percentageChange})</span>
            </div>
          </div>
          {/* Revenue Comparison Chart */}
          <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-medium mb-2">Revenue Comparison</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData.byProcedure} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fill: '#000' }} />
                <YAxis type="number" tickFormatter={(v) => `R${v.toLocaleString()}`} />
                <Tooltip formatter={(v) => `R${(v as number).toLocaleString()}`} />
                <Legend />
                <Bar dataKey="base" name="Actual" fill="#8884d8" />
                <Bar
                  dataKey={comparisonData.scenario2Name}
                  name={comparisonData.scenario2Name}
                  fill="#82ca9d"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* AI Analysis */}
          <div className="bg-blue-50 p-4 rounded shadow">
            <h3 className="text-blue-800 font-medium mb-2">AI Analysis</h3>
            <p>
              {comparisonData.difference >= 0 ? (
                <span className="text-green-700">
                  Positive impact of R{comparisonData.difference.toLocaleString()} ({comparisonData.percentageChange})
                </span>
              ) : (
                <span className="text-red-700">
                  Decrease of R{Math.abs(comparisonData.difference).toLocaleString()} ({comparisonData.percentageChange})
                </span>
              )}
            </p>
            {comparisonData.byProcedure.length > 0 && (
              <p className="mt-2">
                Most impacted procedure: <strong>
                {
                  comparisonData.byProcedure.reduce((prev: any, curr: any) =>
                    Math.abs(curr[comparisonData.scenario2Name] - curr.base) >
                    Math.abs(prev[comparisonData.scenario2Name] - prev.base)
                      ? curr
                      : prev
                  ).name
                }
                </strong>
              </p>
            )}
          </div>
        </div>
      )}
      {/* User Indicator */}
  <div className="fixed bottom-4 left-4 bg-white bg-opacity-90 rounded-lg px-4 py-2 shadow text-sm text-blue-900 font-medium z-50">
    Dr. Ras is logged in
  </div>
</div>
  );
};

export default MBTScenarioModeling;
