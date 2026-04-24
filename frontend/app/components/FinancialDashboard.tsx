/**
 * Financial Dashboard - Auto-generated KPI dashboard
 * Theme-aware via ArtifactPanel
 */
"use client";

import ArtifactPanel from "./ArtifactPanel";
import { useTheme } from "../lib/ThemeContext";
import { AegisColors } from "../styles/colors";

interface KPIMetric {
  value: number;
  status: 'healthy' | 'warning' | 'critical';
}

interface Anomaly {
  type: string;
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  details: any;
}

interface ChartData {
  spendByCategory: Array<{ name: string; value: number }>;
  mrrTrend: Array<{ name: string; value: number }>;
}

interface FinancialDashboardProps {
  kpis: {
    cashRunway: KPIMetric;
    monthlyBurn: KPIMetric;
    mrr: KPIMetric;
    churnRate: KPIMetric;
    headcountCost: KPIMetric;
    budgetVariance: KPIMetric;
  };
  anomalies: Anomaly[];
  chartData: ChartData;
}

export default function FinancialDashboard({ kpis, anomalies, chartData }: FinancialDashboardProps) {
  const { theme } = useTheme();
  const c = AegisColors[theme];
  const html = generateDashboardHTML(kpis, anomalies, chartData, c);

  return (
    <div className="w-full h-full">
      <ArtifactPanel html={html} />
    </div>
  );
}

type ThemeColors = typeof AegisColors.dark;

