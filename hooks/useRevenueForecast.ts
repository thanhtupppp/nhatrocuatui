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
  analysis?: {
    phase: 'growth' | 'stable' | 'decline' | 'volatile' | 'risk';
    quality: 'healthy' | 'warning' | 'critical';
    volatility: number;
    explanation: string;
  };
}

/**
 * Advanced Forecast Logic:
 * Combines Linear Regression (Trend) with Weighted Moving Average (Recent Bias).
 * This provides stability from trends but responsiveness to recent changes.
 */

// Simple Linear Regression (Trend)
const linearRegression = (values: number[]) => {
  const n = values.length;
  if (n < 2) return { slope: 0, intercept: values[0] || 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Calculate R² (goodness of fit)
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

// Weighted Moving Average (Recent Bias)
const weightedAverage = (values: number[]) => {
  const n = values.length;
  if (n === 0) return 0;
  if (n === 1) return values[0];

  let totalWeight = 0;
  let weightedSum = 0;

  // Weights: Give more weight to recent months (e.g., last month 3x, month before 2x)
  for (let i = 0; i < n; i++) {
    const weight = i + 1; // 1, 2, 3...
    weightedSum += values[i] * weight;
    totalWeight += weight;
  }

  return weightedSum / totalWeight;
};

// Calculate volatility (Standard Deviation / Mean)
const calculateVolatility = (values: number[]) => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean; // Coefficient of Variation
};

export const useRevenueForecast = (chartData: ChartDataPoint[]): ForecastResult => {
  return useMemo(() => {
    // 1. Validating Data
    if (!chartData || chartData.length === 0) {
      return { predictedRevenue: 0, predictedExpense: 0, revenueGrowthPercent: 0, expenseGrowthPercent: 0, trend: 'stable', confidence: 0 };
    }

    const revenues = chartData.map(d => d.revenue);
    const expenses = chartData.map(d => d.expense);
    const n = revenues.length;

    // 2. Short-term Prediction (Weighted Average) - Good for stable/recent patterns
    const wRevenue = weightedAverage(revenues);
    const wExpense = weightedAverage(expenses);

    // 3. Long-term Trend (Linear Regression) - Good for growth trends
    const regRevenue = linearRegression(revenues);
    const regExpense = linearRegression(expenses);
    
    const nextIndex = n;
    const trendRevenue = Math.max(0, regRevenue.slope * nextIndex + regRevenue.intercept);
    const trendExpense = Math.max(0, regExpense.slope * nextIndex + regExpense.intercept);

    // 4. Hybrid Prediction (Combine both approaches)
    // If we have few data points (<3), rely 100% on Weighted Average (Regression is unreliable)
    // If we have more data, mix 40% Trend + 60% Weighted Avg
    const trendWeight = n >= 4 ? 0.4 : (n >= 2 ? 0.2 : 0);
    const avgWeight = 1 - trendWeight;

    const predictedRevenue = Math.round(trendRevenue * trendWeight + wRevenue * avgWeight);
    const predictedExpense = Math.round(trendExpense * trendWeight + wExpense * avgWeight);

    // 5. Calculate Growth vs Current Month
    const currentRevenue = revenues[n - 1] || 0;
    const currentExpense = expenses[n - 1] || 0;

    const revenueGrowthPercent = currentRevenue > 0 
      ? ((predictedRevenue - currentRevenue) / currentRevenue) * 100 
      : 0;
    const expenseGrowthPercent = currentExpense > 0 
      ? ((predictedExpense - currentExpense) / currentExpense) * 100 
      : 0;

    // 6. Determine Trend
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (revenueGrowthPercent > 1) trend = 'up';
    else if (revenueGrowthPercent < -1) trend = 'down';

    // 7. Smart Confidence Score Calculation
    // Base confidence starts low, increases with more data points
    let baseConfidence = Math.min(n * 15, 60); // Max 60% from sample size alone (need 4 months)

    // Penalize high volatility
    const volatility = calculateVolatility(revenues);
    const volatilityPenalty = Math.min(volatility * 100, 40); // Max 40% penalty

    // Bonus for good R² fit (if regression used)
    const r2Bonus = n >= 3 ? Math.max(0, regRevenue.r2 * 30) : 0; // Max 30% bonus

    // Consistency bonus: If Trend and Weighted Avg are close (<10% diff)
    const diffPercent = wRevenue > 0 ? Math.abs(trendRevenue - wRevenue) / wRevenue : 0;
    const consistencyBonus = diffPercent < 0.1 ? 20 : (diffPercent < 0.2 ? 10 : 0);

    let confidence = baseConfidence - volatilityPenalty + r2Bonus + consistencyBonus;
    
    // Clamp between 10 and 95
    confidence = Math.max(10, Math.min(95, Math.round(confidence)));

    return {
      predictedRevenue,
      predictedExpense,
      revenueGrowthPercent: Math.round(revenueGrowthPercent * 10) / 10,
      expenseGrowthPercent: Math.round(expenseGrowthPercent * 10) / 10,
      trend,
      confidence,
      // Enhanced Financial Insights
      analysis: {
        phase: determinePhase(),
        quality: determineQuality(),
        volatility: Math.round(volatility * 100),
        explanation: determineExplanation()
      }
    };

    // Helper functions for analysis
    function determinePhase(): 'growth' | 'stable' | 'decline' | 'volatile' | 'risk' {
      if (currentRevenue === 0 && n > 1) return 'risk'; // Shock detection
      if (volatility > 0.2) return 'volatile';
      if (revenueGrowthPercent > 5 && trend === 'up') return 'growth';
      if (revenueGrowthPercent < -5 && trend === 'down') return 'decline';
      return 'stable';
    }

    function determineQuality(): 'healthy' | 'warning' | 'critical' {
      // Quality of Growth: Revenue grows but Expense grows faster?
      if (revenueGrowthPercent > 0 && expenseGrowthPercent > revenueGrowthPercent * 1.5) return 'warning';
      if (currentRevenue > 0 && currentExpense > currentRevenue) return 'critical'; // Running at loss
      return 'healthy';
    }

    function determineExplanation(): string {
       if (n < 2) return 'Chưa đủ dữ liệu lịch sử để phân tích xu hướng.';
       if (volatility > 0.2) return 'Dữ liệu biến động mạnh, dự báo có độ rủi ro cao.';
       if (trend === 'up' && revenueGrowthPercent > 5) return 'Xu hướng tăng trưởng tích cực dựa trên đà tăng gần đây.';
       if (trend === 'down') return 'Cảnh báo xu hướng giảm nhẹ trong các tháng gần đây.';
       return 'Hoạt động kinh doanh ổn định, không có biến động lớn.';
    }

  }, [chartData]);
};
