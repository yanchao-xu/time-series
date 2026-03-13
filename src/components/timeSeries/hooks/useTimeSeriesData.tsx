import { useState, useEffect, useCallback, useRef } from "react";

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
  useSSE?: boolean; // 是否使用 SSE
  maxDataPoints?: number; // 最大数据点数量
  timestampField?: string; // 时间戳字段名，默认 'timestamp'
  valueField?: string; // 数值字段名，默认 'value'
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
 * 支持从 API 获取数据、使用模拟数据或通过 SSE 实时接收数据
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
    useSSE = false,
    maxDataPoints = 120,
    timestampField = "timestamp",
    valueField = "value",
  } = options;

  const [data, setData] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);

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

        // 转换数据格式，支持自定义字段映射
        const transformedData = (result.data || result || []).map(
          (item: Record<string, unknown>) => ({
            timestamp: String(item[timestampField]),
            value: item[valueField] as number,
          }),
        );
        console.log("Transformed data:", transformedData);
        setData(transformedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "获取数据失败");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint, timestampField, valueField],
  );

  // 连接 SSE
  const connectSSE = useCallback(() => {
    if (!apiEndpoint || !useSSE) return;

    // 关闭现有连接
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setLoading(true);
    setError(null);

    try {
      // 构建 SSE URL
      let sseUrl: string;

      // 检查是否是完整 URL（包含协议）
      if (
        apiEndpoint.startsWith("http://") ||
        apiEndpoint.startsWith("https://")
      ) {
        const url = new URL(apiEndpoint);
        url.searchParams.set("range", timeRange);
        if (timeRange === "custom" && customTimeRange) {
          url.searchParams.set("from", customTimeRange.from);
          url.searchParams.set("to", customTimeRange.to);
        }
        // 添加字段映射参数
        url.searchParams.set("timestampField", timestampField);
        url.searchParams.set("valueField", valueField);
        sseUrl = url.toString();
      } else {
        // 相对路径，手动构建查询参数
        const params = new URLSearchParams();
        params.set("range", timeRange);
        if (timeRange === "custom" && customTimeRange) {
          params.set("from", customTimeRange.from);
          params.set("to", customTimeRange.to);
        }
        // 添加字段映射参数
        params.set("timestampField", timestampField);
        params.set("valueField", valueField);
        sseUrl = `${apiEndpoint}?${params.toString()}`;
      }

      const eventSource = new EventSource(sseUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE 连接已建立");
        setIsConnected(true);
        setLoading(false);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const rawData = JSON.parse(event.data);
          // 处理数组数据
          if (Array.isArray(rawData)) {
            const newDataPoints: TimeSeriesDataPoint[] = rawData.map(
              (item: Record<string, unknown>) => ({
                timestamp: String(item[timestampField]),
                value: item[valueField] as number,
              }),
            );

            setData((prevData) => {
              const updatedData = [...prevData, ...newDataPoints];

              // 保持数据点数量在限制范围内
              if (updatedData.length > maxDataPoints) {
                return updatedData.slice(updatedData.length - maxDataPoints);
              }

              return updatedData;
            });
          } else {
            // 处理单个数据点
            const newDataPoint: TimeSeriesDataPoint = {
              timestamp: rawData[timestampField],
              value: rawData[valueField],
            };

            setData((prevData) => {
              const updatedData = [...prevData, newDataPoint];

              // 保持数据点数量在限制范围内
              if (updatedData.length > maxDataPoints) {
                return updatedData.slice(updatedData.length - maxDataPoints);
              }

              return updatedData;
            });
          }
        } catch (err) {
          console.error("解析 SSE 数据失败:", err);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE 连接错误:", err);
        setError("SSE 连接失败，请检查服务器状态");
        setIsConnected(false);
        setLoading(false);
        eventSource.close();
      };

      // 监听自定义事件（可选）
      eventSource.addEventListener("data", (event: MessageEvent) => {
        try {
          const rawData = JSON.parse(event.data);

          // 处理数组数据
          if (Array.isArray(rawData)) {
            const newDataPoints: TimeSeriesDataPoint[] = rawData.map(
              (item: Record<string, unknown>) => ({
                timestamp: String(item[timestampField]),
                value: item[valueField] as number,
              }),
            );

            setData((prevData) => {
              const updatedData = [...prevData, ...newDataPoints];
              if (updatedData.length > maxDataPoints) {
                return updatedData.slice(updatedData.length - maxDataPoints);
              }
              return updatedData;
            });
          } else {
            // 处理单个数据点
            const newDataPoint: TimeSeriesDataPoint = {
              timestamp: rawData[timestampField],
              value: rawData[valueField],
            };

            setData((prevData) => {
              const updatedData = [...prevData, newDataPoint];
              if (updatedData.length > maxDataPoints) {
                return updatedData.slice(updatedData.length - maxDataPoints);
              }
              return updatedData;
            });
          }
        } catch (err) {
          console.error("解析自定义 SSE 事件失败:", err);
        }
      });

      // 监听初始数据批量加载（可选）
      eventSource.addEventListener("init", (event: MessageEvent) => {
        try {
          const rawDataArray = JSON.parse(event.data);

          // 转换数据格式，支持自定义字段映射
          const initialData: TimeSeriesDataPoint[] = rawDataArray.map(
            (item: Record<string, unknown>) => ({
              timestamp: String(item[timestampField]),
              value: item[valueField] as number,
            }),
          );

          setData(initialData);
        } catch (err) {
          console.error("解析初始数据失败:", err);
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "创建 SSE 连接失败");
      setLoading(false);
      console.error("SSE 连接错误:", err);
    }
  }, [
    apiEndpoint,
    useSSE,
    timeRange,
    customTimeRange,
    maxDataPoints,
    timestampField,
    valueField,
  ]);

  // 断开 SSE 连接
  const disconnectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
      console.log("SSE 连接已关闭");
    }
  }, []);

  // 初始化数据
  useEffect(() => {
    if (mockData) {
      const initialData = generateMockData(timeRange);
      setData(initialData);
    } else if (useSSE) {
      connectSSE();
    } else {
      fetchDataFromAPI(timeRange);
    }

    // 清理函数：断开 SSE 连接
    return () => {
      if (useSSE) {
        disconnectSSE();
      }
    };
  }, [
    timeRange,
    mockData,
    useSSE,
    generateMockData,
    fetchDataFromAPI,
    connectSSE,
    disconnectSSE,
  ]);

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
    } else if (useSSE) {
      // 重新连接 SSE
      disconnectSSE();
      setData([]);
      connectSSE();
    } else {
      fetchDataFromAPI(timeRange);
    }
  }, [
    mockData,
    useSSE,
    timeRange,
    generateMockData,
    fetchDataFromAPI,
    connectSSE,
    disconnectSSE,
  ]);

  return {
    data,
    loading,
    error,
    refresh,
    isConnected, // SSE 连接状态
    connectSSE,
    disconnectSSE,
  };
};
