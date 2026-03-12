import { useState, useEffect, useCallback } from "react";

export type TimeRange = "10m" | "30m" | "1h" | "1d" | "yesterday" | "custom";

export interface CustomTimeRange {
  from: string;
  to: string;
}

interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
}

interface UseTimeSeriesDataOptions {
  apiEndpoint?: string;
  mockData?: boolean;
  updateInterval?: number; // 毫秒
  customTimeRange?: CustomTimeRange;
}

/**
 * 解析时间字符串（支持 now, now-5m, now-1h, now-1d 或 ISO 日期时间）
 */
const parseTimeString = (timeStr: string, referenceTime: Date): Date => {
  if (timeStr === "now") {
    return new Date(referenceTime);
  }

  // 匹配 now-5m, now-1h, now-1d 格式
  const relativeMatch = timeStr.match(/^now-(\d+)(m|h|d)$/);
  if (relativeMatch) {
    const value = parseInt(relativeMatch[1], 10);
    const unit = relativeMatch[2];
    const time = new Date(referenceTime);

    switch (unit) {
      case "m":
        time.setMinutes(time.getMinutes() - value);
        break;
      case "h":
        time.setHours(time.getHours() - value);
        break;
      case "d":
        time.setDate(time.getDate() - value);
        break;
    }

    return time;
  }

  // 尝试解析为 ISO 日期时间
  const isoDate = new Date(timeStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate;
  }

  // 默认返回当前时间
  return new Date(referenceTime);
};

/**
 * 自定义 Hook：管理时间序列数据
 * 支持从 API 获取数据或使用模拟数据
 */
export const useTimeSeriesData = (
  timeRange: TimeRange,
  options: UseTimeSeriesDataOptions = {},
) => {
  const {
    apiEndpoint,
    mockData = true,
    updateInterval = 2000,

    customTimeRange,
  } = options;

  const [data, setData] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 生成模拟数据
  const generateMockData = useCallback(
    (range: TimeRange): TimeSeriesDataPoint[] => {
      const now = new Date();
      const data: TimeSeriesDataPoint[] = [];
      let startTime: Date;
      let interval: number;
      let points: number;

      switch (range) {
        case "10m":
          startTime = new Date(now.getTime() - 10 * 60 * 1000);
          interval = 5000;
          points = 120;
          break;
        case "30m":
          startTime = new Date(now.getTime() - 30 * 60 * 1000);
          interval = 15000;
          points = 120;
          break;
        case "1h":
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          interval = 30000;
          points = 120;
          break;
        case "1d":
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          interval = 12 * 60 * 1000;
          points = 120;
          break;
        case "yesterday":
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday.setHours(0, 0, 0, 0);
          startTime = yesterday;
          interval = 12 * 60 * 1000;
          points = 120;
          break;
        case "custom":
          if (customTimeRange) {
            startTime = parseTimeString(customTimeRange.from, now);
            const endTime = parseTimeString(customTimeRange.to, now);
            const duration = endTime.getTime() - startTime.getTime();
            points = 120;
            interval = duration / points;
          } else {
            startTime = new Date(now.getTime() - 10 * 60 * 1000);
            interval = 5000;
            points = 120;
          }
          break;
        default:
          startTime = new Date(now.getTime() - 10 * 60 * 1000);
          interval = 5000;
          points = 120;
      }

      const baseValue = 50;
      for (let i = 0; i < points; i++) {
        const time = new Date(startTime.getTime() + i * interval);
        const trend = Math.sin(i / 20) * 20;
        const noise = (Math.random() - 0.5) * 10;
        const value = baseValue + trend + noise;
        data.push({
          timestamp: time.toISOString(),
          value: Math.max(0, value),
        });
      }
      console.log("Mock data:", data);
      return data;
    },
    [customTimeRange],
  );

  // 从 API 获取数据
  const fetchDataFromAPI = useCallback(
    async (range: TimeRange) => {
      if (!apiEndpoint) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiEndpoint}?range=${range}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取数据失败");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint],
  );

  // 初始化数据
  useEffect(() => {
    if (mockData) {
      const initialData = generateMockData(timeRange);
      setData(initialData);
    } else {
      fetchDataFromAPI(timeRange);
    }
  }, [timeRange, mockData, generateMockData, fetchDataFromAPI]);

  // 动态更新（仅用于模拟数据和非历史范围）
  useEffect(() => {
    if (!mockData || timeRange === "yesterday" || timeRange === "custom")
      return;

    const timer = setInterval(() => {
      setData((prevData) => {
        const newData = [...prevData];
        const now = new Date();
        const lastValue = newData[newData.length - 1]?.value || 50;

        const change = (Math.random() - 0.5) * 5;
        const newValue = Math.max(0, lastValue + change);

        newData.push({
          timestamp: now.toISOString(),
          value: newValue,
        });

        // 滑动窗口：保持固定数量
        if (newData.length > 120) {
          newData.shift();
        }

        return newData;
      });
    }, updateInterval);

    return () => clearInterval(timer);
  }, [mockData, timeRange, updateInterval]);

  // 手动刷新
  const refresh = useCallback(() => {
    if (mockData) {
      const newData = generateMockData(timeRange);
      setData(newData);
    } else {
      fetchDataFromAPI(timeRange);
    }
  }, [mockData, timeRange, generateMockData, fetchDataFromAPI]);

  return {
    data,
    loading,
    error,
    refresh,
  };
};
