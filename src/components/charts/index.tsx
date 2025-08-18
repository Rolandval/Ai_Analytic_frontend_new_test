import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
  ScatterDataPoint
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Реєструємо необхідні компоненти Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Типи для наших компонентів
type ChartProps<TType = 'line' | 'bar' | 'pie'> = {
  data: ChartData<TType, (number | ScatterDataPoint | null)[], unknown>;
  options?: ChartOptions<TType>;
  height?: number;
};

// Компоненти графіків
export const LineChart: React.FC<ChartProps<'line'>> = ({ data, options, height }) => {
  return <Line data={data} options={options} height={height} />;
};

export const BarChart: React.FC<ChartProps<'bar'>> = ({ data, options, height }) => {
  return <Bar data={data} options={options} height={height} />;
};

export const PieChart: React.FC<ChartProps<'pie'>> = ({ data, options, height }) => {
  return <Pie data={data} options={options} height={height} />;
};