function generateDashboardHTML(
  kpis: FinancialDashboardProps['kpis'],
  anomalies: Anomaly[],
  chartData: ChartData,
  c: ThemeColors
): string {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const formatNumber = (val: number) => {
    return val.toFixed(1);
  };

  const spendChartData = JSON.stringify(chartData.spendByCategory);

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <title>Financial Dashboard</title>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
  <script src='https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: ${c.background.app};
      color: ${c.text.primary};
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px;
      overflow-y: auto;
      height: 100vh;
    }
    .header {
      font-size: 28px;
      font-weight: 700;
      color: ${c.accent.primary};
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 20px;
      border: 2px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,.1);
    }
    .kpi-card.healthy { border-color: ${c.status.healthy}; }
    .kpi-card.warning { border-color: ${c.status.warning}; }
    .kpi-card.critical { border-color: ${c.status.critical}; }
    .kpi-label {
      font-size: 12px;
      color: ${c.text.secondary};
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 36px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .kpi-card.healthy .kpi-value { color: ${c.status.healthy}; }
    .kpi-card.warning .kpi-value { color: ${c.status.warning}; }
    .kpi-card.critical .kpi-value { color: ${c.status.critical}; }
    .kpi-desc {
      font-size: 11px;
      color: ${c.text.secondary};
      line-height: 1.4;
    }
    .chart-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 20px;
      min-height: 300px;
    }
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: ${c.accent.primary};
      margin-bottom: 16px;
    }
    .chart-wrap {
      position: relative;
      height: 250px;
    }
    .audit-panel {
      background: ${c.background.card};
      border-radius: 12px;
      padding: 20px;
      border: 2px solid ${c.status.critical};
      max-height: 400px;
      overflow-y: auto;
    }
    .audit-header {
      font-size: 18px;
      font-weight: 700;
      color: ${c.status.critical};
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .anomaly-item {
      background: color-mix(in srgb, ${c.status.critical} 8%, transparent);
      border-left: 4px solid ${c.status.critical};
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 6px;
    }
    .anomaly-item.warning {
      background: color-mix(in srgb, ${c.status.warning} 8%, transparent);
      border-left-color: ${c.status.warning};
    }
    .anomaly-title {
      font-size: 14px;
      font-weight: 600;
      color: ${c.status.critical};
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .anomaly-item.warning .anomaly-title {
      color: ${c.status.warning};
    }
    .anomaly-desc {
      font-size: 13px;
      color: ${c.text.primary};
      line-height: 1.4;
    }
    .severity-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: .05em;
    }
    .severity-badge.critical {
      background: ${c.status.critical};
      color: white;
    }
    .severity-badge.warning {
      background: ${c.status.warning};
      color: ${c.background.app};
    }
  </style>
</head>
<body>
  <div class='header'>
    <span>Financial Dashboard</span>
  </div>

  <div class='kpi-grid'>
    <div class='kpi-card ${kpis.cashRunway.status}'>
      <div class='kpi-label'>Cash Runway</div>
      <div class='kpi-value'>${formatNumber(kpis.cashRunway.value)} mo</div>
      <div class='kpi-desc'>${
        kpis.cashRunway.value > 12 ? 'Healthy runway' :
        kpis.cashRunway.value > 6 ? 'Monitor closely' :
        'Critical - action needed'
      }</div>
    </div>

    <div class='kpi-card ${kpis.monthlyBurn.status}'>
      <div class='kpi-label'>Monthly Burn Rate</div>
      <div class='kpi-value'>${formatCurrency(kpis.monthlyBurn.value)}</div>
      <div class='kpi-desc'>Average monthly outflows</div>
    </div>

    <div class='kpi-card ${kpis.mrr.status}'>
      <div class='kpi-label'>Monthly Recurring Revenue</div>
      <div class='kpi-value'>${formatCurrency(kpis.mrr.value)}</div>
      <div class='kpi-desc'>From active subscriptions</div>
    </div>

    <div class='kpi-card ${kpis.churnRate.status}'>
      <div class='kpi-label'>Churn Rate</div>
      <div class='kpi-value'>${formatNumber(kpis.churnRate.value)}%</div>
      <div class='kpi-desc'>${
        kpis.churnRate.value < 5 ? 'Excellent retention' :
        kpis.churnRate.value < 15 ? 'Needs improvement' :
        'Critical churn issue'
      }</div>
    </div>

    <div class='kpi-card ${kpis.headcountCost.status}'>
      <div class='kpi-label'>Total Headcount Cost</div>
      <div class='kpi-value'>${formatCurrency(kpis.headcountCost.value)}</div>
      <div class='kpi-desc'>Active employee salaries</div>
    </div>

    <div class='kpi-card ${kpis.budgetVariance.status}'>
      <div class='kpi-label'>Budget Variance</div>
      <div class='kpi-value'>${kpis.budgetVariance.value >= 0 ? '+' : ''}${formatCurrency(kpis.budgetVariance.value)}</div>
      <div class='kpi-desc'>${
        kpis.budgetVariance.value < 0 ? 'Under budget' :
        kpis.budgetVariance.value < 50000 ? 'Slight overrun' :
        'Major overrun'
      }</div>
    </div>
  </div>

  <div class='chart-grid'>
    <div class='chart-card'>
      <div class='chart-title'>Spend by Category</div>
      <div class='chart-wrap'>
        <canvas id='spendChart'></canvas>
      </div>
    </div>

    <div class='chart-card'>
      <div class='chart-title'>Revenue Metrics</div>
      <div class='chart-wrap'>
        <canvas id='mrrChart'></canvas>
      </div>
    </div>
  </div>

  <div class='audit-panel'>
    <div class='audit-header'>
      <span>FORENSIC AUDIT ALERTS</span>
      <span style='margin-left: auto; font-size: 14px; color: ${c.text.secondary};'>${anomalies.length} anomalies detected</span>
    </div>

    ${anomalies.length === 0 ? `
      <div style='color: ${c.status.healthy}; text-align: center; padding: 20px;'>
        No anomalies detected - all metrics look healthy
      </div>
    ` : anomalies.map(anomaly => `
      <div class='anomaly-item ${anomaly.severity}'>
        <div class='anomaly-title'>
          <span class='severity-badge ${anomaly.severity}'>${anomaly.severity}</span>
          <span>${anomaly.title}</span>
        </div>
        <div class='anomaly-desc'>${anomaly.description}</div>
      </div>
    `).join('')}
  </div>

  <script>
    const spendData = ${spendChartData};
    new Chart(document.getElementById('spendChart'), {
      type: 'bar',
      data: {
        labels: spendData.map(x => x.name),
        datasets: [{
          data: spendData.map(x => x.value),
          backgroundColor: '${c.accent.primary}',
          borderRadius: 6,
          hoverBackgroundColor: '${c.accent.primaryHover}'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '${c.background.card}',
            titleColor: '${c.accent.primary}',
            bodyColor: '${c.text.primary}',
            borderColor: '${c.border.subtle}',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
                return '$' + val.toFixed(0);
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: '${c.border.subtle}' },
            ticks: {
              color: '${c.text.secondary}',
              callback: (v) => {
                if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
                return '$' + v;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '${c.text.secondary}' }
          }
        }
      }
    });

    new Chart(document.getElementById('mrrChart'), {
      type: 'bar',
      data: {
        labels: ['Current MRR'],
        datasets: [{
          data: [${kpis.mrr.value}],
          backgroundColor: '${kpis.mrr.status === "healthy" ? c.status.healthy : kpis.mrr.status === "warning" ? c.status.warning : c.status.critical}',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '${c.background.card}',
            titleColor: '${c.accent.primary}',
            bodyColor: '${c.text.primary}',
            borderColor: '${c.border.subtle}',
            borderWidth: 1,
            callbacks: {
              label: (ctx) => {
                const val = ctx.parsed.y;
                if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
                return '$' + val.toFixed(0);
              }
            }
          }
        },
        scales: {
          y: {
            grid: { color: '${c.border.subtle}' },
            ticks: {
              color: '${c.text.secondary}',
              callback: (v) => {
                if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
                return '$' + v;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '${c.text.secondary}' }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}
