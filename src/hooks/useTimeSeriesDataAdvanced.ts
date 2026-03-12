import { useState, useEffect, useCallback, useRef } from "react";

export type TimeRange = "10m" | "30m" | "1h" | "1d" | "yesterday" | "custom";
export type UpdateMode = "polling" | "websocket" | "sse" | "mock";

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
  updateMode?: UpdateMode;
  updateInterval?: number; // 毫秒（用于 polling 和 mock）
  customTimeRange?: CustomTimeRange;
  websocketUrl?: string;
  onError?: (error: Error) => void;
}

/**
 * 高级时间序列数据 Hook
 * 支持多种数据更新模式：轮询、WebSocket、SSE、Mock
 */
export const useTimeSeriesDataAdvanced = (
  timeRange: TimeRange,
  options: UseTimeSeriesDataOptions = {},
) => {
  const {
    apiEndpoint,
    updateMode = "mock",
    updateInterval = 2000,
    customTimeRange,
    websocketUrl,
    onError,
  } = options;

  const [data, setData] = useState<TimeSeriesDataPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // 从 API 获取初始数据
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
        const errorMsg = err instanceof Error ? err.message : "获取数据失败";
        setError(errorMsg);
        onError?.(err instanceof Error ? err : new Error(errorMsg));
      } finally {
        setLoading(false);
      }
    },
    [apiEndpoint, onError],
  );

  // 生成 Mock 数据
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
    [],
  );

  // WebSocket 连接
  const connectWebSocket = useCallback(() => {
    if (!websocketUrl) return;

    try {
      const ws = new WebSocket(websocketUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket 连接已建立");
        setIsConnected(true);
        setError(null);
        // 发送订阅消息
        ws.send(JSON.stringify({ action: "subscribe", timeRange }));
      };

      ws.onmessage = (event) => {
        try {
          const newDataPoint: TimeSeriesDataPoint = JSON.parse(event.data);
          setData((prevData) => {
            const newData = [...prevData, newDataPoint];
            // 保持滑动窗口
            if (newData.length > 120) {
              newData.shift();
            }
            return newData;
          });
        } catch (err) {
          console.error("解析 WebSocket 消息失败:", err);
        }
      };

      ws.onerror = (event) => {
        console.error("WebSocket 错误:", event);
        const error = new Error("WebSocket 连接错误");
        setError(error.message);
        onError?.(error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log("WebSocket 连接已关闭");
        setIsConnected(false);
        // 5秒后尝试重连
        setTimeout(() => {
          if (updateMode === "websocket") {
            connectWebSocket();
          }
        }, 5000);
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("WebSocket 连接失败");
      setError(error.message);
      onError?.(error);
    }
  }, [websocketUrl, timeRange, updateMode, onError]);

  // Server-Sent Events 连接
  const connectSSE = useCallback(() => {
    if (!apiEndpoint) return;

    try {
      const eventSource = new EventSource(`${apiEndpoint}/stream?range=${timeRange}`);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("SSE 连接已建立");
        setIsConnected(true);
        setError(null);
      };

      eventSource.onmessage = (event) => {
        try {
          const newDataPoint: TimeSeriesDataPoint = JSON.parse(event.data);
          setData((prevData) => {
            const newData = [...prevData, newDataPoint];
            if (newData.length > 120) {
              newData.shift();
            }
            return newData;
          });
        } catch (err) {
          console.error("解析 SSE 消息失败:", err);
        }
      };

      eventSource.onerror = () => {
        console.error("SSE 连接错误");
        const error = new Error("SSE 连接错误");
        setError(error.message);
        onError?.(error);
        setIsConnected(false);
        eventSource.close();
      };
    } catch (err) {
      const error = err instanceof Error ? err : new Error("SSE 连接失败");
      setError(error.message);
      onError?.(error);
    }
  }, [apiEndpoint, timeRange, onError]);

  // 初始化数据
  useEffect(() => {
    if (updateMode === "mock") {
      const initialData = generateMockData(timeRange);
      setData(initialData);
    } else {
      fetchDataFromAPI(timeRange);
    }
  }, [timeRange, updateMode, generateMockData, fetchDataFromAPI]);

  // 数据更新逻辑
  useEffect(() => {
    // 历史数据不需要实时更新
    if (timeRange === "yesterday" || timeRange === "custom") return;

    let timer: NodeJS.Timeout | null = null;

    switch (updateMode) {
      case "mock":
        // Mock 模式：模拟实时数据
        timer = setInterval(() => {
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

            if (newData.length > 120) {
              newData.shift();
            }

            return newData;
          });
        }, updateInterval);
        break;

      case "polling":
        // 轮询模式：定期调用 API
        timer = setInterval(() => {
          fetchDataFromAPI(timeRange);
        }, updateInterval);
        break;

      case "websocket":
        // WebSocket 模式：建立持久连接
        connectWebSocket();
        break;

      case "sse":
        // SSE 模式：服务器推送
        connectSSE();
        break;
    }

    return () => {
      if (timer) clearInterval(timer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [
    updateMode,
    timeRange,
    updateInterval,
    fetchDataFromAPI,
    connectWebSocket,
    connectSSE,
  ]);

  // 手动刷新
  const refresh = useCallback(() => {
    if (updateMode === "mock") {
      const newData = generateMockData(timeRange);
      setData(newData);
    } else {
      fetchDataFromAPI(timeRange);
    }
  }, [updateMode, timeRange, generateMockData, fetchDataFromAPI]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsConnected(false);
  }, []);

  return {
    data,
    loading,
    error,
    isConnected,
    refresh,
    disconnect,
  };
};
