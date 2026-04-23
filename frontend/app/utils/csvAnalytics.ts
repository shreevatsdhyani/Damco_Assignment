/**
 * CSV Analytics Engine - Client-side financial metrics calculation
 */

interface CSVRow {
  [key: string]: any;
}

interface KPIMetrics {
  cashRunway: { value: number; status: 'healthy' | 'warning' | 'critical' };
  monthlyBurn: { value: number; status: 'healthy' | 'warning' | 'critical' };
  mrr: { value: number; status: 'healthy' | 'warning' | 'critical' };
  churnRate: { value: number; status: 'healthy' | 'warning' | 'critical' };
  headcountCost: { value: number; status: 'healthy' | 'warning' | 'critical' };
  budgetVariance: { value: number; status: 'healthy' | 'warning' | 'critical' };
}

interface Anomaly {
  type: 'duplicate_transaction' | 'outlier_mrr' | 'ghost_employee' | 'budget_overrun';
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  details: any;
}

interface AnalyticsResult {
  kpis: KPIMetrics;
  anomalies: Anomaly[];
  chartData: {
    spendByCategory: Array<{ name: string; value: number }>;
    mrrTrend: Array<{ name: string; value: number }>;
  };
}

export async function analyzeCSVFiles(files: File[]): Promise<AnalyticsResult> {
  console.log("📊 Starting CSV analysis...", files.length, "files");

  // Parse all CSV files
  const parsedData = await Promise.all(files.map(file => parseCSV(file)));

  const dataMap = new Map<string, CSVRow[]>();
  files.forEach((file, idx) => {
    dataMap.set(file.name.toLowerCase(), parsedData[idx]);
  });

  console.log("✅ Parsed data:", Array.from(dataMap.keys()));

  // Calculate KPIs
  const kpis = calculateKPIs(dataMap);

  // Detect anomalies
  const anomalies = detectAnomalies(dataMap);

  // Generate chart data
  const chartData = generateChartData(dataMap);

  console.log("📈 Analysis complete:", { kpis, anomalies: anomalies.length, chartData });

  return { kpis, anomalies, chartData };
}

async function parseCSV(file: File): Promise<CSVRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = parseCSVText(text);
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function parseCSVText(text: string): CSVRow[] {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, '').toLowerCase());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    rows.push(row);
  }

  return rows;
}

