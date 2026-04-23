/**
 * Enhanced Chart HTML Generator with Smart Chart Selection
 * Generates Chart.js HTML with intelligent chart type selection
 */

import { selectChartType, type ChartType } from './smartChartSelector';

interface DataPoint {
  name?: string;
  label?: string;
  value: number;
}

const COLORS = ['#bfff00', '#00d9ff', '#ff5757', '#ff9500', '#10e37d', '#a855f7'];

/**
 * Generate smart chart HTML with automatic chart type selection
 */
export function generateSmartChartHTML(
  data: DataPoint[],
  question: string,
  context?: string
): string {
  const chartRecommendation = selectChartType(data, question, context);
  const chartType = chartRecommendation.type;

  console.log(`📊 Smart Chart Selection: ${chartType} (${chartRecommendation.reason})`);

  const chartDataJson = JSON.stringify(data);
  const labels = data.map(d => d.name || d.label || 'Unknown');
  const values = data.map(d => d.value);

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>${question}</title>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
  <script src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0a0d12;
      color: #e8ecf1;
      font-family: 'Inter', sans-serif;
      padding: 24px;
      display: flex;
      flex-direction: column;
      height: 100vh;
    }
    .header {
      font-size: 24px;
      font-weight: 700;
      color: #bfff00;
      margin-bottom: 8px;
    }
    .chart-type-badge {
      display: inline-block;
      padding: 4px 12px;
      background: #141b26;
      border: 1px solid #2d3748;
      border-radius: 6px;
      font-size: 11px;
      color: #8b92a1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 16px;
    }
    .card {
      background: #141b26;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #2d3748;
      flex: 1;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 24px rgba(0,0,0,.4);
    }
    .chart-wrap {
      position: relative;
      flex: 1;
      min-height: 400px;
    }
    .insight {
      margin-top: 16px;
      padding: 12px;
      background: #0a0d12;
      border-left: 3px solid #bfff00;
      border-radius: 4px;
      font-size: 13px;
      color: #8b92a1;
    }
    .insight strong {
      color: #bfff00;
    }
  </style>
</head>
<body>
  <div class='header'>${question}</div>
  <div class='chart-type-badge'>📊 ${getChartTypeLabel(chartType)} · AI-Selected</div>

  <div class='card'>
    <div class='chart-wrap'>
      <canvas id='mainChart'></canvas>
    </div>
    <div class='insight'>
      <strong>Why this chart?</strong> ${chartRecommendation.reason}
    </div>
  </div>

  <script>
    const data = ${chartDataJson};
    const labels = ${JSON.stringify(labels)};
    const values = ${JSON.stringify(values)};
    const colors = ${JSON.stringify(COLORS)};

    ${generateChartJSCode(chartType, labels, values, COLORS)}
  </script>
