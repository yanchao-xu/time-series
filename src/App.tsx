import React from 'react';
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          时间序列数据可视化
        </h1>
        <AdvancedTimeSeriesChart
          title="实时监控数据"
          defaultRange="10m"
          mockData={true}
          showStats={true}
        />
      </div>
    </div>
  );
}

export default App;
