import React, { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import type { EChartsOption } from 'echarts'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon, CheckIcon, PlusIcon, TrashIcon } from '@radix-ui/react-icons'

interface TimeSeriesDataPoint {
  timestamp: string
  value: number
}

interface TimePeriod {
  id: string
  label: string
  from: string
  to: string
  color: string
  data: TimeSeriesDataPoint[]
}

interface ComparisonTimeSeriesChartProps {
  title?: string
  apiEndpoint?: string
  alignBy?: 'absolute' | 'relative' // absolute: 按实际时间对齐, relative: 按相对时间对齐（如月份、小时）
  timestampField?: string // 时间戳字段名
  valueField?: string // 数值字段名
  queryParams?: Record<string, string>
}

const PRESET_COLORS = [
  '#22c55e',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]

const ComparisonTimeSeriesChart: React.FC<ComparisonTimeSeriesChartProps> = ({
  title = '时间跨度对比分析',
  apiEndpoint,
  alignBy = 'relative',
  timestampField = 'timestamp',
  valueField = 'value',
}) => {
  const [periods, setPeriods] = useState<TimePeriod[]>([])
  const [alignMode, setAlignMode] = useState<'absolute' | 'relative'>(alignBy)
  const [showAddPeriod, setShowAddPeriod] = useState(false)
  const [newPeriod, setNewPeriod] = useState({
    label: '',
    from: '',
    to: '',
  })

  const chartRef = useRef<ReactECharts>(null)

  // 生成模拟数据
  const generateMockData = (from: string, to: string): TimeSeriesDataPoint[] => {
    const fromDate = new Date(from)
    const toDate = new Date(to)
    const duration = toDate.getTime() - fromDate.getTime()
    const points = 100
    const interval = duration / points
    const data: TimeSeriesDataPoint[] = []

    const baseValue = 50 + Math.random() * 20
    for (let i = 0; i < points; i++) {
      const time = new Date(fromDate.getTime() + i * interval)
      const trend = Math.sin(i / 15) * 15
      const noise = (Math.random() - 0.5) * 8
      const value = baseValue + trend + noise
      data.push({
        timestamp: time.toISOString(),
        value: Math.max(0, value),
      })
    }

    return data
  }

  // 从 API 获取数据
  const fetchPeriodData = async (from: string, to: string): Promise<TimeSeriesDataPoint[]> => {
    console.log('Fetching period data...', apiEndpoint)
    if (!apiEndpoint) {
      return generateMockData(from, to)
    }

    try {
      const fromISO = new Date(from).toISOString()
      const toISO = new Date(to).toISOString()
      const url = `${apiEndpoint}?from=${encodeURIComponent(fromISO)}&to=${encodeURIComponent(toISO)}`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const rawData = await response.json()

      // 转换数据格式，支持自定义字段映射
      const transformedData: TimeSeriesDataPoint[] = (
        Array.isArray(rawData) ? rawData : rawData.data || []
      ).map((item: Record<string, unknown>) => ({
        timestamp: String(item[timestampField]),
        value: item[valueField] as number,
      }))

      return transformedData
    } catch (error) {
      console.error('获取时间段数据失败:', error)
      // 失败时使用 mock 数据
      return generateMockData(from, to)
    }
  }

  // 添加时间段
  const handleAddPeriod = async () => {
    if (!newPeriod.label || !newPeriod.from || !newPeriod.to) {
      alert('请填写完整的时间段信息')
      return
    }

    // 获取数据
    const data = await fetchPeriodData(newPeriod.from, newPeriod.to)

    const period: TimePeriod = {
      id: Date.now().toString(),
      label: newPeriod.label,
      from: newPeriod.from,
      to: newPeriod.to,
      color: PRESET_COLORS[periods.length % PRESET_COLORS.length],
      data,
    }

    setPeriods([...periods, period])
    setNewPeriod({ label: '', from: '', to: '' })
    setShowAddPeriod(false)
  }

  // 删除时间段
  const handleRemovePeriod = (id: string) => {
    setPeriods(periods.filter((p) => p.id !== id))
  }

  // 转换数据用于图表显示
  const getChartData = () => {
    if (alignMode === 'absolute') {
      // 绝对时间对齐：直接使用原始时间戳
      return periods.map((period) => ({
        name: period.label,
        type: 'line' as const,
        smooth: true,
        symbol: 'none',
        itemStyle: { color: period.color },
        lineStyle: { width: 2, color: period.color },
        data: period.data.map((d) => [d.timestamp, d.value]),
      }))
    } else {
      // 相对时间对齐：将时间标准化
      return periods.map((period) => {
        const fromDate = new Date(period.from)
        const normalizedData = period.data.map((d) => {
          const timestamp = new Date(d.timestamp)
          const elapsed = timestamp.getTime() - fromDate.getTime()
          return [elapsed, d.value]
        })

        return {
          name: period.label,
          type: 'line' as const,
          smooth: true,
          symbol: 'none',
          itemStyle: { color: period.color },
          lineStyle: { width: 2, color: period.color },
          data: normalizedData,
        }
      })
    }
  }

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
      formatter: (params: unknown) => {
        if (!Array.isArray(params)) return ''

        let result = ''
        if (alignMode === 'absolute') {
          result = `<div style="font-weight: 600; margin-bottom: 8px;">${new Date((params[0] as { value: [number, number] }).value[0]).toLocaleString('zh-CN')}</div>`
        } else {
          const ms = (params[0] as { value: [number, number] }).value[0]
          const hours = Math.floor(ms / (1000 * 60 * 60))
          const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
          result = `<div style="font-weight: 600; margin-bottom: 8px;">+${hours}小时${minutes}分钟</div>`
        }

        params.forEach((param: { seriesName: string; color: string; value: [number, number] }) => {
          result += `<div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
            <span style="color: #9ca3af;">${param.seriesName}:</span>
            <span style="font-weight: 600; color: ${param.color};">${param.value[1].toFixed(2)}</span>
          </div>`
        })

        return result
      },
    },
    legend: {
      data: periods.map((p) => p.label),
      textStyle: {
        color: '#9ca3af',
      },
      top: 10,
    },
    grid: {
      left: '3%',
      right: '3%',
      bottom: '10%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: alignMode === 'absolute' ? 'time' : 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        formatter:
          alignMode === 'absolute'
            ? (value: number) =>
                new Date(value).toLocaleString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                })
            : (value: number) => {
                const hours = Math.floor(value / (1000 * 60 * 60))
                return `+${hours}h`
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
      axisLine: { show: false },
      axisTick: { show: false },
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
        start: 0,
        end: 100,
      },
      {
        start: 0,
        end: 100,
        height: 30,
      },
    ],
    series: getChartData(),
  }

  return (
    <div className="flex h-full w-full flex-col gap-4">
      {/* 图表卡片 */}
      <div className="overflow-hidden rounded-lg border border-gray-700 bg-gray-800">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-gray-700 px-4 py-3">
          <h2 className="text-sm font-medium text-gray-200">{title}</h2>

          <div className="flex items-center gap-3">
            <Select.Root
              value={alignMode}
              onValueChange={(v) => setAlignMode(v as 'absolute' | 'relative')}
            >
              <Select.Trigger className="inline-flex min-w-[120px] items-center justify-between gap-2 rounded-lg border border-gray-600 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 transition-all hover:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <Select.Value>{alignMode === 'absolute' ? '绝对时间' : '相对时间'}</Select.Value>
                <Select.Icon>
                  <ChevronDownIcon className="h-3 w-3 text-gray-400" />
                </Select.Icon>
              </Select.Trigger>
              <Select.Portal>
                <Select.Content
                  className="rounded-lg border border-gray-600 bg-gray-900 shadow-xl"
                  position="popper"
                  sideOffset={5}
                >
                  <Select.Viewport className="p-1">
                    <Select.Item
                      value="absolute"
                      className="cursor-pointer rounded px-3 py-2 text-xs text-gray-200 hover:bg-gray-700"
                    >
                      <Select.ItemText>绝对时间对齐</Select.ItemText>
                    </Select.Item>
                    <Select.Item
                      value="relative"
                      className="cursor-pointer rounded px-3 py-2 text-xs text-gray-200 hover:bg-gray-700"
                    >
                      <Select.ItemText>相对时间对齐</Select.ItemText>
                    </Select.Item>
                  </Select.Viewport>
                </Select.Content>
              </Select.Portal>
            </Select.Root>

            <button
              onClick={() => setShowAddPeriod(true)}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs text-white transition-colors hover:bg-blue-700"
            >
              <PlusIcon className="h-3 w-3" />
              添加时间段
            </button>
          </div>
        </div>

        {/* 图表 */}
        <div className="relative" style={{ height: '500px' }}>
          {periods.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="mb-4 text-gray-400">暂无对比数据</p>
                <button
                  onClick={() => setShowAddPeriod(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
                >
                  添加第一个时间段
                </button>
              </div>
            </div>
          ) : (
            <ReactECharts
              ref={chartRef}
              option={option}
              style={{ height: '100%', width: '100%' }}
              notMerge={false}
              lazyUpdate={true}
            />
          )}
        </div>
      </div>

      {/* 时间段列表 */}
      {periods.length > 0 && (
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <h3 className="mb-3 text-sm font-medium text-gray-200">对比时间段</h3>
          <div className="space-y-2">
            {periods.map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-900 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: period.color }} />
                  <div>
                    <div className="text-sm font-medium text-gray-200">{period.label}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(period.from).toLocaleString('zh-CN')} -{' '}
                      {new Date(period.to).toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleRemovePeriod(period.id)}
                  className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-red-400"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 添加时间段弹窗 */}
      {showAddPeriod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-semibold text-white">添加对比时间段</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">标签名称</label>
                <input
                  type="text"
                  value={newPeriod.label}
                  onChange={(e) => setNewPeriod({ ...newPeriod, label: e.target.value })}
                  placeholder="例如：2024年双11、去年同期"
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">开始时间</label>
                <input
                  type="datetime-local"
                  value={newPeriod.from}
                  onChange={(e) => setNewPeriod({ ...newPeriod, from: e.target.value })}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">结束时间</label>
                <input
                  type="datetime-local"
                  value={newPeriod.to}
                  onChange={(e) => setNewPeriod({ ...newPeriod, to: e.target.value })}
                  className="w-full rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddPeriod(false)
                  setNewPeriod({ label: '', from: '', to: '' })
                }}
                className="rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-600"
              >
                取消
              </button>
              <button
                onClick={handleAddPeriod}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ComparisonTimeSeriesChart
