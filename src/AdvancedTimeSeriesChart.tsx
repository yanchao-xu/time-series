import { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import { useTimeSeriesData, type TimeRange } from './hooks/useTimeSeriesData';

interface AdvancedTimeSeriesChartProps {
    title?: string;
    defaultRange?: TimeRange;
    apiEndpoint?: string;
    mockData?: boolean;
    showStats?: boolean;
}

const AdvancedTimeSeriesChart: React.FC<AdvancedTimeSeriesChartProps> = ({
    title = '实时数据监控',
    defaultRange = '10m',
    apiEndpoint,
    mockData = true,
    showStats = true,
}) => {
    const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);
    const { data, loading, error, refresh } = useTimeSeriesData(timeRange, {
        apiEndpoint,
        mockData,
        updateInterval: 2000,
    });

    const timeRangeOptions: { value: TimeRange; label: string }[] = [
        { value: '10m', label: '最近10分钟' },
        { value: '30m', label: '最近30分钟' },
        { value: '1h', label: '最近1小时' },
        { value: '1d', label: '最近1天' },
        { value: 'yesterday', label: '昨天' },
    ];

    // 计算统计数据
    const stats = {
        count: data.length,
        latest: data[data.length - 1]?.value || 0,
        average: data.length > 0
            ? data.reduce((sum, item) => sum + item.value, 0) / data.length
            : 0,
        max: data.length > 0 ? Math.max(...data.map(d => d.value)) : 0,
        min: data.length > 0 ? Math.min(...data.map(d => d.value)) : 0,
    };

    const option: EChartsOption = {
        title: {
            text: title,
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold',
            },
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985',
                },
            },
            formatter: (params: any) => {
                const param = params[0];
                const time = new Date(param.value[0]);
                const value = param.value[1].toFixed(2);
                return `
          <div style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 4px;">
              ${time.toLocaleString('zh-CN')}
            </div>
            <div>数值: <span style="color: #5470c6; font-weight: bold;">${value}</span></div>
          </div>
        `;
            },
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '10%',
            top: '15%',
            containLabel: true,
        },
        xAxis: {
            type: 'time',
            axisLabel: {
                formatter: (value: number) => {
                    const date = new Date(value);
                    if (timeRange === '1d' || timeRange === 'yesterday') {
                        return date.toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                        });
                    }
                    return date.toLocaleTimeString('zh-CN');
                },
                rotate: 0,
            },
            splitLine: {
                show: true,
                lineStyle: {
                    color: '#f0f0f0',
                },
            },
        },
        yAxis: {
            type: 'value',
            name: '数值',
            axisLabel: {
                formatter: '{value}',
            },
            splitLine: {
                lineStyle: {
                    color: '#f0f0f0',
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
        series: [
            {
                name: '数据',
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 4,
                sampling: 'lttb',
                itemStyle: {
                    color: '#5470c6',
                },
                lineStyle: {
                    width: 2,
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(84, 112, 198, 0.3)' },
                            { offset: 1, color: 'rgba(84, 112, 198, 0.05)' },
                        ],
                    },
                },
                emphasis: {
                    focus: 'series',
                },
                data: data.map(d => [d.timestamp, d.value]),
            },
        ],
        animation: true,
        animationDuration: 300,
        animationEasing: 'linear',
    };

    if (error) {
        return (
            <div className="w-full h-full flex items-center justify-center p-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <h3 className="text-red-800 font-bold mb-2">加载失败</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <button
                        onClick={refresh}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        重试
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* 控制栏 */}
            <div className="flex gap-2 justify-between items-center flex-wrap">
                <div className="flex gap-2 flex-wrap">
                    {timeRangeOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setTimeRange(option.value)}
                            disabled={loading}
                            className={`px-4 py-2 rounded-lg transition-all ${timeRange === option.value
                                ? 'bg-blue-500 text-white shadow-md'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={refresh}
                    disabled={loading}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? '加载中...' : '刷新'}
                </button>
            </div>

            {/* 图表容器 */}
            <div className="flex-1 min-h-[500px] bg-white rounded-lg shadow-lg p-4 relative">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
                        <div className="text-gray-600">加载中...</div>
                    </div>
                )}
                <ReactECharts
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>

            {/* 统计信息 */}
            {showStats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500 mb-1">数据点数</div>
                        <div className="text-2xl font-bold text-gray-800">{stats.count}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500 mb-1">最新值</div>
                        <div className="text-2xl font-bold text-blue-600">
                            {stats.latest.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500 mb-1">平均值</div>
                        <div className="text-2xl font-bold text-green-600">
                            {stats.average.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500 mb-1">最大值</div>
                        <div className="text-2xl font-bold text-red-600">
                            {stats.max.toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-sm text-gray-500 mb-1">最小值</div>
                        <div className="text-2xl font-bold text-purple-600">
                            {stats.min.toFixed(2)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancedTimeSeriesChart;