</body>
</html>`;
}

/**
 * Get human-readable chart type label
 */
function getChartTypeLabel(type: ChartType): string {
  const labels: Record<ChartType, string> = {
    'bar': 'Bar Chart',
    'line': 'Line Chart',
    'pie': 'Pie Chart',
    'histogram': 'Histogram',
    'horizontalBar': 'Horizontal Bar Chart'
  };
  return labels[type] || 'Chart';
}

/**
 * Generate Chart.js initialization code for specific chart type
 */
function generateChartJSCode(
  type: ChartType,
  labels: string[],
  values: number[],
  colors: string[]
): string {
  const baseOptions = `
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: ${type === 'pie' ? 'true' : 'false'},
        position: ${type === 'pie' ? "'right'" : "'top'"},
        labels: {
          color: '#e8ecf1',
          font: { size: 12 },
          padding: 15,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: '#141b26',
        titleColor: '#bfff00',
        bodyColor: '#e8ecf1',
        borderColor: '#2d3748',
        borderWidth: 1,
        padding: 12,
        displayColors: ${type !== 'pie'},
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            const value = context.parsed.y !== undefined ? context.parsed.y : context.parsed;
            label += value.toLocaleString();
            return label;
          }
        }
      }
    }
  `;

  switch (type) {
    case 'line':
      return `
        new Chart(document.getElementById('mainChart'), {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Value',
              data: values,
              borderColor: colors[0],
              backgroundColor: colors[0] + '33',
              tension: 0.4,
              fill: true,
              pointBackgroundColor: colors[0],
              pointBorderColor: '#141b26',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              borderWidth: 3
            }]
          },
          options: {
            ${baseOptions},
            scales: {
              y: {
                grid: { color: '#2d3748', drawBorder: false },
                ticks: {
                  color: '#8b92a1',
                  font: { size: 11 },
                  callback: function(value) {
                    return value.toLocaleString();
                  }
                }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#8b92a1', font: { size: 11 } }
              }
            }
          }
        });
      `;

    case 'pie':
      return `
        new Chart(document.getElementById('mainChart'), {
          type: 'pie',
          data: {
            labels: labels,
            datasets: [{
              data: values,
              backgroundColor: colors.slice(0, values.length),
              borderColor: '#0a0d12',
              borderWidth: 2,
              hoverOffset: 10,
              hoverBorderWidth: 3
            }]
          },
          options: {
            ${baseOptions},
            plugins: {
              legend: {
                display: true,
                position: 'right',
                labels: {
                  color: '#e8ecf1',
                  font: { size: 12 },
                  padding: 15,
                  usePointStyle: true,
                  generateLabels: function(chart) {
                    const data = chart.data;
                    const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                    return data.labels.map((label, i) => {
                      const value = data.datasets[0].data[i];
                      const percentage = ((value / total) * 100).toFixed(1);
                      return {
                        text: label + ' (' + percentage + '%)',
                        fillStyle: data.datasets[0].backgroundColor[i],
                        hidden: false,
                        index: i
                      };
                    });
                  }
                }
              },
              tooltip: {
                backgroundColor: '#141b26',
                titleColor: '#bfff00',
                bodyColor: '#e8ecf1',
                borderColor: '#2d3748',
                borderWidth: 1,
                padding: 12,
                callbacks: {
                  label: function(context) {
                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                    const value = context.parsed;
                    const percentage = ((value / total) * 100).toFixed(1);
                    return context.label + ': ' + value.toLocaleString() + ' (' + percentage + '%)';
                  }
                }
              }
            }
          }
        });
      `;

    case 'histogram':
      return `
        new Chart(document.getElementById('mainChart'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Frequency',
              data: values,
              backgroundColor: colors[0],
              borderColor: colors[1],
              borderWidth: 1,
              borderRadius: 0
            }]
          },
          options: {
            ${baseOptions},
            scales: {
              y: {
                title: {
                  display: true,
                  text: 'Frequency',
                  color: '#8b92a1',
                  font: { size: 12, weight: 600 }
                },
                grid: { color: '#2d3748', drawBorder: false },
                ticks: { color: '#8b92a1', font: { size: 11 } }
              },
              x: {
                title: {
                  display: true,
                  text: 'Range',
                  color: '#8b92a1',
                  font: { size: 12, weight: 600 }
                },
                grid: { display: false },
                ticks: { color: '#8b92a1', font: { size: 11 } }
              }
            }
          }
        });
      `;

    case 'horizontalBar':
      return `
        new Chart(document.getElementById('mainChart'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Value',
              data: values,
              backgroundColor: colors[0],
              borderRadius: 6,
              borderSkipped: false,
              hoverBackgroundColor: colors[1]
            }]
          },
          options: {
            ${baseOptions},
            indexAxis: 'y',
            scales: {
              x: {
                grid: { color: '#2d3748', drawBorder: false },
                ticks: {
                  color: '#8b92a1',
                  font: { size: 11 },
                  callback: function(value) {
                    return value.toLocaleString();
                  }
                }
              },
              y: {
                grid: { display: false },
                ticks: {
                  color: '#8b92a1',
                  font: { size: 11 },
                  autoSkip: false
                }
              }
            }
          }
        });
      `;

    case 'bar':
    default:
      return `
        new Chart(document.getElementById('mainChart'), {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Value',
              data: values,
              backgroundColor: colors[0],
              borderRadius: 6,
              hoverBackgroundColor: colors[1],
              borderSkipped: false
            }]
          },
          options: {
            ${baseOptions},
            scales: {
              y: {
                grid: { color: '#2d3748', drawBorder: false },
                ticks: {
                  color: '#8b92a1',
                  font: { size: 11 },
                  callback: function(value) {
                    return value.toLocaleString();
                  }
                }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#8b92a1', font: { size: 11 } }
              }
            }
          }
        });
      `;
  }
}
