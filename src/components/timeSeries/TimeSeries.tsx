import React, { useState } from "react";
import AdvancedTimeSeriesChart from "./AdvancedTimeSeriesChart";
import ComparisonTimeSeriesChart from "./ComparisonTimeSeriesChart";

interface TimeSeriesProps {
  title?: string;
  apiEndpoint?: string;
  comparisonEndpoint?: string;
  timestampField?: string;
  valueField?: string;
  queryParams?: Record<string, string>;
}

function TimeSeries({
  title,
  apiEndpoint,
  comparisonEndpoint,
  timestampField = "event_time",
  valueField = "value",
  queryParams,
}: TimeSeriesProps) {
  const [viewMode, setViewMode] = useState<"realtime" | "comparison">(
    "realtime",
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2 rounded-lg bg-white p-1 shadow">
            <button
              onClick={() => setViewMode("realtime")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "realtime"
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              实时监控
            </button>
            <button
              onClick={() => setViewMode("comparison")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
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
            title={title}
            defaultRange="10m"
            showStats={false}
            mockData={false}
            apiEndpoint={apiEndpoint}
            useSSE={true}
            timestampField={timestampField}
            valueField={valueField}
            queryParams={queryParams}
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

export default TimeSeries;
