import { useEffect, useRef, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

// 时间范围类型
export type TimeRange = '10m' | '30m' | '1h' | '1d' | 'yesterday';

interface TimeSeriesChartProps {
    title?: string;
    defaultRange?: TimeRange;
}

// 生成模拟数据的函数
const generateMockData = (range: TimeRange) => {
    const now = new Date();
    const data: [string, number][] = [];
    let startTime: Date;
    let interval: number; // 毫秒
    let points: number;

    switch (range) {
        case '10m':
            startTime = new Date(now.getTime() - 10 * 60 * 1000);
            interval = 5000; // 5秒一个点
            points = 120;
            break;
        case '30m':
            startTime = new Date(now.getTime() - 30 * 60 * 1000);
            interval = 15000; // 15秒一个点
            points = 120;
            break;
        case '1h':
            startTime = new Date(now.getTime() - 60 * 60 * 1000);
            interval = 30000; // 30秒一个点
            points = 120;
            break;
        case '1d':
            startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            interval = 12 * 60 * 1000; // 12分钟一个点
            points = 120;
            break;
        case 'yesterday':
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            yesterday.setHours(0, 0, 0, 0);
            startTime = yesterday;
            interval = 12 * 60 * 1000; // 12分钟一个点
            points = 120;
            break;
        default:
            startTime = new Date(now.getTime() - 10 * 60 * 1000);
            interval = 5000;
            points = 120;
    }

    // 生成模拟数据（带有趋势和随机波动）
    const baseValue = 50;
    for (let i = 0; i < points; i++) {
        const time = new Date(startTime.getTime() + i * interval);
        const trend = Math.sin(i / 20) * 20; // 周期性趋势
        const noise = (Math.random() - 0.5) * 10; // 随机噪声
        const value = baseValue + trend + noise;
        data.push([time.toISOString(), Math.max(0, value)]);
    }

    return data;
};

const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({
    title = '实时数据监控',
    defaultRange = '10m',
}) => {
    const [timeRange, setTimeRange] = useState<TimeRange>(defaultRange);
    const [data, setData] = useState<[string, number][]>([]);
    const chartRef = useRef<ReactECharts>(null);

    // 时间范围选项
    const timeRangeOptions: { value: TimeRange; label: string }[] = [
        { value: '10m', label: '最近10分钟' },
        { value: '30m', label: '最近30分钟' },
        { value: '1h', label: '最近1小时' },
        { value: '1d', label: '最近1天' },
        { value: 'yesterday', label: '昨天' },
    ];

    // 初始化和切换时间范围时加载数据
    useEffect(() => {
        const newData = generateMockData(timeRange);
        setData(newData);
    }, [timeRange]);

    // 动态更新数据（仅对实时范围）
    useEffect(() => {
        if (timeRange === 'yesterday') return; // 昨天的数据不需要实时更新

        const timer = setInterval(() => {
            setData((prevData) => {
                const newData = [...prevData];
                const now = new Date();
                const lastValue = newData[newData.length - 1]?.[1] || 50;

                // 生成新数据点（基于上一个值的小幅波动）
                const change = (Math.random() - 0.5) * 5;
                const newValue = Math.max(0, lastValue + change);

                newData.push([now.toISOString(), newValue]);

                // 保持固定数量的数据点（滑动窗口）
                if (newData.length > 120) {
                    newData.shift();
                }

                return newData;
            });
        }, 2000); // 每2秒更新一次

        return () => clearInterval(timer);
    }, [timeRange]);

    // ECharts 配置
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
            formatter: (params: any) => {
                const param = params[0];
                const time = new Date(param.value[0]);
                const value = param.value[1].toFixed(2);
                return `${time.toLocaleString('zh-CN')}<br/>数值: ${value}`;
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
                            minute: '2-digit'
                        });
                    }
                    return date.toLocaleTimeString('zh-CN');
                },
            },
        },
        yAxis: {
            type: 'value',
            name: '数值',
            axisLabel: {
                formatter: '{value}',
            },
        },
        series: [
            {
                name: '数据',
                type: 'line',
                smooth: true,
                symbol: 'none',
                sampling: 'lttb', // 数据降采样
                itemStyle: {
                    color: '#5470c6',
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
                data: data,
            },
        ],
        animation: true,
        animationDuration: 300,
        animationEasing: 'linear',
    };

    return (
        <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* 时间范围选择器 */}
            <div className="flex gap-2 justify-center flex-wrap">
                {timeRangeOptions.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTimeRange(option.value)}
                        className={`px-4 py-2 rounded-lg transition-all ${timeRange === option.value
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        {option.label}
                    </button>
                ))}
            </div>

            {/* 图表容器 */}
            <div className="flex-1 min-h-[400px] bg-white rounded-lg shadow-lg p-4">
                <ReactECharts
                    ref={chartRef}
                    option={option}
                    style={{ height: '100%', width: '100%' }}
                    notMerge={true}
                    lazyUpdate={true}
                />
            </div>

            {/* 数据统计信息 */}
            <div className="flex gap-4 justify-center text-sm text-gray-600">
                <span>数据点数: {data.length}</span>
                <span>
                    最新值: {data[data.length - 1]?.[1]?.toFixed(2) || 'N/A'}
                </span>
                <span>
                    平均值:{' '}
                    {data.length > 0
                        ? (
                            data.reduce((sum, item) => sum + item[1], 0) / data.length
                        ).toFixed(2)
                        : 'N/A'}
                </span>
            </div>
        </div>
    );
};

export default TimeSeriesChart;
