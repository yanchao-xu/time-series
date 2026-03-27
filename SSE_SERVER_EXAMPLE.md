# SSE 服务器实现示例

本文档提供了如何实现 SSE (Server-Sent Events) 服务器端的示例代码。

## Node.js + Express 示例

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

// 启用 CORS
app.use(cors());

// SSE 端点
app.get('/api/timeseries/stream', (req, res) => {
  // 设置 SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // 获取查询参数
  const range = req.query.range || '10m';
  const from = req.query.from;
  const to = req.query.to;

  console.log(`SSE 连接建立: range=${range}, from=${from}, to=${to}`);

  // 发送初始数据（可选）
  const initialData = generateInitialData(range, from, to);
  res.write(`event: init\n`);
  res.write(`data: ${JSON.stringify(initialData)}\n\n`);

  // 定期发送新数据
  const intervalId = setInterval(() => {
    const dataPoint = {
      timestamp: new Date().toISOString(),
      value: 50 + Math.random() * 50
    };

    // 发送数据
    res.write(`data: ${JSON.stringify(dataPoint)}\n\n`);
  }, 2000); // 每 2 秒发送一次

  // 客户端断开连接时清理
  req.on('close', () => {
    clearInterval(intervalId);
    console.log('SSE 连接关闭');
    res.end();
  });
});

// 生成初始数据
function generateInitialData(range, from, to) {
  const data = [];
  const now = new Date();
  let startTime;
  let points = 120;

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
    default:
      startTime = new Date(now.getTime() - 10 * 60 * 1000);
  }

  const interval = (now.getTime() - startTime.getTime()) / points;

  for (let i = 0; i < points; i++) {
    const time = new Date(startTime.getTime() + i * interval);
    data.push({
      timestamp: time.toISOString(),
      value: 50 + Math.sin(i / 20) * 20 + (Math.random() - 0.5) * 10
    });
  }

  return data;
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`SSE 服务器运行在 http://localhost:${PORT}`);
});
```

## Python + Flask 示例

```python
from flask import Flask, Response, request
from flask_cors import CORS
import json
import time
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

def generate_initial_data(range_param):
    """生成初始数据"""
    data = []
    now = datetime.now()
    points = 120
    
    if range_param == '10m':
        start_time = now - timedelta(minutes=10)
    elif range_param == '30m':
        start_time = now - timedelta(minutes=30)
    elif range_param == '1h':
        start_time = now - timedelta(hours=1)
    elif range_param == '1d':
        start_time = now - timedelta(days=1)
    else:
        start_time = now - timedelta(minutes=10)
    
    interval = (now - start_time).total_seconds() / points
    
    for i in range(points):
        timestamp = start_time + timedelta(seconds=i * interval)
        value = 50 + random.uniform(-25, 25)
        data.append({
            'timestamp': timestamp.isoformat(),
            'value': value
        })
    
    return data

@app.route('/api/timeseries/stream')
def stream():
    """SSE 端点"""
    def event_stream():
        range_param = request.args.get('range', '10m')
        
        # 发送初始数据
        initial_data = generate_initial_data(range_param)
        yield f"event: init\ndata: {json.dumps(initial_data)}\n\n"
        
        # 持续发送新数据
        while True:
            data_point = {
                'timestamp': datetime.now().isoformat(),
                'value': 50 + random.uniform(-25, 25)
            }
            yield f"data: {json.dumps(data_point)}\n\n"
            time.sleep(2)  # 每 2 秒发送一次
    
    return Response(
        event_stream(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no'
        }
    )

if __name__ == '__main__':
    app.run(port=3001, threaded=True)
```

## 使用说明

### 1. 启动服务器

**Node.js:**
```bash
npm install express cors
node sse-server.js
```

**Python:**
```bash
pip install flask flask-cors
python sse-server.py
```

### 2. 配置前端

在 `src/App.tsx` 中设置：

```typescript
const useSSE = true;
const sseEndpoint = 'http://localhost:3001/api/timeseries/stream';
```

### 3. SSE 数据格式

服务器应发送以下格式的数据：

**标准消息:**
```
data: {"timestamp":"2024-01-01T12:00:00.000Z","value":75.5}\n\n
```

**初始数据批量加载 (可选):**
```
event: init
data: [{"timestamp":"2024-01-01T12:00:00.000Z","value":75.5},...]\n\n
```

**自定义事件 (可选):**
```
event: data
data: {"timestamp":"2024-01-01T12:00:00.000Z","value":75.5}\n\n
```

## 生产环境注意事项

1. **连接管理**: 实现心跳机制，定期发送注释行保持连接
2. **错误处理**: 添加重连逻辑和错误恢复机制
3. **性能优化**: 限制并发连接数，使用连接池
4. **安全性**: 添加身份验证和授权检查
5. **监控**: 记录连接状态和数据发送情况

## 测试 SSE 连接

使用 curl 测试：
```bash
curl -N http://localhost:3001/api/timeseries/stream?range=10m
```

使用浏览器开发者工具的 Network 标签查看 EventStream 类型的请求。
