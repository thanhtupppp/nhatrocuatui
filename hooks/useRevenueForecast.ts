import { useMemo } from 'react';

interface ChartDataPoint {
  name: string;
  revenue: number;
  expense: number;
}

interface ForecastResult {
  predictedRevenue: number;
  predictedExpense: number;
  revenueGrowthPercent: number;
  expenseGrowthPercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number; // 0-100
}

/**
 * Simple Linear Regression using Least Squares Method
 * y = mx + b
 * m = (n*Σxy - Σx*Σy) / (n*Σx² - (Σx)²)
 * b = (Σy - m*Σx) / n
 */
const linearRegression = (values: number[]): { slope: number; intercept: number; r2: number } => {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
    sumY2 += values[i] * values[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (coefficient of determination)
  const yMean = sumY / n;
  let ssTotal = 0, ssResidual = 0;
  for (let i = 0; i < n; i++) {
    const predicted = slope * i + intercept;
    ssTotal += (values[i] - yMean) ** 2;
    ssResidual += (values[i] - predicted) ** 2;
  }
  const r2 = ssTotal === 0 ? 0 : 1 - ssResidual / ssTotal;

  return { slope, intercept, r2 };
};

/**
 * Custom hook to forecast next month's revenue and expense
 * Uses Linear Regression on historical data
 */
export const useRevenueForecast = (chartData: ChartDataPoint[]): ForecastResult => {
  return useMemo(() => {
    if (!chartData || chartData.length < 2) {
      return {
        predictedRevenue: 0,
        predictedExpense: 0,
        revenueGrowthPercent: 0,
        expenseGrowthPercent: 0,
        trend: 'stable' as const,
        confidence: 0
      };
    }

    const revenues = chartData.map(d => d.revenue);
    const expenses = chartData.map(d => d.expense);

    const revenueRegression = linearRegression(revenues);
    const expenseRegression = linearRegression(expenses);

    // Predict next month (index = chartData.length)
    const nextIndex = chartData.length;
    const predictedRevenue = Math.max(0, revenueRegression.slope * nextIndex + revenueRegression.intercept);
    const predictedExpense = Math.max(0, expenseRegression.slope * nextIndex + expenseRegression.intercept);

    // Calculate growth compared to current month
    const currentRevenue = revenues[revenues.length - 1] || 0;
    const currentExpense = expenses[expenses.length - 1] || 0;

    const revenueGrowthPercent = currentRevenue > 0 
      ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100 
      : 0;
    const expenseGrowthPercent = currentExpense > 0 
      ? ((predictedExpense - currentExpense) / currentExpense) * 100 
      : 0;

    // Determine trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (revenueGrowthPercent > 5) trend = 'up';
    else if (revenueGrowthPercent < -5) trend = 'down';

    // Confidence based on R² (goodness of fit)
    const confidence = Math.round(Math.abs(revenueRegression.r2) * 100);

    return {
      predictedRevenue: Math.round(predictedRevenue),
      predictedExpense: Math.round(predictedExpense),
      revenueGrowthPercent: Math.round(revenueGrowthPercent * 10) / 10,
      expenseGrowthPercent: Math.round(expenseGrowthPercent * 10) / 10,
      trend,
      confidence
    };
  }, [chartData]);
};
