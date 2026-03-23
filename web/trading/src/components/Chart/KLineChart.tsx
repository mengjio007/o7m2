import { useEffect, useRef } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface Props {
  characterId?: string
}

interface VolumeData {
  time: Time
  value: number
  color: string
}

export function KLineChart({ characterId }: Props) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const candlestickSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null)

  // Generate demo data
  const generateDemoData = () => {
    const candles: CandlestickData[] = []
    const volumes: VolumeData[] = []
    let basePrice = 1500
    const now = Math.floor(Date.now() / 1000)

    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 3600) as Time
      const open = basePrice
      const change = (Math.random() - 0.5) * 80
      const close = open + change
      const high = Math.max(open, close) + Math.random() * 20
      const low = Math.min(open, close) - Math.random() * 20
      const volume = Math.floor(Math.random() * 1000) + 100
      const isUp = close >= open

      candles.push({ time, open, high, low, close })
      volumes.push({
        time,
        value: volume,
        // 欧易风格：涨粉色，跌绿色
        color: isUp ? 'rgba(255, 107, 157, 0.4)' : 'rgba(102, 187, 106, 0.4)',
      })

      basePrice = close
    }

    return { candles, volumes }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    // 欧易风格：白底
    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#ffffff' },
        textColor: '#666666',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: '#ff6b9d',
          width: 1,
          style: 2,
          labelBackgroundColor: '#ff6b9d',
        },
        horzLine: {
          color: '#ff6b9d',
          width: 1,
          style: 2,
          labelBackgroundColor: '#ff6b9d',
        },
      },
      rightPriceScale: {
        borderColor: '#f0f0f0',
      },
      timeScale: {
        borderColor: '#f0f0f0',
        timeVisible: true,
      },
    })

    // Candlestick series - 欧易风格：涨粉色，跌绿色
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#ff6b9d',        // 涨 - 粉色
      downColor: '#66bb6a',      // 跌 - 绿色
      borderUpColor: '#ff6b9d',
      borderDownColor: '#66bb6a',
      wickUpColor: '#ff6b9d',
      wickDownColor: '#66bb6a',
    })

    // Volume series
    const volumeSeries = chart.addHistogramSeries({
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    chart.priceScale('').applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    })

    chartRef.current = chart
    candlestickSeriesRef.current = candlestickSeries
    volumeSeriesRef.current = volumeSeries

    // Load demo data
    const { candles, volumes } = generateDemoData()
    candlestickSeries.setData(candles)
    volumeSeries.setData(volumes)
    chart.timeScale().fitContent()

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      chart.applyOptions({ width, height })
    })
    resizeObserver.observe(chartContainerRef.current)

    return () => {
      resizeObserver.disconnect()
      chart.remove()
    }
  }, [])

  return (
    <div 
      ref={chartContainerRef} 
      className="w-full h-full"
    />
  )
}