function calculateKPIs(dataMap: Map<string, CSVRow[]>): KPIMetrics {
  console.log("💰 Calculating KPIs...");

  // Cash Runway
  const bankData = findData(dataMap, ['bank', 'transaction', 'cash', 'chase']);
  let cashRunway = 0;
  let monthlyBurn = 0;

  if (bankData.length > 0) {
    const balances = bankData
      .map(r => parseFloat(r.account_balance || r.balance || '0'))
      .filter(b => !isNaN(b) && b !== 0);

    let currentBalance: number;
    if (balances.length > 0) {
      currentBalance = Math.max(...balances);
    } else {
      currentBalance = bankData.reduce((sum, r) => {
        const amount = parseFloat(r.amount || '0');
        return sum + (isNaN(amount) ? 0 : amount);
      }, 0);
    }

    const outflows = bankData
      .map(r => parseFloat(r.amount || '0'))
      .filter(a => !isNaN(a) && a < 0);

    const months = new Set(bankData.map(r => {
      const d = r.transaction_date || r.date || '';
      return d.substring(0, 7);
    }).filter(Boolean));
    const numMonths = Math.max(months.size, 1);

    if (outflows.length > 0) {
      monthlyBurn = Math.abs(outflows.reduce((sum, a) => sum + a, 0)) / numMonths;
      cashRunway = Math.abs(currentBalance) / monthlyBurn;
    }
  }

  // MRR
  const stripeData = findData(dataMap, ['stripe', 'subscriber', 'mrr']);
  let mrr = 0;
  let churnRate = 0;

  if (stripeData.length > 0) {
    const activeSubs = stripeData.filter(r =>
      (r.status || '').toLowerCase() === 'active'
    );
    mrr = activeSubs.reduce((sum, r) => {
      const mrrValue = parseFloat(r.mrr || r.mrr_amount || '0');
      return sum + (isNaN(mrrValue) ? 0 : mrrValue);
    }, 0);

    const churned = stripeData.filter(r => {
      const status = (r.status || '').toLowerCase();
      return status === 'churned' || status === 'canceled' || status === 'cancelled';
    }).length;
    const total = stripeData.length;
    churnRate = total > 0 ? (churned / total) * 100 : 0;
  }

  // Headcount Cost
  const payrollData = findData(dataMap, ['payroll', 'gusto', 'employee', 'salary']);
  let headcountCost = 0;

  if (payrollData.length > 0) {
    const activeEmployees = payrollData.filter(r =>
      (r.status || '').toLowerCase() === 'active'
    );
    headcountCost = activeEmployees.reduce((sum, r) => {
      const salary = parseFloat(r.salary || r.base_salary || '0');
      return sum + (isNaN(salary) ? 0 : salary);
    }, 0);
  }

  // Budget Variance
  const budgetData = findData(dataMap, ['budget', 'variance']);
  let budgetVariance = 0;

  if (budgetData.length > 0) {
    budgetVariance = budgetData.reduce((sum, r) => {
      const variance = parseFloat(r.variance || r.variance_amount || '0');
      return sum + (isNaN(variance) ? 0 : variance);
    }, 0);
  }

  console.log("📊 KPIs calculated:", { cashRunway, monthlyBurn, mrr, churnRate, headcountCost, budgetVariance });

  return {
    cashRunway: {
      value: cashRunway,
      status: cashRunway > 12 ? 'healthy' : cashRunway > 6 ? 'warning' : 'critical'
    },
    monthlyBurn: {
      value: monthlyBurn,
      status: monthlyBurn < 50000 ? 'healthy' : monthlyBurn < 100000 ? 'warning' : 'critical'
    },
    mrr: {
      value: mrr,
      status: mrr > 100000 ? 'healthy' : mrr > 50000 ? 'warning' : 'critical'
    },
    churnRate: {
      value: churnRate,
      status: churnRate < 5 ? 'healthy' : churnRate < 15 ? 'warning' : 'critical'
    },
    headcountCost: {
      value: headcountCost,
      status: 'healthy' // Always healthy unless over budget
    },
    budgetVariance: {
      value: budgetVariance,
      status: budgetVariance < 0 ? 'healthy' : budgetVariance < 50000 ? 'warning' : 'critical'
    }
  };
}

function detectAnomalies(dataMap: Map<string, CSVRow[]>): Anomaly[] {
  console.log("🔍 Detecting anomalies...");
  const anomalies: Anomaly[] = [];

  // 1. Duplicate Transactions
  const bankData = findData(dataMap, ['bank', 'transaction', 'chase']);
  if (bankData.length > 0) {
    const seen = new Map<string, number>();
    bankData.forEach(row => {
      const desc = (row.description || '').toLowerCase();
      const amount = parseFloat(row.amount || '0');
      const key = `${desc}_${amount}`;
      seen.set(key, (seen.get(key) || 0) + 1);
    });

    seen.forEach((count, key) => {
      if (count > 1) {
        const [desc, amount] = key.split('_');
        anomalies.push({
          type: 'duplicate_transaction',
          severity: 'warning',
          title: 'Duplicate Transaction Detected',
          description: `Found ${count} identical transactions: "${desc}" for $${amount}`,
          details: { description: desc, amount: parseFloat(amount), count }
        });
      }
    });
  }

  // 2. MRR Outliers
  const stripeData = findData(dataMap, ['stripe', 'subscriber']);
  if (stripeData.length > 0) {
    const mrrValues = stripeData
      .map(r => parseFloat(r.mrr || r.mrr_amount || '0'))
      .filter(v => !isNaN(v) && v > 0);

    if (mrrValues.length > 0) {
      const mean = mrrValues.reduce((a, b) => a + b, 0) / mrrValues.length;
      const stdDev = Math.sqrt(
        mrrValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / mrrValues.length
      );

      stripeData.forEach((row, idx) => {
        const mrr = parseFloat(row.mrr || row.mrr_amount || '0');
        if (!isNaN(mrr) && Math.abs(mrr - mean) > 3 * stdDev) {
          anomalies.push({
            type: 'outlier_mrr',
            severity: 'critical',
            title: 'MRR Outlier Detected',
            description: `Customer ${row.customer_id || idx} has MRR of $${mrr.toLocaleString()} (mean: $${mean.toFixed(0)})`,
            details: { customerId: row.customer_id, mrr, mean, stdDev }
          });
        }
      });
    }
  }

  // 3. Ghost Employees
  const payrollData = findData(dataMap, ['payroll', 'gusto', 'employee']);
  if (payrollData.length > 0) {
    const employeePayments = new Map<string, number>();
    payrollData.forEach(row => {
      const empId = row.employee_id || row.emp_id || '';
      const status = (row.status || '').toLowerCase();
      if (status === 'terminated') {
        employeePayments.set(empId, (employeePayments.get(empId) || 0) + 1);
      }
    });

    employeePayments.forEach((count, empId) => {
      if (count > 1) {
        const employee = payrollData.find(r =>
          (r.employee_id || r.emp_id) === empId
        );
        anomalies.push({
          type: 'ghost_employee',
          severity: 'critical',
          title: 'Ghost Employee Detected',
          description: `Employee ${empId} (${employee?.employee_name || 'Unknown'}) is terminated but appears in ${count} payroll runs`,
          details: { employeeId: empId, name: employee?.employee_name, count }
        });
      }
    });
  }

  // 4. Budget Overruns
  const budgetData = findData(dataMap, ['budget']);
  if (budgetData.length > 0) {
    budgetData.forEach(row => {
      const budgeted = parseFloat(row.budgeted_amount || row.budget || '0');
      const actual = parseFloat(row.actual_amount || row.actual || '0');

      if (!isNaN(budgeted) && !isNaN(actual) && budgeted > 0) {
        const overrun = ((actual - budgeted) / budgeted) * 100;
        if (overrun > 50) {
          anomalies.push({
            type: 'budget_overrun',
            severity: overrun > 100 ? 'critical' : 'warning',
            title: 'Budget Overrun',
            description: `${row.category || 'Category'} is ${overrun.toFixed(0)}% over budget ($${actual.toLocaleString()} vs $${budgeted.toLocaleString()})`,
            details: { category: row.category, budgeted, actual, overrun }
          });
        }
      }
    });
  }

  console.log("🚨 Anomalies detected:", anomalies.length);
  return anomalies;
}

