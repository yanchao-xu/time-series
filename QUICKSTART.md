# 快速入门指南

## 🚀 5分钟上手

### 1. 启动项目

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
\`\`\`

打开浏览器访问 http://localhost:5173，你将看到一个实时更新的时间序列图表！

### 2. 核心功能演示

#### 切换时间范围
点击顶部的按钮可以切换不同的时间范围：
- 最近10分钟：高频数据，5秒一个点
- 最近30分钟：中频数据，15秒一个点
- 最近1小时：30秒一个点
- 最近1天：12分钟一个点
- 昨天：查看历史数据

#### 实时更新
图表会每2秒自动更新一次（除了"昨天"这个历史范围）

#### 交互功能
- 鼠标悬停：查看具体数值
- 滚轮缩放：放大/缩小时间轴
- 拖拽：平移查看不同时间段
- 底部滑块：快速定位到特定时间范围

### 3. 项目结构

\`\`\`
src/
├── App.tsx                      # 主应用入口
├── TimeSeriesChart.tsx          # 基础图表组件
├── AdvancedTimeSeriesChart.tsx  # 高级图表组件（推荐）
└── hooks/
    └── useTimeSeriesData.ts     # 数据管理 Hook
\`\`\`

### 4. 核心概念

#### 滑动窗口（Sliding Window）
图表始终保持约120个数据点，新数据进入时自动删除最旧的数据：

\`\`\`
[旧数据] ← ← ← [新数据]
   ↓ 删除        ↑ 添加
\`\`\`

#### 数据降采样（Downsampling）
使用 LTTB 算法，在保持图形特征的同时减少渲染点数，提升性能。

#### 平滑动画
数据更新时使用线性过渡，让图表看起来更流畅自然。

### 5. 自定义配置

#### 修改默认时间范围

\`\`\`tsx
<AdvancedTimeSeriesChart 
  defaultRange="1h"  // 改为1小时
/>
\`\`\`

#### 修改图表标题

\`\`\`tsx
<AdvancedTimeSeriesChart 
  title="我的监控数据"
/>
\`\`\`

#### 隐藏统计信息

\`\`\`tsx
<AdvancedTimeSeriesChart 
  showStats={false}
/>
\`\`\`

### 6. 连接真实 API

#### 步骤 1：准备 API 端点

你的 API 应该返回以下格式：

\`\`\`json
{
  "data": [
    {
      "timestamp": "2026-03-12T10:00:00.000Z",
      "value": 42.5
    }
  ]
}
\`\`\`

#### 步骤 2：配置组件

\`\`\`tsx
<AdvancedTimeSeriesChart 
  mockData={false}
  apiEndpoint="https://your-api.com/metrics"
/>
\`\`\`

### 7. 常用场景

#### 场景 1：服务器监控

\`\`\`tsx
<AdvancedTimeSeriesChart 
  title="CPU 使用率 (%)"
  defaultRange="1h"
  mockData={false}
  apiEndpoint="/api/cpu"
/>
\`\`\`

#### 场景 2：股票价格

\`\`\`tsx
<AdvancedTimeSeriesChart 
  title="股票价格 (USD)"
  defaultRange="1d"
  mockData={false}
  apiEndpoint="/api/stock/AAPL"
/>
\`\`\`

#### 场景 3：网站流量

\`\`\`tsx
<AdvancedTimeSeriesChart 
  title="访问量 (PV)"
  defaultRange="1d"
  mockData={false}
  apiEndpoint="/api/analytics/pageviews"
/>
\`\`\`

### 8. 性能优化建议

#### 对于高频数据（每秒多次更新）

\`\`\`tsx
const { data } = useTimeSeriesData('10m', {
  updateInterval: 500, // 500ms 更新一次
});
\`\`\`

#### 对于大数据量（超过1000点）

ECharts 会自动启用降采样，无需额外配置。

#### 对于多个图表

使用 React.memo 避免不必要的重渲染：

\`\`\`tsx
const MemoizedChart = React.memo(AdvancedTimeSeriesChart);
\`\`\`

### 9. 故障排查

#### 问题：图表不更新

检查：
1. \`mockData\` 是否设置正确
2. \`timeRange\` 是否为 'yesterday'（历史数据不会实时更新）
3. 浏览器控制台是否有错误

#### 问题：API 请求失败

检查：
1. API 端点是否正确
2. CORS 是否配置正确
3. 返回数据格式是否符合要求

#### 问题：性能问题

优化：
1. 减少数据点数量（调整后端返回的点数）
2. 增加 \`updateInterval\`（降低更新频率）
3. 启用数据降采样

### 10. 下一步

- 查看 [README.md](./README.md) 了解完整功能
- 查看 [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) 学习高级用法
- 修改 \`src/App.tsx\` 开始自定义你的图表

## 🎉 开始构建吧！

现在你已经掌握了基础知识，可以开始构建自己的时间序列可视化应用了。祝你编码愉快！
