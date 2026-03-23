import { useEffect, useRef, useState } from 'react'
import { createChart, IChartApi, ISeriesApi, CandlestickData, Time } from 'lightweight-charts'

interface Props {
  characterId?: string
}

interface KLineData {
  time: Time
  open: number
  high: number
  low: number
  close: number
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
    let basePrice = 1200
    const now = Math.floor(Date.now() / 1000)

    for (let i = 100; i >= 0; i--) {
      const time = (now - i * 3600) as Time
      const open = basePrice
      const change = (Math.random() - 0.5) * 100
      const close = open + change
      const high = Math.max(open, close) + Math.random() * 30
      const low = Math.min(open, close) - Math.random() * 30
      const volume = Math.floor(Math.random() * 1000) + 100

      candles.push({ time, open, high, low, close })
      volumes.push({
        time,
        value: volume,
        color: close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      })

      basePrice = close
    }

    return { candles, volumes }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: '#161b22' },
        textColor: '#c9d1d9',
      },
      grid: {
        vertLines: { color: '#30363d' },
        horzLines: { color: '#30363d' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: '#30363d',
      },
      timeScale: {
        borderColor: '#30363d',
        timeVisible: true,
      },
    })

    // Candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
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
