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
- ✅ 配置数据源URL和查询参数
- ✅ 自定义字段映射（支持不同的API数据格式）
- ✅ 可视化配置界面（无需修改代码）
- ✅ 响应式设计

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:5173，你将看到一个带有可视化配置界面的时间序列图表！

## 使用方式

### 方式 1：可视化配置界面（推荐）

使用 `ConfigurableTimeSeriesChart` 组件，提供完整的配置界面：

```tsx
import ConfigurableTimeSeriesChart from './ConfigurableTimeSeriesChart';

function App() {
  return <ConfigurableTimeSeriesChart />;
}
```

功能包括：
- 在界面上切换模拟数据/真实 API
- 配置 API 端点 URL
- 添加/删除查询参数
- 设置字段映射
- 实时预览配置效果

详细使用说明请查看 [CONFIGURATION_UI_GUIDE.md](./CONFIGURATION_UI_GUIDE.md)

### 方式 2：代码配置

#### 基础版本（TimeSeriesChart）

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

功能更丰富，支持API集成、统计信息和自定义配置：

```tsx
import AdvancedTimeSeriesChart from './AdvancedTimeSeriesChart';

function App() {
  return (
    <AdvancedTimeSeriesChart 
      title="服务器监控" 
      defaultRange="1h"
      mockData={false}
      showStats={true}
      apiEndpoint="https://api.example.com/metrics"
      queryParams={{
        server: 'server-01',
        metric: 'cpu'
      }}
      valueField="usage"
      timestampField="measured_at"
    />
  );
}
```

#### 组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `"实时数据监控"` | 图表标题 |
| `defaultRange` | `TimeRange` | `"10m"` | 默认时间范围 |
| `apiEndpoint` | `string` | `undefined` | API数据源URL |
| `mockData` | `boolean` | `true` | 是否使用模拟数据 |
| `showStats` | `boolean` | `true` | 是否显示统计信息 |
| `queryParams` | `Record<string, string \| number>` | `{}` | URL查询参数 |
| `valueField` | `string` | `"value"` | 数值字段名 |
| `timestampField` | `string` | `"timestamp"` | 时间戳字段名 |

## 自定义 Hook

使用 `useTimeSeriesData` Hook 来管理数据：

```tsx
import { useTimeSeriesData } from './hooks/useTimeSeriesData';

function MyComponent() {
  const { data, loading, error, refresh } = useTimeSeriesData('10m', {
    apiEndpoint: 'https://api.example.com/metrics',
    mockData: false,
    updateInterval: 2000,
    queryParams: { server: 'server-01' },
    valueField: 'metric',
    timestampField: 'time',
  });

  // 使用 data 进行自定义渲染
}
```

## API 配置

### 配置数据源 URL

```tsx
<AdvancedTimeSeriesChart
  apiEndpoint="https://api.example.com/metrics"
  mockData={false}
/>
```

### 添加查询参数

```tsx
<AdvancedTimeSeriesChart
  apiEndpoint="https://api.example.com/metrics"
  queryParams={{
    server: 'server-01',
    metric: 'cpu',
    interval: '5m'
  }}
  mockData={false}
/>
```

实际请求的 URL：
```
https://api.example.com/metrics?range=1h&server=server-01&metric=cpu&interval=5m
```

### 自定义字段映射

如果你的 API 返回的字段名不是标准的 `timestamp` 和 `value`：

```tsx
<AdvancedTimeSeriesChart
  apiEndpoint="https://api.example.com/temperature"
  valueField="temp"           // 使用 "temp" 字段作为数值
  timestampField="recordTime" // 使用 "recordTime" 字段作为时间戳
  mockData={false}
/>
```

API 响应示例：
```json
{
  "data": [
    { "recordTime": "2024-01-01T10:00:00Z", "temp": 25.5 },
    { "recordTime": "2024-01-01T10:05:00Z", "temp": 26.2 }
  ]
}
```

详细配置说明请查看 [API_CONFIG_GUIDE.md](./API_CONFIG_GUIDE.md)

## API 数据格式

### 标准格式（推荐）

```json
{
  "data": [
    { "timestamp": "2026-03-12T10:00:00Z", "value": 42.5 },
    { "timestamp": "2026-03-12T10:00:05Z", "value": 43.2 }
  ]
}
```

### 简化格式

```json
[
  { "timestamp": "2026-03-12T10:00:00Z", "value": 42.5 },
  { "timestamp": "2026-03-12T10:00:05Z", "value": 43.2 }
]
```

### 自定义字段格式

```json
{
  "data": [
    { "time": "2026-03-12T10:00:00Z", "metric": 42.5 },
    { "time": "2026-03-12T10:00:05Z", "metric": 43.2 }
  ]
}
```

使用时配置字段映射：
```tsx
<AdvancedTimeSeriesChart
  timestampField="time"
  valueField="metric"
/>
```

### API 端点示例

API 会自动接收 `range` 参数和你配置的 `queryParams`：

```
GET /api/metrics?range=10m&server=server-01&metric=cpu
GET /api/metrics?range=30m&server=server-01&metric=cpu
GET /api/metrics?range=1h&server=server-01&metric=cpu
GET /api/metrics?range=1d&server=server-01&metric=cpu
GET /api/metrics?range=yesterday&server=server-01&metric=cpu
```

更多使用示例请查看 [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md)

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
