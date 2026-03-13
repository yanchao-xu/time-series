import React, { useState } from "react";
import AdvancedTimeSeriesChart from "./AdvancedTimeSeriesChart";
import ComparisonTimeSeriesChart from "./ComparisonTimeSeriesChart";
import "./App.css";

function App() {
  // 配置 SSE 数据源
  const comparisonEndpoint = "http://localhost:3001/api/timeseries/comparison"; // 对比数据 API 端点

  const [viewMode, setViewMode] = useState<"realtime" | "comparison">(
    "realtime",
  );

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-2 bg-white rounded-lg p-1 shadow">
            <button
              onClick={() => setViewMode("realtime")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "realtime"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              实时监控
            </button>
            <button
              onClick={() => setViewMode("comparison")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === "comparison"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              时间跨度对比
            </button>
          </div>
        </div>

        {viewMode === "realtime" ? (
          <AdvancedTimeSeriesChart
            title="PUMP01 出口温度"
            defaultRange="10m"
            showStats={true}
            mockData={false}
            apiEndpoint="http://localhost:8900/api/stream"
            useSSE={true}
            timestampField="event_time" // 映射到你的 event_time 字段
            valueField="value" // 映射到你的 value 字段
            queryParams={{
              external_id: "PUMP01_PRESSURE",
            }}
          />
        ) : (
          <ComparisonTimeSeriesChart
            title="时间跨度对比分析"
            apiEndpoint={comparisonEndpoint}
            alignBy="relative"
          />
        )}
      </div>
    </div>
  );
}

export default App;
