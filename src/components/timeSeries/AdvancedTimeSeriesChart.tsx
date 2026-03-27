import React, { useState, useRef, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, CheckIcon } from "@radix-ui/react-icons";
import {
  useTimeSeriesData,
  type TimeRange,
  type CustomTimeRange,
} from "./hooks/useTimeSeriesData";

interface AdvancedTimeSeriesChartProps {
  title?: string;
  defaultRange?: TimeRange;
  apiEndpoint?: string;
  mockData?: boolean;
  showStats?: boolean;
  onConfigureDataSource?: () => void;
  useSSE?: boolean; // Whether to use SSE
  maxDataPoints?: number; // Maximum number of data points
  timestampField?: string; // Timestamp field name
  valueField?: string; // Value field name
  queryParams?: Record<string, string>;
  sseExternalId?: string; // Filter SSE data by externalId
}

const AdvancedTimeSeriesChart: React.FC<AdvancedTimeSeriesChartProps> = ({
  title = "Real-time Data Monitoring",
  defaultRange = "10m",
  apiEndpoint,
  mockData = true,
  showStats = true,
  onConfigureDataSource,
  useSSE = false,
  maxDataPoints = 120,
  timestampField = "timestamp",
  valueField = "value",
  sseExternalId,
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>({
    from: "now-5m",
    to: "now",
  });

  const chartRef = useRef<ReactECharts>(null);
  const [dataZoomState, setDataZoomState] = useState<{
    start: number;
    end: number;
  } | null>(null);

  const { data, loading, error, refresh, isConnected } = useTimeSeriesData(
    timeRange,
    {
      apiEndpoint,
      mockData,
      updateInterval: 2000,
      customTimeRange: timeRange === "custom" ? customTimeRange : undefined,
      useSSE,
      maxDataPoints,
      timestampField,
      valueField,
      sseExternalId,
    },
  );

  // Reset dataZoom state when time range changes
  useEffect(() => {
    setDataZoomState(null);
  }, [timeRange, customTimeRange]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "10m", label: "Last 10 Minutes" },
    { value: "30m", label: "Last 30 Minutes" },
    { value: "1h", label: "Last 1 Hour" },
    { value: "1d", label: "Last 1 Day" },
    { value: "yesterday", label: "Yesterday" },
  ];

  // Apply custom time range
  const handleApplyCustomRange = () => {
    if (customTimeRange.from && customTimeRange.to) {
      setTimeRange("custom");
      setShowCustomRange(false);
    }
  };

  // Display current time range label
  const getCurrentRangeLabel = () => {
    if (timeRange === "custom") {
      return `${customTimeRange.from} to ${customTimeRange.to}`;
    }
    return (
      timeRangeOptions.find((opt) => opt.value === timeRange)?.label ||
      timeRange
    );
  };

  // Listen to dataZoom events and save user's zoom state
  const onChartEvents = {
    dataZoom: (params: {
      batch?: Array<{ start: number; end: number }>;
      start?: number;
      end?: number;
    }) => {
      if (params.batch && params.batch.length > 0) {
        setDataZoomState({
          start: params.batch[0].start,
          end: params.batch[0].end,
        });
      } else if (params.start !== undefined && params.end !== undefined) {
        setDataZoomState({
          start: params.start,
          end: params.end,
        });
      }
    },
  };

  // 计算统计数据
  //   const stats = {
  //     count: data.length,
  //     latest: data[data.length - 1]?.value || 0,
  //     average:
  //       data.length > 0
  //         ? data.reduce((sum, item) => sum + item.value, 0) / data.length
  //         : 0,
  //     max: data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0,
  //     min: data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0,
  //   };

  const option: EChartsOption = {
    backgroundColor: "transparent",
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.98)",
      borderColor: "#e5e7eb",
      borderWidth: 1,
      padding: 16,
      textStyle: {
        color: "#1f2937",
        fontSize: 13,
      },
      axisPointer: {
        type: "line",
        lineStyle: {
          color: "#3b82f6",
          width: 2,
          type: "solid",
        },
      },
      shadowBlur: 10,
      shadowColor: "rgba(0, 0, 0, 0.1)",
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "8%",
      top: "5%",
      containLabel: true,
    },
    xAxis: {
      type: "time",
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: (value: number) => {
          const date = new Date(value);
          if (timeRange === "1d" || timeRange === "yesterday") {
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          return date.toLocaleTimeString("en-US");
        },
        color: "#6b7280",
        fontSize: 12,
        fontWeight: 500,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#e5e7eb",
          width: 1,
        },
      },
    },
    yAxis: {
      type: "value",
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: "{value}",
        color: "#6b7280",
        fontSize: 12,
        fontWeight: 500,
      },
      splitLine: {
        lineStyle: {
          color: "#e5e7eb",
          width: 1,
        },
      },
    },
    dataZoom: [
      {
        type: "inside",
        start: dataZoomState?.start ?? 0,
        end: dataZoomState?.end ?? 100,
      },
      {
        start: dataZoomState?.start ?? 0,
        end: dataZoomState?.end ?? 100,
        height: 30,
      },
    ],
    series: [
      {
        name: "Data",
        type: "line",
        smooth: false,
        symbol: "none",
        sampling: "lttb",
        itemStyle: {
          color: "#22c55e",
        },
        lineStyle: {
          width: 1.5,
          color: "#22c55e",
        },
        emphasis: {
          focus: "series",
        },
        data: data.map((d) => [d.timestamp, d.value]),
      },
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: "linear",
  };

  // Inline style definitions (for Shadow DOM)
  const selectContentStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    minWidth: "160px",
    borderRadius: "8px",
    zIndex: 9999,
  };

  const selectItemStyle: React.CSSProperties = {
    fontSize: "14px",
    padding: "10px 32px 10px 12px",
    color: "#374151",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  const selectItemHoverStyle: React.CSSProperties = {
    ...selectItemStyle,
    background: "#f3f4f6",
    color: "#111827",
  };

  const selectItemCheckedStyle: React.CSSProperties = {
    ...selectItemStyle,
    background: "#dbeafe",
    color: "#1e40af",
  };

  const customInputStyle: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #d1d5db",
    color: "#1f2937",
    padding: "8px 12px",
    borderRadius: "6px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  };

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red-300 bg-red-50 p-6">
          <h3 className="mb-2 font-bold text-red-800">Loading Failed</h3>
          <p className="mb-4 text-red-700">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              Retry
            </button>
            {onConfigureDataSource && (
              <button
                onClick={onConfigureDataSource}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Reconfigure Data Source
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-full flex-col gap-4">
      {/* Chart Card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex flex-nowrap items-center justify-between gap-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <h2
              className="truncate text-base font-semibold text-gray-900"
              title={title}
            >
              {title}
            </h2>
            {useSSE && (
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                  isConnected
                    ? "border border-green-400 bg-green-50 text-green-700"
                    : "border border-red-400 bg-red-50 text-red-700"
                }`}
              >
                {isConnected ? "● Connected" : "○ Disconnected"}
              </span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <Select.Root
              value={timeRange === "custom" ? "custom" : timeRange}
              onValueChange={(value) => {
                if (value === "custom") {
                  setShowCustomRange(true);
                } else {
                  setTimeRange(value as TimeRange);
                }
              }}
            >
              <Select.Trigger
                className="inline-flex min-w-[150px] items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <Select.Value>
                  {timeRange === "custom" ? "Custom" : getCurrentRangeLabel()}
                </Select.Value>
                <Select.Icon>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Content
                style={selectContentStyle}
                position="popper"
                sideOffset={5}
                className="z-[9999]"
              >
                <Select.Viewport style={{ padding: "4px" }}>
                  {timeRangeOptions.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      style={selectItemStyle}
                      onMouseEnter={(e) => {
                        Object.assign(
                          e.currentTarget.style,
                          selectItemHoverStyle,
                        );
                      }}
                      onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, selectItemStyle);
                      }}
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator
                        style={{ position: "absolute", left: "8px" }}
                      >
                        <CheckIcon
                          style={{
                            width: "14px",
                            height: "14px",
                            color: "#60a5fa",
                          }}
                        />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                  <Select.Separator
                    style={{
                      height: "1px",
                      background: "#e5e7eb",
                      margin: "4px 0",
                    }}
                  />
                  <Select.Item
                    value="custom"
                    style={selectItemStyle}
                    onMouseEnter={(e) => {
                      Object.assign(
                        e.currentTarget.style,
                        selectItemHoverStyle,
                      );
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, selectItemStyle);
                    }}
                  >
                    <Select.ItemText>Custom Time...</Select.ItemText>
                  </Select.Item>
                </Select.Viewport>
              </Select.Content>
            </Select.Root>

            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="relative bg-gray-50/30 p-4" style={{ height: "450px" }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
                <div className="text-sm font-medium text-gray-700">
                  Loading...
                </div>
              </div>
            </div>
          )}
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge={false}
            lazyUpdate={true}
            onEvents={onChartEvents}
          />
        </div>
      </div>

      {/* Custom Time Range Dialog */}
      {showCustomRange && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "16px",
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
              maxWidth: "500px",
              width: "100%",
              padding: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#111827",
                marginBottom: "16px",
              }}
            >
              Custom Time Range
            </h3>

            <div style={{ marginBottom: "16px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                From
              </label>
              <input
                type="text"
                value={customTimeRange.from}
                onChange={(e) =>
                  setCustomTimeRange({
                    ...customTimeRange,
                    from: e.target.value,
                  })
                }
                style={customInputStyle}
                placeholder="now-5m"
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Supported formats: now-5m, now-1h, now-1d or ISO datetime
              </p>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#374151",
                  marginBottom: "8px",
                }}
              >
                To
              </label>
              <input
                type="text"
                value={customTimeRange.to}
                onChange={(e) =>
                  setCustomTimeRange({ ...customTimeRange, to: e.target.value })
                }
                style={customInputStyle}
                placeholder="now"
                onFocus={(e) => {
                  e.target.style.borderColor = "#3b82f6";
                  e.target.style.boxShadow =
                    "0 0 0 3px rgba(59, 130, 246, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "#d1d5db";
                  e.target.style.boxShadow = "none";
                }}
              />
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}
              >
                Supported formats: now or ISO datetime
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "12px",
              }}
            >
              <button
                onClick={() => setShowCustomRange(false)}
                style={{
                  padding: "8px 16px",
                  background: "#f3f4f6",
                  color: "#374151",
                  borderRadius: "6px",
                  border: "1px solid #d1d5db",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#e5e7eb")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#f3f4f6")
                }
              >
                Cancel
              </button>
              <button
                onClick={handleApplyCustomRange}
                style={{
                  padding: "8px 16px",
                  background: "#2563eb",
                  color: "#ffffff",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#1d4ed8")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#2563eb")
                }
              >
                Apply Time Range
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedTimeSeriesChart;
