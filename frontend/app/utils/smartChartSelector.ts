/**
 * Smart Chart Type Selection
 * Intelligently chooses the best chart type based on data characteristics and question context
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'histogram' | 'horizontalBar';

interface DataPoint {
  name?: string;
  label?: string;
  value: number;
  [key: string]: any;
}

interface ChartRecommendation {
  type: ChartType;
  reason: string;
  confidence: number;
}

/**
 * Analyze data and question to recommend the best chart type
 */
export function selectChartType(
  data: DataPoint[],
  question?: string,
  context?: string
): ChartRecommendation {
  const questionLower = (question || '').toLowerCase();
  const contextLower = (context || '').toLowerCase();
  const combinedText = questionLower + ' ' + contextLower;

  // Extract characteristics from data
  const hasTimeData = detectTimeSeriesData(data);
  const hasPercentages = detectPercentageData(data);
  const isDistribution = detectDistributionPattern(data);
  const dataCount = data.length;
  const hasCategories = data.every(d => d.name || d.label);

  // Time series detection - LINE CHART
  if (hasTimeData ||
      questionLower.includes('trend') ||
      questionLower.includes('over time') ||
      questionLower.includes('growth') ||
      questionLower.includes('change') ||
      questionLower.includes('trajectory') ||
      questionLower.includes('progression')) {
    return {
      type: 'line',
      reason: 'Time series or trend data detected',
      confidence: 0.9
    };
  }

  // Composition/Distribution detection - PIE CHART
  if (hasPercentages ||
      questionLower.includes('breakdown') ||
      questionLower.includes('distribution') ||
      questionLower.includes('composition') ||
      questionLower.includes('percentage') ||
      questionLower.includes('share of') ||
      questionLower.includes('proportion') ||
      questionLower.includes('split') ||
      (dataCount <= 7 && questionLower.includes('by category'))) {
    return {
      type: 'pie',
      reason: 'Composition or percentage distribution detected',
      confidence: 0.85
    };
  }

  // Frequency distribution - HISTOGRAM
  if (isDistribution ||
      questionLower.includes('frequency') ||
      questionLower.includes('distribution of') ||
      questionLower.includes('range') ||
      questionLower.includes('histogram') ||
      detectNumericRanges(data)) {
    return {
      type: 'histogram',
      reason: 'Frequency distribution or range data detected',
      confidence: 0.8
    };
  }

  // Horizontal bar for long labels or rankings
  if (dataCount > 10 ||
      questionLower.includes('top ') ||
      questionLower.includes('bottom ') ||
      questionLower.includes('ranking') ||
      questionLower.includes('most') ||
      questionLower.includes('least') ||
      hasLongLabels(data)) {
    return {
      type: 'horizontalBar',
      reason: 'Many items or ranking comparison',
      confidence: 0.75
    };
  }

  // Simple comparison - BAR CHART (default)
  if (hasCategories && dataCount <= 15) {
    return {
      type: 'bar',
      reason: 'Categorical comparison with moderate number of items',
      confidence: 0.7
    };
  }

  // Default fallback
  return {
    type: 'bar',
    reason: 'Default chart type for general data',
    confidence: 0.5
  };
}

/**
 * Detect if data represents time series
 */
function detectTimeSeriesData(data: DataPoint[]): boolean {
  if (data.length < 2) return false;

  const labels = data.map(d => (d.name || d.label || '').toLowerCase());

  // Check for time-related keywords
  const timeKeywords = [
    'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
    'q1', 'q2', 'q3', 'q4', 'quarter',
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    '2020', '2021', '2022', '2023', '2024', '2025',
    'week', 'month', 'year', 'day'
  ];

  const timeMatches = labels.filter(label =>
    timeKeywords.some(keyword => label.includes(keyword))
  ).length;

  return timeMatches / labels.length > 0.5;
}

/**
 * Detect if data contains percentages or totals to 100
 */
function detectPercentageData(data: DataPoint[]): boolean {
  const values = data.map(d => d.value);
  const sum = values.reduce((a, b) => a + b, 0);

  // Check if values sum to approximately 100 (allowing for rounding)
  if (Math.abs(sum - 100) < 1) return true;

  // Check if all values are between 0 and 100
  return values.every(v => v >= 0 && v <= 100) && data.length <= 10;
}

/**
 * Detect if data represents a frequency distribution
 */
