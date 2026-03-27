# SSE (Server-Sent Events) 使用指南

## 什么是 SSE？

SSE 是一种服务器向客户端推送数据的技术，特点：
- 单向通信（服务器 → 客户端）
- 基于 HTTP，实现简单
- 自动重连机制
- 适合实时数据推送场景

## 快速开始

### 1. 安装依赖

```bash
npm install express cors
```

### 2. 启动 SSE 服务器

```bash
node server-sse-example.js
```

服务器会在 `http://localhost:3001` 启动，提供以下端点：

- `GET /api/timeseries?range=10m` - 获取历史数据
- `GET /api/timeseries/stream?range=10m` - SSE 实时推送
- `GET /health` - 健康检查

### 3. 启动前端应用

```bash
npm run dev
```

## 使用方式

### 基础用法

```tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function App() {
  return (
    <AdvancedTimeSeriesChart
      title="实时监控数据"
      defaultRange="10m"
      updateMode="sse"
      apiEndpoint="http://localhost:3001/api/timeseries"
      showStats={true}
    />
  );
}
```

### 切换不同模式

组件支持三种数据更新模式：

```tsx
// 1. SSE 模式（推荐用于实时数据）
<AdvancedTimeSeriesChart
  updateMode="sse"
  apiEndpoint="http://localhost:3001/api/timeseries"
/>

// 2. 轮询模式（定期调用 API）
<AdvancedTimeSeriesChart
  updateMode="polling"
  apiEndpoint="http://localhost:3001/api/timeseries"
  updateInterval={5000}  // 每 5 秒轮询一次
/>

// 3. Mock 模式（本地模拟数据）
<AdvancedTimeSeriesChart
  updateMode="mock"
  updateInterval={2000}
/>
```

## SSE 服务器实现

### Node.js + Express 示例

```javascript
app.get('/api/timeseries/stream', (req, res) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 定期推送数据
  const intervalId = setInterval(() => {
    const dataPoint = {
      timestamp: new Date().toISOString(),
      value: Math.random() * 100
    };
    res.write(`data: ${JSON.stringify(dataPoint)}\n\n`);
  }, 2000);
  
  // 清理
  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});
```

### Python + FastAPI 示例

```python
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import asyncio
import json
from datetime import datetime

app = FastAPI()

async def event_generator():
    while True:
        data = {
            "timestamp": datetime.now().isoformat(),
            "value": random.random() * 100
        }
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(2)

@app.get("/api/timeseries/stream")
async def stream():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

## 数据格式

### 初始数据 API 响应

```json
{
  "success": true,
  "range": "10m",
  "count": 120,
  "data": [
    {
      "timestamp": "2024-03-12T10:00:00.000Z",
      "value": 45.23
    },
    {
      "timestamp": "2024-03-12T10:00:05.000Z",
      "value": 47.89
    }
  ]
}
```

### SSE 推送数据格式

```
data: {"timestamp":"2024-03-12T10:05:00.000Z","value":52.34}

data: {"timestamp":"2024-03-12T10:05:02.000Z","value":51.78}
```

## 优势对比

| 特性 | SSE | WebSocket | 轮询 |
|------|-----|-----------|------|
| 实时性 | 高 | 最高 | 中 |
| 实现复杂度 | 低 | 中 | 低 |
| 服务器压力 | 低 | 低 | 高 |
| 双向通信 | ❌ | ✅ | ❌ |
| 自动重连 | ✅ | ❌ | N/A |
| 浏览器支持 | 好 | 好 | 最好 |

## 最佳实践

1. **错误处理**: SSE 连接可能中断，组件已内置重连机制
2. **数据窗口**: 保持固定数量的数据点（默认 120 个），避免内存溢出
3. **连接状态**: 显示连接状态指示器，让用户知道数据是否实时
4. **历史数据**: 先通过 REST API 加载历史数据，再通过 SSE 接收增量更新
5. **清理资源**: 组件卸载时自动关闭 SSE 连接

## 故障排查

### 问题：SSE 连接失败

检查：
- 服务器是否启动
- CORS 配置是否正确
- 浏览器控制台是否有错误

### 问题：数据不更新

检查：
- 网络面板中 SSE 连接是否保持
- 服务器是否正常推送数据
- 数据格式是否正确

### 问题：连接频繁断开

可能原因：
- 网络不稳定
- 服务器超时设置
- 代理或防火墙限制

## 生产环境建议

1. 添加认证机制（JWT Token）
2. 实现心跳检测
3. 限制并发连接数
4. 添加监控和日志
5. 使用负载均衡时注意 sticky session