function generateChartData(dataMap: Map<string, CSVRow[]>) {
  // Spend by Category
  const bankData = findData(dataMap, ['bank', 'transaction', 'chase']);
  const categorySpend = new Map<string, number>();

  bankData.forEach(row => {
    const amount = parseFloat(row.amount || '0');
    if (!isNaN(amount) && amount < 0) {
      const category = row.category || 'Uncategorized';
      categorySpend.set(category, (categorySpend.get(category) || 0) + Math.abs(amount));
    }
  });

  const spendByCategory = Array.from(categorySpend.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // MRR Trend (if we have date data)
  const stripeData = findData(dataMap, ['stripe', 'subscriber']);
  const mrrTrend = [
    { name: 'Current MRR', value: stripeData
      .filter(r => (r.status || '').toLowerCase() === 'active')
      .reduce((sum, r) => sum + (parseFloat(r.mrr || r.mrr_amount || '0') || 0), 0)
    }
  ];

  return { spendByCategory, mrrTrend };
}

const COLUMN_SIGNATURES: Record<string, string[][]> = {
  'bank': [['balance', 'amount'], ['account_balance', 'amount'], ['balance', 'description'], ['amount', 'date', 'description'], ['amount', 'category']],
  'stripe': [['mrr', 'status'], ['mrr_amount', 'status'], ['mrr', 'customer_id'], ['mrr_amount', 'customer_id'], ['subscriber', 'mrr'], ['plan', 'mrr']],
  'payroll': [['salary', 'employee_id'], ['base_salary', 'employee_name'], ['salary', 'status', 'employee'], ['emp_id', 'salary']],
  'budget': [['budgeted_amount', 'actual_amount'], ['budget', 'actual'], ['variance', 'category'], ['budgeted_amount', 'variance']],
};

function findData(dataMap: Map<string, CSVRow[]>, keywords: string[]): CSVRow[] {
  for (const [filename, data] of dataMap.entries()) {
    if (keywords.some(kw => filename.includes(kw))) {
      return data;
    }
  }

  const category = keywords.find(kw => COLUMN_SIGNATURES[kw]);
  if (category) {
    const signatures = COLUMN_SIGNATURES[category];
    for (const [, data] of dataMap.entries()) {
      if (data.length === 0) continue;
      const columns = Object.keys(data[0]).map(c => c.toLowerCase());
      for (const sig of signatures) {
        if (sig.every(col => columns.some(c => c.includes(col)))) {
          return data;
        }
      }
    }
  }

  return [];
}