function detectDistributionPattern(data: DataPoint[]): boolean {
  if (data.length < 5) return false;

  const labels = data.map(d => d.name || d.label || '');

  // Check for range patterns like "0-10", "10-20", etc.
  const rangePattern = /\d+\s*-\s*\d+/;
  const rangeMatches = labels.filter(label => rangePattern.test(label)).length;

  if (rangeMatches / labels.length > 0.7) return true;

  // Check for numeric incremental pattern
  const numericLabels = labels.map(l => parseFloat(l)).filter(n => !isNaN(n));
  if (numericLabels.length === labels.length) {
    const diffs = numericLabels.slice(1).map((n, i) => n - numericLabels[i]);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const consistent = diffs.every(d => Math.abs(d - avgDiff) < avgDiff * 0.2);
    return consistent;
  }

  return false;
}

/**
 * Detect if data has numeric range labels
 */
function detectNumericRanges(data: DataPoint[]): boolean {
  const labels = data.map(d => d.name || d.label || '');
  const rangePattern = /\d+\s*-\s*\d+/;
  return labels.filter(label => rangePattern.test(label)).length >= 3;
}

/**
 * Check if labels are long (would benefit from horizontal orientation)
 */
function hasLongLabels(data: DataPoint[]): boolean {
  const labels = data.map(d => d.name || d.label || '');
  const avgLength = labels.reduce((sum, l) => sum + l.length, 0) / labels.length;
  return avgLength > 15;
}

/**
 * Generate Chart.js configuration for the selected chart type
 */
export function generateChartConfig(
  type: ChartType,
  data: DataPoint[],
  colors: string[] = ['#3b82f6', '#38bdf8', '#f87171', '#fbbf24', '#34d399', '#a855f7']
): any {
  const labels = data.map(d => d.name || d.label || 'Unknown');
  const values = data.map(d => d.value);

  const baseConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: type === 'pie',
        labels: { color: '#e6edf3', font: { size: 12 } }
      },
      tooltip: {
        backgroundColor: '#161b22',
        titleColor: '#3b82f6',
        bodyColor: '#e6edf3',
        borderColor: '#30363d',
        borderWidth: 1,
        padding: 12,
        displayColors: type !== 'pie'
      }
    }
  };

  switch (type) {
    case 'line':
      return {
        type: 'line',
        data: {
          labels,
          datasets: [{
            data: values,
            borderColor: colors[0],
            backgroundColor: `${colors[0]}33`,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: colors[0],
            pointBorderColor: '#161b22',
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3
          }]
        },
        options: {
          ...baseConfig,
          scales: {
            y: {
              grid: { color: '#30363d', drawBorder: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            }
          }
        }
      };

    case 'pie':
      return {
        type: 'pie',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors.slice(0, data.length),
            borderColor: '#0d1117',
            borderWidth: 2,
            hoverOffset: 8
          }]
        },
        options: {
          ...baseConfig,
          plugins: {
            ...baseConfig.plugins,
            legend: {
              display: true,
              position: 'right',
              labels: {
                color: '#e6edf3',
                font: { size: 12 },
                padding: 15,
                usePointStyle: true
              }
            }
          }
        }
      };

    case 'histogram':
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors[0],
            borderColor: colors[1],
            borderWidth: 1,
            borderRadius: 0
          }]
        },
        options: {
          ...baseConfig,
          scales: {
            y: {
              title: { display: true, text: 'Frequency', color: '#8b949e' },
              grid: { color: '#30363d', drawBorder: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            },
            x: {
              title: { display: true, text: 'Range', color: '#8b949e' },
              grid: { display: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            }
          }
        }
      };

    case 'horizontalBar':
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors[0],
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          ...baseConfig,
          indexAxis: 'y',
          scales: {
            x: {
              grid: { color: '#30363d', drawBorder: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            },
            y: {
              grid: { display: false },
              ticks: {
                color: '#8b949e',
                font: { size: 11 },
                autoSkip: false
              }
            }
          }
        }
      };

    case 'bar':
    default:
      return {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor: colors[0],
            borderRadius: 6,
            hoverBackgroundColor: colors[1]
          }]
        },
        options: {
          ...baseConfig,
          scales: {
            y: {
              grid: { color: '#30363d', drawBorder: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            },
            x: {
              grid: { display: false },
              ticks: { color: '#8b949e', font: { size: 11 } }
            }
          }
        }
      };
  }
}
