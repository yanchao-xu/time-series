# 时间序列数据可视化

一个功能完整的时间序列图表组件，支持多种时间范围选择和实时数据更新。

## 功能特性

- ✅ 多种时间范围：10分钟、30分钟、1小时、1天、昨天
- ✅ 实时数据更新（滑动窗口）
- ✅ 平滑动画过渡
- ✅ 数据降采样（LTTB算法）
- ✅ 交互式缩放和拖拽
- ✅ 统计信息展示（最新值、平均值、最大值、最小值）
- ✅ 支持模拟数据和真实API
- ✅ 响应式设计

## 快速开始

### 安装依赖

\`\`\`bash
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

## 组件使用

### 基础版本（TimeSeriesChart）

简单的时间序列图表，适合快速集成：

\`\`\`tsx
import TimeSeriesChart from './TimeSeriesChart';

function App() {
  return (
    <TimeSeriesChart 
      title="实时监控数据" 
      defaultRange="10m"
    />
  );
}
\`\`\`

### 高级版本（AdvancedTimeSeriesChart）

功能更丰富，支持API集成和统计信息：

\`\`\`tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function App() {
  return (
    <AdvancedTimeSeriesChart 
      title="实时监控数据" 
      defaultRange="10m"
      mockData={true}
      showStats={true}
      // apiEndpoint="/api/timeseries" // 使用真实API时取消注释
    />
  );
}
\`\`\`

## 自定义 Hook

使用 `useTimeSeriesData` Hook 来管理数据：

\`\`\`tsx
import { useTimeSeriesData } from './hooks/useTimeSeriesData';

function MyComponent() {
  const { data, loading, error, refresh } = useTimeSeriesData('10m', {
    apiEndpoint: '/api/data',
    mockData: false,
    updateInterval: 2000,
  });

  // 使用 data 进行自定义渲染
}
\`\`\`

## API 集成

如果要连接真实的后端API，你的API应该返回以下格式：

\`\`\`json
{
  "data": [
    {
      "timestamp": "2026-03-12T10:00:00.000Z",
      "value": 42.5
    },
    {
      "timestamp": "2026-03-12T10:00:05.000Z",
      "value": 43.2
    }
  ]
}
\`\`\`

### API 端点示例

\`\`\`
GET /api/timeseries?range=10m
GET /api/timeseries?range=30m
GET /api/timeseries?range=1h
GET /api/timeseries?range=1d
GET /api/timeseries?range=yesterday
\`\`\`

## 技术栈

- React 19
- TypeScript
- ECharts 5
- Tailwind CSS 4
- Vite 6

## 核心特性说明

### 1. 滑动窗口

数据点数量保持在120个左右，新数据进入时自动删除最旧的数据：

\`\`\`typescript
if (newData.length > 120) {
  newData.shift(); // 删除最旧的数据点
}
\`\`\`

### 2. 数据降采样

使用 LTTB（Largest Triangle Three Buckets）算法，在大数据量时保持图表性能：

\`\`\`typescript
series: [{
  sampling: 'lttb'
}]
\`\`\`

### 3. 平滑动画

使用线性缓动函数，让数据更新看起来更自然：

\`\`\`typescript
animation: true,
animationDuration: 300,
animationEasing: 'linear'
\`\`\`

### 4. 自适应时间格式

根据时间范围自动调整X轴标签格式：

- 10分钟/30分钟/1小时：显示完整时间（HH:MM:SS）
- 1天/昨天：只显示小时和分钟（HH:MM）

## 性能优化建议

1. **数据降采样**：对于超过1000个数据点的场景，启用 `sampling: 'lttb'`
2. **懒加载更新**：使用 `lazyUpdate={true}` 减少不必要的重绘
3. **节流更新**：调整 `updateInterval` 参数控制更新频率
4. **虚拟滚动**：对于超长时间范围，考虑分页加载

## 自定义样式

组件使用 Tailwind CSS，你可以轻松自定义样式：

\`\`\`tsx
<AdvancedTimeSeriesChart 
  className="custom-chart"
  // ... 其他属性
/>
\`\`\`

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)

## License

MIT
