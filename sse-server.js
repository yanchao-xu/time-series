const express = require('express');
const cors = require('cors');
const app = express();

// 启用 CORS
app.use(cors());
app.use(express.json());

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

  // 发送初始数据
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

// 对比时间段数据端点
app.get('/api/timeseries/comparison', (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.status(400).json({ error: '缺少 from 或 to 参数' });
  }

  console.log(`获取对比数据: from=${from}, to=${to}`);

  const data = generateComparisonData(from, to);
  res.json(data);
});

// 生成对比时间段数据
function generateComparisonData(from, to) {
  const fromDate = new Date(from);
  const toDate = new Date(to);
  const duration = toDate.getTime() - fromDate.getTime();
  const points = 100;
  const interval = duration / points;
  const data = [];

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
}

// 生成初始数据
function generateInitialData(range, from, to) {
  const data = [];
  const now = new Date();
  let startTime;
  let points = 120;

  // 如果提供了自定义时间范围，使用它
  if (from && to) {
    startTime = new Date(from);
    const endTime = new Date(to);
    const duration = endTime.getTime() - startTime.getTime();
    const interval = duration / points;

    for (let i = 0; i < points; i++) {
      const time = new Date(startTime.getTime() + i * interval);
      data.push({
        timestamp: time.toISOString(),
        value: 50 + Math.sin(i / 20) * 20 + (Math.random() - 0.5) * 10
      });
    }
    return data;
  }

  // 否则使用预设范围
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
  console.log(`测试 URL: http://localhost:${PORT}/api/timeseries/stream?range=10m`);
});
