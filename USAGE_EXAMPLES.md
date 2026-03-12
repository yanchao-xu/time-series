# 使用示例

## 1. 基础使用（模拟数据）

最简单的使用方式，使用内置的模拟数据：

\`\`\`tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function App() {
  return (
    <AdvancedTimeSeriesChart 
      title="CPU 使用率监控" 
      defaultRange="10m"
      mockData={true}
    />
  );
}
\`\`\`

## 2. 连接真实 API

### 前端代码

\`\`\`tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function App() {
  return (
    <AdvancedTimeSeriesChart 
      title="服务器监控" 
      defaultRange="1h"
      mockData={false}
      apiEndpoint="https://api.example.com/metrics"
      showStats={true}
    />
  );
}
\`\`\`

### 后端 API 示例（Node.js + Express）

\`\`\`javascript
const express = require('express');
const app = express();

app.get('/api/metrics', (req, res) => {
  const range = req.query.range; // '10m', '30m', '1h', '1d', 'yesterday'
  
  // 根据时间范围计算起始时间
  const now = new Date();
  let startTime;
  
  switch (range) {
    case '10m':
      startTime = new Date(now.getTime() - 10 * 60 * 1000);
      break;
    case '30m':
      startTime = new Date(now.getTime() - 30 * 60 * 1000);
      break;
    case '1h':
      startTime = new Date(now.getTime() - 60 * 60 * 1000);
      break;
    case '1d':
      startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case 'yesterday':
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      startTime = yesterday;
      break;
    default:
      startTime = new Date(now.getTime() - 10 * 60 * 1000);
  }
  
  // 从数据库查询数据
  const data = queryDatabase(startTime, now);
  
  res.json({
    data: data.map(item => ({
      timestamp: item.timestamp.toISOString(),
      value: item.value
    }))
  });
});

app.listen(3000);
\`\`\`

### 后端 API 示例（Python + FastAPI）

\`\`\`python
from fastapi import FastAPI, Query
from datetime import datetime, timedelta
from typing import List
import random

app = FastAPI()

@app.get("/api/metrics")
async def get_metrics(range: str = Query(...)):
    now = datetime.now()
    
    # 根据时间范围计算起始时间
    if range == "10m":
        start_time = now - timedelta(minutes=10)
        interval = timedelta(seconds=5)
    elif range == "30m":
        start_time = now - timedelta(minutes=30)
        interval = timedelta(seconds=15)
    elif range == "1h":
        start_time = now - timedelta(hours=1)
        interval = timedelta(seconds=30)
    elif range == "1d":
        start_time = now - timedelta(days=1)
        interval = timedelta(minutes=12)
    elif range == "yesterday":
        start_time = now.replace(hour=0, minute=0, second=0) - timedelta(days=1)
        interval = timedelta(minutes=12)
    else:
        start_time = now - timedelta(minutes=10)
        interval = timedelta(seconds=5)
    
    # 生成数据点
    data = []
    current_time = start_time
    while current_time <= now:
        data.append({
            "timestamp": current_time.isoformat(),
            "value": random.uniform(30, 70)  # 替换为真实数据查询
        })
        current_time += interval
    
    return {"data": data}
\`\`\`

## 3. 自定义 Hook 使用

如果你想完全自定义图表，可以直接使用 Hook：

\`\`\`tsx
import { useState } from 'react';
import { useTimeSeriesData, TimeRange } from './hooks/useTimeSeriesData';
import ReactECharts from 'echarts-for-react';

function CustomChart() {
  const [range, setRange] = useState<TimeRange>('10m');
  const { data, loading, error } = useTimeSeriesData(range, {
    mockData: true,
    updateInterval: 1000, // 每秒更新
  });

  const option = {
    xAxis: { type: 'time' },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: data.map(d => [d.timestamp, d.value])
    }]
  };

  return (
    <div>
      <select onChange={(e) => setRange(e.target.value as TimeRange)}>
        <option value="10m">10分钟</option>
        <option value="30m">30分钟</option>
        <option value="1h">1小时</option>
      </select>
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error}</p>}
      <ReactECharts option={option} />
    </div>
  );
}
\`\`\`

## 4. 多图表对比

同时显示多个指标：

\`\`\`tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function Dashboard() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <AdvancedTimeSeriesChart 
        title="CPU 使用率" 
        defaultRange="1h"
        mockData={true}
      />
      <AdvancedTimeSeriesChart 
        title="内存使用率" 
        defaultRange="1h"
        mockData={true}
      />
      <AdvancedTimeSeriesChart 
        title="网络流量" 
        defaultRange="1h"
        mockData={true}
      />
      <AdvancedTimeSeriesChart 
        title="磁盘 I/O" 
        defaultRange="1h"
        mockData={true}
      />
    </div>
  );
}
\`\`\`

## 5. WebSocket 实时数据

使用 WebSocket 推送实时数据：

\`\`\`tsx
import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

function RealtimeChart() {
  const [data, setData] = useState<Array<[string, number]>>([]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/metrics');
    
    ws.onmessage = (event) => {
      const newPoint = JSON.parse(event.data);
      setData(prev => {
        const updated = [...prev, [newPoint.timestamp, newPoint.value]];
        // 保持最近 100 个点
        return updated.slice(-100);
      });
    };

    return () => ws.close();
  }, []);

  const option = {
    xAxis: { type: 'time' },
    yAxis: { type: 'value' },
    series: [{
      type: 'line',
      data: data,
      smooth: true,
    }]
  };

  return <ReactECharts option={option} />;
}
\`\`\`

### WebSocket 服务器示例（Node.js）

\`\`\`javascript
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
  const interval = setInterval(() => {
    const data = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100
    };
    ws.send(JSON.stringify(data));
  }, 1000);

  ws.on('close', () => {
    clearInterval(interval);
  });
});
\`\`\`

## 6. 数据导出功能

添加导出 CSV 功能：

\`\`\`tsx
import { useTimeSeriesData } from './hooks/useTimeSeriesData';

function ChartWithExport() {
  const { data } = useTimeSeriesData('1h', { mockData: true });

  const exportToCSV = () => {
    const csv = [
      ['时间', '数值'],
      ...data.map(d => [d.timestamp, d.value])
    ].map(row => row.join(',')).join('\\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`data-\${new Date().toISOString()}.csv\`;
    a.click();
  };

  return (
    <div>
      <button onClick={exportToCSV}>导出 CSV</button>
      {/* 图表组件 */}
    </div>
  );
}
\`\`\`

## 7. 告警阈值线

添加告警阈值可视化：

\`\`\`tsx
const option = {
  // ... 其他配置
  series: [
    {
      name: '数据',
      type: 'line',
      data: data,
    },
    {
      name: '告警阈值',
      type: 'line',
      data: data.map(d => [d.timestamp, 80]), // 阈值 80
      lineStyle: {
        color: 'red',
        type: 'dashed',
      },
      symbol: 'none',
    }
  ]
};
\`\`\`

## 8. 响应式布局

适配移动端：

\`\`\`tsx
function ResponsiveChart() {
  return (
    <div className="w-full h-screen p-2 md:p-8">
      <AdvancedTimeSeriesChart 
        title="监控数据" 
        defaultRange="10m"
        mockData={true}
      />
    </div>
  );
}
\`\`\`

## 常见问题

### Q: 如何修改更新频率？

A: 在 \`useTimeSeriesData\` 中设置 \`updateInterval\`：

\`\`\`tsx
const { data } = useTimeSeriesData('10m', {
  updateInterval: 5000, // 5秒更新一次
});
\`\`\`

### Q: 如何处理大量数据？

A: ECharts 已经内置了 LTTB 降采样算法，自动处理大数据量。如果需要更多优化：

\`\`\`tsx
series: [{
  sampling: 'lttb',
  large: true,
  largeThreshold: 2000,
}]
\`\`\`

### Q: 如何自定义颜色？

A: 修改 \`itemStyle\` 和 \`areaStyle\`：

\`\`\`tsx
series: [{
  itemStyle: {
    color: '#ff6b6b', // 自定义颜色
  },
  areaStyle: {
    color: 'rgba(255, 107, 107, 0.3)',
  },
}]
\`\`\`
