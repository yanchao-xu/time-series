import React, { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon, CheckIcon } from '@radix-ui/react-icons'
import { useTimeSeriesData, type TimeRange, type CustomTimeRange } from './hooks/useTimeSeriesData'

interface AdvancedTimeSeriesChartProps {
  title?: string
  defaultRange?: TimeRange
  apiEndpoint?: string
  mockData?: boolean
  showStats?: boolean
  onConfigureDataSource?: () => void
  useSSE?: boolean // 是否使用 SSE
  maxDataPoints?: number // 最大数据点数量
  timestampField?: string // 时间戳字段名
  valueField?: string // 数值字段名
  queryParams?: Record<string, string>
}

const AdvancedTimeSeriesChart: React.FC<AdvancedTimeSeriesChartProps> = ({
  title = '实时数据监控',
  defaultRange = '10m',
  apiEndpoint,
  mockData = true,
  showStats = true,
  onConfigureDataSource,
  useSSE = false,
  maxDataPoints = 120,
  timestampField = 'timestamp',
  valueField = 'value',
}) => {
  const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange)
  const [showCustomRange, setShowCustomRange] = useState(false)
  const [customTimeRange, setCustomTimeRange] = useState<CustomTimeRange>({
    from: 'now-5m',
    to: 'now',
  })

  const chartRef = useRef<ReactECharts>(null)
  const [dataZoomState, setDataZoomState] = useState<{ start: number; end: number } | null>(null)

  const { data, loading, error, refresh, isConnected } = useTimeSeriesData(timeRange, {
    apiEndpoint,
    mockData,
    updateInterval: 2000,
    customTimeRange: timeRange === 'custom' ? customTimeRange : undefined,
    useSSE,
    maxDataPoints,
    timestampField,
    valueField,
  })

  // 当时间范围改变时，重置 dataZoom 状态
  useEffect(() => {
    setDataZoomState(null)
  }, [timeRange, customTimeRange])

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '10m', label: '最近10分钟' },
    { value: '30m', label: '最近30分钟' },
    { value: '1h', label: '最近1小时' },
    { value: '1d', label: '最近1天' },
    { value: 'yesterday', label: '昨天' },
  ]

  // 应用自定义时间范围
  const handleApplyCustomRange = () => {
    if (customTimeRange.from && customTimeRange.to) {
      setTimeRange('custom')
      setShowCustomRange(false)
    }
  }

  // 显示当前时间范围的标签
  const getCurrentRangeLabel = () => {
    if (timeRange === 'custom') {
      return `${customTimeRange.from} 至 ${customTimeRange.to}`
    }
    return timeRangeOptions.find((opt) => opt.value === timeRange)?.label || timeRange
  }

  // 监听 dataZoom 事件，保存用户的缩放状态
  const onChartEvents = {
    dataZoom: (params: {
      batch?: Array<{ start: number; end: number }>
      start?: number
      end?: number
    }) => {
      if (params.batch && params.batch.length > 0) {
        setDataZoomState({
          start: params.batch[0].start,
          end: params.batch[0].end,
        })
      } else if (params.start !== undefined && params.end !== undefined) {
        setDataZoomState({
          start: params.start,
          end: params.end,
        })
      }
    },
  }

  // 计算统计数据
  //   const stats = {
  //     count: data.length,
  //     latest: data[data.length - 1]?.value || 0,
  //     average:
  //       data.length > 0
  //         ? data.reduce((sum, item) => sum + item.value, 0) / data.length
  //         : 0,
  //     max: data.length > 0 ? Math.max(...data.map((d) => d.value)) : 0,
  //     min: data.length > 0 ? Math.min(...data.map((d) => d.value)) : 0,
  //   };

  const option: EChartsOption = {
    backgroundColor: '#1a1f2e',
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(26, 31, 46, 0.95)',
      borderColor: '#374151',
      borderWidth: 1,
      padding: 12,
      textStyle: {
        color: '#e5e7eb',
        fontSize: 12,
      },
      axisPointer: {
        type: 'line',
        lineStyle: {
          color: '#4b5563',
          type: 'dashed',
        },
      },
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '3%',
      top: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'time',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: (value: number) => {
          const date = new Date(value)
          if (timeRange === '1d' || timeRange === 'yesterday') {
            return date.toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }
          return date.toLocaleTimeString('zh-CN')
        },
        color: '#6b7280',
        fontSize: 11,
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#2d3748',
          type: 'dotted',
        },
      },
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false,
      },
      axisTick: {
        show: false,
      },
      axisLabel: {
        formatter: '{value}',
        color: '#6b7280',
        fontSize: 11,
      },
      splitLine: {
        lineStyle: {
          color: '#2d3748',
          type: 'dotted',
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        start: dataZoomState?.start ?? 0,
        end: dataZoomState?.end ?? 100,
      },
      {
        start: dataZoomState?.start ?? 0,
        end: dataZoomState?.end ?? 100,
        height: 30,
      },
    ],
    series: [
      {
        name: '数据',
        type: 'line',
        smooth: false,
        symbol: 'none',
        sampling: 'lttb',
        itemStyle: {
          color: '#22c55e',
        },
        lineStyle: {
          width: 1.5,
          color: '#22c55e',
        },
        emphasis: {
          focus: 'series',
        },
        data: data.map((d) => [d.timestamp, d.value]),
      },
    ],
    animation: true,
    animationDuration: 300,
    animationEasing: 'linear',
  }

  // 内联样式定义（用于 Shadow DOM）
  const selectContentStyle: React.CSSProperties = {
    background: '#1f2937',
    border: '1px solid #4b5563',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
    minWidth: '160px',
    borderRadius: '8px',
  }

  const selectItemStyle: React.CSSProperties = {
    fontSize: '14px',
    padding: '10px 32px 10px 12px',
    color: '#e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }

  const selectItemHoverStyle: React.CSSProperties = {
    ...selectItemStyle,
    background: '#374151',
    color: '#ffffff',
  }

  const selectItemCheckedStyle: React.CSSProperties = {
    ...selectItemStyle,
    background: '#1e40af',
    color: '#ffffff',
  }

  const customInputStyle: React.CSSProperties = {
    background: '#374151',
    border: '1px solid #4b5563',
    color: '#e5e7eb',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    outline: 'none',
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4">
        <div className="max-w-md rounded-lg border border-red-700 bg-red-900 p-6">
          <h3 className="mb-2 font-bold text-red-200">加载失败</h3>
          <p className="mb-4 text-red-300">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={refresh}
              className="rounded bg-red-700 px-4 py-2 text-white hover:bg-red-600"
            >
              重试
            </button>
            {onConfigureDataSource && (
              <button
                onClick={onConfigureDataSource}
                className="rounded bg-blue-700 px-4 py-2 text-white hover:bg-blue-600"
              >
                重新配置数据源
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* 图表卡片 */}
      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-gray-200">{title}</h2>
            {useSSE && (
              <span
                className={`rounded-full px-2 py-1 text-xs ${
                  isConnected
                    ? 'border border-green-700 bg-green-900 text-green-300'
                    : 'border border-red-700 bg-red-900 text-red-300'
                }`}
              >
                {isConnected ? '● 已连接' : '○ 未连接'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Select.Root
              value={timeRange === 'custom' ? 'custom' : timeRange}
              onValueChange={(value) => {
                if (value === 'custom') {
                  setShowCustomRange(true)
                } else {
                  setTimeRange(value as TimeRange)
                }
              }}
            >
              <Select.Trigger
                className="inline-flex min-w-[130px] items-center justify-between gap-2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 transition-all hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={loading}
              >
                <Select.Value>
                  {timeRange === 'custom' ? '自定义' : getCurrentRangeLabel()}
                </Select.Value>
                <Select.Icon>
                  <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                </Select.Icon>
              </Select.Trigger>

              <Select.Portal>
                <Select.Content style={selectContentStyle} position="popper" sideOffset={5}>
                  <Select.Viewport style={{ padding: '4px' }}>
                    {timeRangeOptions.map((option) => (
                      <Select.Item
                        key={option.value}
                        value={option.value}
                        style={selectItemStyle}
                        onMouseEnter={(e) => {
                          Object.assign(e.currentTarget.style, selectItemHoverStyle)
                        }}
                        onMouseLeave={(e) => {
                          Object.assign(e.currentTarget.style, selectItemStyle)
                        }}
                      >
                        <Select.ItemText>{option.label}</Select.ItemText>
                        <Select.ItemIndicator style={{ position: 'absolute', left: '8px' }}>
                          <CheckIcon
                            style={{
                              width: '14px',
                              height: '14px',
                              color: '#60a5fa',
                            }}
                          />
                        </Select.ItemIndicator>
                      </Select.Item>
                    ))}
                    <Select.Separator
                      style={{
                        height: '1px',
                        background: '#4b5563',
                        margin: '4px 0',
                      }}
                    />
                    <Select.Item
                      value="custom"
                      style={selectItemStyle}
                      onMouseEnter={(e) => {
                        Object.assign(e.currentTarget.style, selectItemHoverStyle)
                      }}
                      onMouseLeave={(e) => {
                        Object.assign(e.currentTarget.style, selectItemStyle)
                      }}
                    >
                      <Select.ItemText>自定义时间...</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            <button
              onClick={refresh}
              disabled={loading}
              className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '加载中...' : '刷新'}
            </button>
          </div>
        </div>

        {/* 图表 */}
        <div className="relative" style={{ height: '400px' }}>
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-800 bg-gray-800/75">
              <div className="text-sm text-gray-400">加载中...</div>
            </div>
          )}
          <ReactECharts
            ref={chartRef}
            option={option}
            style={{ height: '100%', width: '100%' }}
            notMerge={false}
            lazyUpdate={true}
            onEvents={onChartEvents}
          />
        </div>
      </div>

      {/* 统计信息 */}
      {/* {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">数据点数</div>
            <div className="text-xl font-semibold text-gray-200">
              {stats.count}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">最新值</div>
            <div className="text-xl font-semibold text-blue-400">
              {stats.latest.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">平均值</div>
            <div className="text-xl font-semibold text-green-400">
              {stats.average.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">最大值</div>
            <div className="text-xl font-semibold text-red-400">
              {stats.max.toFixed(2)}
            </div>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">最小值</div>
            <div className="text-xl font-semibold text-purple-400">
              {stats.min.toFixed(2)}
            </div>
          </div>
        </div>
      )} */}

      {/* 自定义时间范围弹窗 */}
      {showCustomRange && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: '#1f2937',
              borderRadius: '8px',
              border: '1px solid #4b5563',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
            }}
          >
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#ffffff',
                marginBottom: '16px',
              }}
            >
              自定义时间范围
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px',
                }}
              >
                From
              </label>
              <input
                type="text"
                value={customTimeRange.from}
                onChange={(e) =>
                  setCustomTimeRange({
                    ...customTimeRange,
                    from: e.target.value,
                  })
                }
                style={customInputStyle}
                placeholder="now-5m"
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                支持格式: now-5m, now-1h, now-1d 或 ISO 日期时间
              </p>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#d1d5db',
                  marginBottom: '8px',
                }}
              >
                To
              </label>
              <input
                type="text"
                value={customTimeRange.to}
                onChange={(e) => setCustomTimeRange({ ...customTimeRange, to: e.target.value })}
                style={customInputStyle}
                placeholder="now"
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6'
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#4b5563'
                  e.target.style.boxShadow = 'none'
                }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                支持格式: now 或 ISO 日期时间
              </p>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setShowCustomRange(false)}
                style={{
                  padding: '8px 16px',
                  background: '#374151',
                  color: '#ffffff',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#4b5563')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#374151')}
              >
                取消
              </button>
              <button
                onClick={handleApplyCustomRange}
                style={{
                  padding: '8px 16px',
                  background: '#2563eb',
                  color: '#ffffff',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1d4ed8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#2563eb')}
              >
                应用时间范围
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdvancedTimeSeriesChart
