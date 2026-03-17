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
  sseExternalId?: string;
}

function TimeSeries({
  title,
  apiEndpoint,
  comparisonEndpoint,
  timestampField = "event_time",
  valueField = "value",
  queryParams,
  sseExternalId,
}: TimeSeriesProps) {
  const [viewMode, setViewMode] = useState<"realtime" | "comparison">(
    "realtime",
  );

  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl">
        <div className="rounded-lg border border-gray-200 shadow-lg">
          {/* View mode toggle inside the card */}
          <div className="flex items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex gap-1 rounded-lg bg-gray-200/60 p-1">
              <button
                onClick={() => setViewMode("realtime")}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "realtime"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                Real-time Monitoring
              </button>
              <button
                onClick={() => setViewMode("comparison")}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "comparison"
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-300/50"
                }`}
              >
                Time Period Comparison
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
              sseExternalId={sseExternalId ?? queryParams?.externalId}
            />
          ) : (
            <ComparisonTimeSeriesChart
              title="Time Period Comparison Analysis"
              apiEndpoint={comparisonEndpoint}
              alignBy="relative"
              sseExternalId={sseExternalId ?? queryParams?.externalId}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default TimeSeries;
