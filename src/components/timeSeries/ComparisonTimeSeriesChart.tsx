import React, { useState, useRef } from "react";
import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";
import * as Select from "@radix-ui/react-select";
import {
  ChevronDownIcon,
  CheckIcon,
  PlusIcon,
  TrashIcon,
} from "@radix-ui/react-icons";

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

interface TimePeriod {
  id: string;
  label: string;
  from: string;
  to: string;
  color: string;
  data: TimeSeriesDataPoint[];
}

interface ComparisonTimeSeriesChartProps {
  title?: string;
  apiEndpoint?: string;
  alignBy?: "absolute" | "relative"; // absolute: align by actual time, relative: align by relative time (e.g., month, hour)
  timestampField?: string; // Timestamp field name
  valueField?: string; // Value field name
  queryParams?: Record<string, string>;
}

const PRESET_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const ComparisonTimeSeriesChart: React.FC<ComparisonTimeSeriesChartProps> = ({
  title = "Time Period Comparison Analysis",
  apiEndpoint,
  alignBy = "relative",
  timestampField = "timestamp",
  valueField = "value",
}) => {
  const [periods, setPeriods] = useState<TimePeriod[]>([]);
  const [alignMode, setAlignMode] = useState<"absolute" | "relative">(alignBy);
  const [showAddPeriod, setShowAddPeriod] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    label: "",
    from: "",
    to: "",
  });

  const chartRef = useRef<ReactECharts>(null);

  // 生成模拟数据
  const generateMockData = (
    from: string,
    to: string,
  ): TimeSeriesDataPoint[] => {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const duration = toDate.getTime() - fromDate.getTime();
    const points = 100;
    const interval = duration / points;
    const data: TimeSeriesDataPoint[] = [];

    const baseValue = 50 + Math.random() * 20;
    for (let i = 0; i < points; i++) {
      const time = new Date(fromDate.getTime() + i * interval);
      const trend = Math.sin(i / 15) * 15;
      const noise = (Math.random() - 0.5) * 8;
      const value = baseValue + trend + noise;
      data.push({
        timestamp: time.toISOString(),
        value: Math.max(0, value),
      });
    }

    return data;
  };

  // Fetch data from API
  const fetchPeriodData = async (
    from: string,
    to: string,
  ): Promise<TimeSeriesDataPoint[]> => {
    console.log("Fetching period data...", apiEndpoint);
    if (!apiEndpoint) {
      return generateMockData(from, to);
    }

    try {
      const fromISO = new Date(from).toISOString();
      const toISO = new Date(to).toISOString();
      const url = `${apiEndpoint}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();

      // Transform data format, support custom field mapping
      const transformedData: TimeSeriesDataPoint[] = (
        Array.isArray(rawData) ? rawData : rawData.data || []
      ).map((item: Record<string, unknown>) => ({
        timestamp: String(item[timestampField]),
        value: item[valueField] as number,
      }));

      return transformedData;
    } catch (error) {
      console.error("Failed to fetch period data:", error);
      // Use mock data on failure
      return generateMockData(from, to);
    }
  };

  // Add time period
  const handleAddPeriod = async () => {
    if (!newPeriod.label || !newPeriod.from || !newPeriod.to) {
      alert("Please fill in complete period information");
      return;
    }

    // Fetch data
    const data = await fetchPeriodData(newPeriod.from, newPeriod.to);

    const period: TimePeriod = {
      id: Date.now().toString(),
      label: newPeriod.label,
      from: newPeriod.from,
      to: newPeriod.to,
      color: PRESET_COLORS[periods.length % PRESET_COLORS.length],
      data,
    };

    setPeriods([...periods, period]);
    setNewPeriod({ label: "", from: "", to: "" });
    setShowAddPeriod(false);
  };

  // Remove time period
  const handleRemovePeriod = (id: string) => {
    setPeriods(periods.filter((p) => p.id !== id));
  };

  // Transform data for chart display
  const getChartData = () => {
    if (alignMode === "absolute") {
      // Absolute time alignment: use original timestamps directly
      return periods.map((period) => ({
        name: period.label,
        type: "line" as const,
        smooth: true,
        symbol: "none",
        itemStyle: { color: period.color },
        lineStyle: { width: 2, color: period.color },
        data: period.data.map((d) => [d.timestamp, d.value]),
      }));
    } else {
      // Relative time alignment: normalize timestamps
      return periods.map((period) => {
        const fromDate = new Date(period.from);
        const normalizedData = period.data.map((d) => {
          const timestamp = new Date(d.timestamp);
          const elapsed = timestamp.getTime() - fromDate.getTime();
          return [elapsed, d.value];
        });

        return {
          name: period.label,
          type: "line" as const,
          smooth: true,
          symbol: "none",
          itemStyle: { color: period.color },
          lineStyle: { width: 2, color: period.color },
          data: normalizedData,
        };
      });
    }
  };

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
      shadowBlur: 10,
      shadowColor: "rgba(0, 0, 0, 0.1)",
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return "";

        let result = "";
        if (alignMode === "absolute") {
          result = `<div style="font-weight: 600; margin-bottom: 8px;">${new Date((params[0] as { value: [number, number] }).value[0]).toLocaleString("en-US")}</div>`;
        } else {
          const ms = (params[0] as { value: [number, number] }).value[0];
          const hours = Math.floor(ms / (1000 * 60 * 60));
          const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
          result = `<div style="font-weight: 600; margin-bottom: 8px;">+${hours}h ${minutes}m</div>`;
        }

        params.forEach(
          (param: {
            seriesName: string;
            color: string;
            value: [number, number];
          }) => {
            result += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
            <span style="color: #6b7280;">${param.seriesName}:</span>
            <span style="font-weight: 600; color: ${param.color};">${param.value[1].toFixed(2)}</span>
          </div>`;
          },
        );

        return result;
      },
    },
    legend: {
      data: periods.map((p) => p.label),
      textStyle: {
        color: "#4b5563",
        fontSize: 13,
        fontWeight: 500,
      },
      top: 15,
    },
    grid: {
      left: "2%",
      right: "2%",
      bottom: "10%",
      top: "18%",
      containLabel: true,
    },
    xAxis: {
      type: alignMode === "absolute" ? "time" : "value",
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        formatter:
          alignMode === "absolute"
            ? (value: number) =>
                new Date(value).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                })
            : (value: number) => {
                const hours = Math.floor(value / (1000 * 60 * 60));
                return `+${hours}h`;
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
      axisLine: { show: false },
      axisTick: { show: false },
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
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
        height: 30,
      },
    ],
    series: getChartData(),
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* Chart Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>

          <div className="flex items-center gap-3">
            <Select.Root
              value={alignMode}
              onValueChange={(v) => setAlignMode(v as "absolute" | "relative")}
            >
              <Select.Trigger className="inline-flex min-w-[150px] items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all hover:border-gray-400 hover:shadow focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <Select.Value>
                  {alignMode === "absolute" ? "Absolute Time" : "Relative Time"}
                </Select.Value>
                <Select.Icon>
                  <ChevronDownIcon className="h-4 w-4 text-gray-500" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className="z-50 rounded-lg border border-gray-300 bg-white shadow-xl"
                  position="popper"
                  sideOffset={5}
                >
                  <Select.Viewport className="p-1">
                    <Select.Item
                      value="absolute"
                      className="relative flex cursor-pointer items-center rounded px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>Absolute Time Alignment</Select.ItemText>
                      <Select.ItemIndicator className="absolute right-2">
                        <CheckIcon className="h-4 w-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                    <Select.Item
                      value="relative"
                      className="relative flex cursor-pointer items-center rounded px-3 py-2 text-sm text-gray-700 outline-none hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>Relative Time Alignment</Select.ItemText>
                      <Select.ItemIndicator className="absolute right-2">
                        <CheckIcon className="h-4 w-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            <button
              onClick={() => setShowAddPeriod(true)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
            >
              <PlusIcon className="h-4 w-4" />
              Add Period
            </button>
          </div>
        </div>

        {/* Chart */}
        <div className="relative bg-gray-50/30 p-4" style={{ height: "550px" }}>
          {periods.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mb-4 text-gray-400">
                  <svg
                    className="mx-auto h-16 w-16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <p className="mb-4 text-base font-medium text-gray-600">
                  No comparison data
                </p>
                <button
                  onClick={() => setShowAddPeriod(true)}
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
                >
                  Add First Period
                </button>
              </div>
            </div>
          ) : (
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ height: "100%", width: "100%" }}
              notMerge={false}
              lazyUpdate={true}
            />
          )}
        </div>
      </div>

      {/* Period List */}
      {periods.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-lg">
          <h3 className="mb-4 text-sm font-semibold text-gray-900">
            Comparison Periods
          </h3>
          <div className="space-y-3">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-4 transition-all hover:border-gray-300 hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full shadow-sm"
                    style={{ backgroundColor: period.color }}
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {period.label}
                    </div>
                    <div className="text-xs text-gray-600">
                      {new Date(period.from).toLocaleString("en-US")} -{" "}
                      {new Date(period.to).toLocaleString("en-US")}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePeriod(period.id)}
                  className="rounded-lg p-2 text-gray-500 transition-all hover:bg-red-50 hover:text-red-600"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Period Dialog */}
      {showAddPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-2xl">
            <h3 className="mb-5 text-lg font-semibold text-gray-900">
              Add Comparison Period
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Label Name
                </label>
                <input
                  type="text"
                  value={newPeriod.label}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, label: e.target.value })
                  }
                  placeholder="e.g., Black Friday 2024, Last Year"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <input
                  type="datetime-local"
                  value={newPeriod.from}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, from: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <input
                  type="datetime-local"
                  value={newPeriod.to}
                  onChange={(e) =>
                    setNewPeriod({ ...newPeriod, to: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 shadow-sm transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPeriod(false);
                  setNewPeriod({ label: "", from: "", to: "" });
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPeriod}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComparisonTimeSeriesChart;
