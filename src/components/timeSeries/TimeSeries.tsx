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
    <div className="p-8 ">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex gap-2 rounded-lg bg-gray-100 p-1 shadow">
            <button
              onClick={() => setViewMode("realtime")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "realtime"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Real-time Monitoring
            </button>
            <button
              onClick={() => setViewMode("comparison")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === "comparison"
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Time Period Comparison
            </button>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 shadow-lg">
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
              title="Time Period Comparison Analysis"
              apiEndpoint={comparisonEndpoint}
              alignBy="relative"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeries;
