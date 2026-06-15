import './style.css'
import * as echarts from 'echarts'
import { salesData } from './data.js'

const chartDom = document.getElementById('chart')
const myChart = echarts.init(chartDom)

const months = salesData.map(d => d.month)
const values = salesData.map(d => d.sales)

const option = {
  title: {
    text: '肖氏电商集团 — 2025年运动鞋月度销售额',
    subtext: '单位：百万元',
    left: 'center',
    textStyle: { color: '#333' },
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      const p = params[0]
      return `${p.name}<br/>销售额：<b>${p.value}</b> 百万元`
    },
  },
  grid: {
    left: '8%',
    right: '8%',
    bottom: '8%',
    top: '18%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    data: months,
    axisLabel: { fontSize: 13 },
  },
  yAxis: {
    type: 'value',
    name: '销售额（百万元）',
    min: 0,
    axisLabel: {
      formatter: '{value}',
    },
  },
  series: [
    {
      name: '销售额',
      type: 'bar',
      data: values,
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#667eea' },
          { offset: 1, color: '#764ba2' },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
      emphasis: {
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#f093fb' },
            { offset: 1, color: '#f5576c' },
          ]),
        },
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        fontSize: 12,
        color: '#666',
      },
      barWidth: '50%',
    },
  ],
}

myChart.setOption(option)

// 响应式
window.addEventListener('resize', () => myChart.resize())
