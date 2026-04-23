/**
 * Financial Dashboard - Auto-generated KPI dashboard
 * Military Intelligence Theme
 */
"use client";

import { useEffect, useRef } from "react";

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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current) {
      const html = generateDashboardHTML(kpis, anomalies, chartData);
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(html);
        doc.close();
      }
    }
  }, [kpis, anomalies, chartData]);

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0"
      title="Financial Dashboard"
    />
  );
}

function generateDashboardHTML(
  kpis: FinancialDashboardProps['kpis'],
  anomalies: Anomaly[],
  chartData: ChartData
): string {
  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  const formatNumber = (val: number) => {
    return val.toFixed(1);
  };

  const getStatusColor = (status: string) => {
    if (status === 'healthy') return '#10e37d';  // Emerald green
    if (status === 'warning') return '#ff9500';  // Amber orange
    return '#ff5757';  // Coral red
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
      background: #0a0d12;
      color: #e8ecf1;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 24px;
      overflow-y: auto;
      height: 100vh;
    }
    .header {
      font-size: 28px;
      font-weight: 700;
      color: #bfff00;
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
      background: #141b26;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid transparent;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0,0,0,.4);
    }
    .kpi-card.healthy { border-color: #10e37d; }
    .kpi-card.warning { border-color: #ff9500; }
    .kpi-card.critical { border-color: #ff5757; }
    .kpi-label {
      font-size: 12px;
      color: #8b92a1;
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
    .kpi-card.healthy .kpi-value { color: #10e37d; }
    .kpi-card.warning .kpi-value { color: #ff9500; }
    .kpi-card.critical .kpi-value { color: #ff5757; }
    .kpi-desc {
      font-size: 11px;
      color: #8b92a1;
      line-height: 1.4;
    }
    .chart-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 24px;
    }
    .chart-card {
      background: #141b26;
      border-radius: 12px;
      padding: 20px;
      min-height: 300px;
    }
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: #bfff00;
      margin-bottom: 16px;
    }
    .chart-wrap {
      position: relative;
      height: 250px;
    }
    .audit-panel {
      background: #141b26;
      border-radius: 12px;
      padding: 20px;
      border: 2px solid #ff5757;
      max-height: 400px;
      overflow-y: auto;
    }
    .audit-header {
      font-size: 18px;
      font-weight: 700;
      color: #ff5757;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .anomaly-item {
      background: rgba(255, 68, 68, 0.1);
      border-left: 4px solid #ff5757;
      padding: 12px;
      margin-bottom: 12px;
      border-radius: 6px;
    }
    .anomaly-item.warning {
      background: rgba(255, 170, 0, 0.1);
      border-left-color: #ff9500;
    }
    .anomaly-title {
      font-size: 14px;
      font-weight: 600;
      color: #ff5757;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .anomaly-item.warning .anomaly-title {
      color: #ff9500;
    }
    .anomaly-desc {
      font-size: 13px;
      color: #e8ecf1;
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
      background: #ff5757;
      color: white;
    }
    .severity-badge.warning {
      background: #ff9500;
      color: #0a0d12;
    }
  </style>
</head>
<body>
  <div class='header'>
    <span>📊</span>
    <span>Financial Dashboard</span>
  </div>

  <!-- KPI Cards -->
  <div class='kpi-grid'>
    <div class='kpi-card ${kpis.cashRunway.status}'>
      <div class='kpi-label'>💰 Cash Runway</div>
      <div class='kpi-value'>${formatNumber(kpis.cashRunway.value)} mo</div>
      <div class='kpi-desc'>${
        kpis.cashRunway.value > 12 ? 'Healthy runway' :
        kpis.cashRunway.value > 6 ? 'Monitor closely' :
        'Critical - action needed'
      }</div>
    </div>

    <div class='kpi-card ${kpis.monthlyBurn.status}'>
      <div class='kpi-label'>🔥 Monthly Burn Rate</div>
      <div class='kpi-value'>${formatCurrency(kpis.monthlyBurn.value)}</div>
      <div class='kpi-desc'>Average monthly outflows</div>
    </div>

    <div class='kpi-card ${kpis.mrr.status}'>
      <div class='kpi-label'>📈 Monthly Recurring Revenue</div>
      <div class='kpi-value'>${formatCurrency(kpis.mrr.value)}</div>
      <div class='kpi-desc'>From active subscriptions</div>
    </div>

    <div class='kpi-card ${kpis.churnRate.status}'>
      <div class='kpi-label'>📉 Churn Rate</div>
      <div class='kpi-value'>${formatNumber(kpis.churnRate.value)}%</div>
      <div class='kpi-desc'>${
        kpis.churnRate.value < 5 ? 'Excellent retention' :
        kpis.churnRate.value < 15 ? 'Needs improvement' :
        'Critical churn issue'
      }</div>
    </div>

    <div class='kpi-card ${kpis.headcountCost.status}'>
      <div class='kpi-label'>👥 Total Headcount Cost</div>
      <div class='kpi-value'>${formatCurrency(kpis.headcountCost.value)}</div>
      <div class='kpi-desc'>Active employee salaries</div>
    </div>

    <div class='kpi-card ${kpis.budgetVariance.status}'>
      <div class='kpi-label'>⚠️ Budget Variance</div>
      <div class='kpi-value'>${kpis.budgetVariance.value >= 0 ? '+' : ''}${formatCurrency(kpis.budgetVariance.value)}</div>
      <div class='kpi-desc'>${
        kpis.budgetVariance.value < 0 ? 'Under budget' :
        kpis.budgetVariance.value < 50000 ? 'Slight overrun' :
        'Major overrun'
      }</div>
    </div>
  </div>

  <!-- Charts -->
  <div class='chart-grid'>
    <div class='chart-card'>
      <div class='chart-title'>💸 Spend by Category</div>
      <div class='chart-wrap'>
        <canvas id='spendChart'></canvas>
      </div>
    </div>

    <div class='chart-card'>
      <div class='chart-title'>📊 Revenue Metrics</div>
      <div class='chart-wrap'>
        <canvas id='mrrChart'></canvas>
      </div>
    </div>
  </div>

  <!-- Forensic Audit Panel -->
  <div class='audit-panel'>
    <div class='audit-header'>
      <span>🚨</span>
      <span>FORENSIC AUDIT ALERTS</span>
      <span style='margin-left: auto; font-size: 14px; color: #8b92a1;'>${anomalies.length} anomalies detected</span>
    </div>

    ${anomalies.length === 0 ? `
      <div style='color: #10e37d; text-align: center; padding: 20px;'>
        ✅ No anomalies detected - all metrics look healthy
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
    // Spend by Category Chart
    const spendData = ${spendChartData};
    new Chart(document.getElementById('spendChart'), {
      type: 'bar',
      data: {
        labels: spendData.map(x => x.name),
        datasets: [{
          data: spendData.map(x => x.value),
          backgroundColor: '#bfff00',
          borderRadius: 6,
          hoverBackgroundColor: '#f5ff8a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141b26',
            titleColor: '#bfff00',
            bodyColor: '#e8ecf1',
            borderColor: '#2d3748',
            borderWidth: 1,
            callbacks: {
              label: (c) => {
                const val = c.parsed.y;
                if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
                return '$' + val.toFixed(0);
              }
            }
          }
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: {
              color: '#8b92a1',
              callback: (v) => {
                if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
                return '$' + v;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8b92a1' }
          }
        }
      }
    });

    // MRR Chart (simple bar for now)
    new Chart(document.getElementById('mrrChart'), {
      type: 'bar',
      data: {
        labels: ['Current MRR'],
        datasets: [{
          data: [${kpis.mrr.value}],
          backgroundColor: '${getStatusColor(kpis.mrr.status)}',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#141b26',
            titleColor: '#bfff00',
            bodyColor: '#e8ecf1',
            borderColor: '#2d3748',
            borderWidth: 1,
            callbacks: {
              label: (c) => {
                const val = c.parsed.y;
                if (val >= 1000000) return '$' + (val / 1000000).toFixed(1) + 'M';
                if (val >= 1000) return '$' + (val / 1000).toFixed(0) + 'K';
                return '$' + val.toFixed(0);
              }
            }
          }
        },
        scales: {
          y: {
            grid: { display: false },
            ticks: {
              color: '#8b92a1',
              callback: (v) => {
                if (v >= 1000000) return '$' + (v / 1000000).toFixed(1) + 'M';
                if (v >= 1000) return '$' + (v / 1000).toFixed(0) + 'K';
                return '$' + v;
              }
            }
          },
          x: {
            grid: { display: false },
            ticks: { color: '#8b92a1' }
          }
        }
      }
    });
  </script>
</body>
</html>`;
}
