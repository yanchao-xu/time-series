# 字段映射配置示例

## 后端数据格式

你的后端返回的数据格式：

```json
[
  {
    "external_id": "PUMP01_TEMP",
    "name": "出口温度",
    "asset": "泵组-01",
    "value": 58.74,
    "unit": "℃",
    "quality": "Good",
    "event_time": "2026-03-12T08:09:19.198846+00:00",
    "inception_time": "2026-03-12T08:09:19.198882+00:00"
  }
]
```

## SSE 后端要求

当使用 SSE 时，前端会通过 query params 传递字段映射配置：

```
GET /api/stream?range=10m&timestampField=event_time&valueField=value
```

后端应该：
1. 读取 `timestampField` 和 `valueField` 参数
2. 返回包含这些字段的数据数组
3. 支持单条或批量数据推送

### SSE 响应格式示例

```
data: [{"event_time": "2026-03-12T08:09:19.198846+00:00", "value": 58.74}]

data: [{"event_time": "2026-03-12T08:09:20.198846+00:00", "value": 59.12}]
```

或单条数据：

```
data: {"event_time": "2026-03-12T08:09:19.198846+00:00", "value": 58.74}
```

## 配置方法

在 `App.tsx` 中使用 `AdvancedTimeSeriesChart` 时，添加 `timestampField` 和 `valueField` 配置：

```tsx
<AdvancedTimeSeriesChart
  title="实时监控数据"
  defaultRange="10m"
  mockData={false}
  apiEndpoint="http://localhost:8900/api/stream"
  useSSE={true}
  showStats={true}
  timestampField="event_time"  // 指定时间戳字段
  valueField="value"            // 指定数值字段
/>
```

## 可选的时间戳字段

根据你的需求，可以选择：
- `event_time` - 事件时间
- `inception_time` - 创建时间

## 完整示例

### 使用 event_time 作为时间戳

```tsx
import React, { useState } from "react";
import AdvancedTimeSeriesChart from "./AdvancedTimeSeriesChart";
import "./App.css";

function App() {
  const useSSE = true;
  const sseEndpoint = "http://localhost:8900/api/stream";

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          泵组温度监控
        </h1>

        <AdvancedTimeSeriesChart
          title="PUMP01 出口温度"
          defaultRange="10m"
          mockData={false}
          apiEndpoint={sseEndpoint}
          useSSE={true}
          showStats={true}
          timestampField="event_time"
          valueField="value"
        />
      </div>
    </div>
  );
}

export default App;
```

### 使用 inception_time 作为时间戳

```tsx
<AdvancedTimeSeriesChart
  title="PUMP01 出口温度"
  defaultRange="10m"
  mockData={false}
  apiEndpoint={sseEndpoint}
  useSSE={true}
  showStats={true}
  timestampField="inception_time"  // 使用 inception_time
  valueField="value"
/>
```

## 直接使用 Hook

如果你想直接使用 `useTimeSeriesData` hook：

```tsx
import { useTimeSeriesData } from "./hooks/useTimeSeriesData";

function MyComponent() {
  const { data, loading, error, isConnected } = useTimeSeriesData("10m", {
    mockData: false,
    useSSE: true,
    apiEndpoint: "http://localhost:8900/api/stream",
    timestampField: "event_time",  // 映射到 event_time 字段
    valueField: "value",            // 映射到 value 字段
    maxDataPoints: 120,
  });

  // 使用 data...
}
```

## 注意事项

1. `timestampField` 默认值为 `'timestamp'`
2. `valueField` 默认值为 `'value'`
3. 如果你的后端字段名与默认值相同，可以不配置
4. 时间戳字段应该是 ISO 8601 格式的字符串
5. 数值字段应该是数字类型

## 对比图表配置

`ComparisonTimeSeriesChart` 组件也支持字段映射：

```tsx
<ComparisonTimeSeriesChart
  title="时间跨度对比分析"
  apiEndpoint="http://localhost:3001/api/timeseries/comparison"
  alignBy="relative"
  timestampField="event_time"
  valueField="value"
/>
```

## 支持的数据格式

Hook 会自动处理以下几种返回格式：

### HTTP API (非 SSE)
1. 直接数组：`[{event_time: "...", value: 58.74}, ...]`
2. 包装对象：`{data: [{event_time: "...", value: 58.74}, ...]}`

### SSE 实时数据
1. 数组格式（推荐）：`data: [{event_time: "...", value: 58.74}, ...]`
2. 单条数据：`data: {event_time: "...", value: 58.74}`

## 后端实现参考

### Node.js SSE 服务器示例

```javascript
app.get('/api/stream', (req, res) => {
  const { range, timestampField = 'timestamp', valueField = 'value' } = req.query;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  const interval = setInterval(() => {
    // 模拟从数据库获取数据
    const data = [
      {
        external_id: "PUMP01_TEMP",
        name: "出口温度",
        asset: "泵组-01",
        value: Math.random() * 100,
        unit: "℃",
        quality: "Good",
        event_time: new Date().toISOString(),
        inception_time: new Date().toISOString()
      }
    ];
    
    // 发送数据（前端会根据 timestampField 和 valueField 提取字段）
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }, 2000);
  
  req.on('close', () => {
    clearInterval(interval);
  });
});
```
