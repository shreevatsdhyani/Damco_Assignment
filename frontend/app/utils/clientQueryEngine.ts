/**
 * Client-Side Query Engine
 * Answers questions directly from CSV data when backend fails
 */

interface CSVRow {
  [key: string]: any;
}

interface QueryResult {
  success: boolean;
  answer: string;
  artifactHtml?: string;
}

export function answerQuestion(
  question: string,
  csvData: Map<string, CSVRow[]>
): QueryResult {
  const questionLower = question.toLowerCase();

  console.log("🤖 Client-side query engine processing:", question);
  console.log("📊 Available data:", Array.from(csvData.keys()));
  console.log("🔍 Question check:", {
    hasDepartment: questionLower.includes('department'),
    hasOverBudget: questionLower.includes('over budget'),
    hasBudget: questionLower.includes('budget'),
    fullQuestion: questionLower
  });

  // Which departments are over budget?
  if (questionLower.includes('department') && questionLower.includes('over budget')) {
    console.log("✅ Matched: over budget departments query");
    return answerOverBudgetDepartments(csvData);
  }

  if (questionLower.includes('over budget')) {
    console.log("✅ Matched: over budget query (no department specified)");
    return answerOverBudgetDepartments(csvData);
  }

  // Budget variance questions
  if (questionLower.includes('budget') && (questionLower.includes('variance') || questionLower.includes('biggest'))) {
    return answerBudgetVariance(csvData);
  }

  // High risk customers
  if (questionLower.includes('high risk') || (questionLower.includes('risk') && questionLower.includes('customer'))) {
    return answerHighRiskCustomers(csvData);
  }

  // Customers past due
  if (questionLower.includes('past due') || questionLower.includes('overdue')) {
    return answerPastDueCustomers(csvData);
  }

  // Total payroll / headcount cost
  if (questionLower.includes('payroll') || (questionLower.includes('total') && questionLower.includes('salary'))) {
    return answerTotalPayroll(csvData);
  }

  // Headcount by department
  if (questionLower.includes('headcount') && questionLower.includes('department')) {
    return answerHeadcountByDepartment(csvData);
  }

  // Total AR balance
  if (questionLower.includes('ar') || questionLower.includes('receivable')) {
    return answerARBalance(csvData);
  }

  // MRR
  if (questionLower.includes('mrr') || questionLower.includes('recurring revenue')) {
    return answerMRR(csvData);
  }

  return {
    success: false,
    answer: "I need the backend to answer this question. Please ensure the backend API is running."
  };
}

function answerOverBudgetDepartments(csvData: Map<string, CSVRow[]>): QueryResult {
  console.log("💰 answerOverBudgetDepartments called");
  const budgetData = findData(csvData, ['budget', 'variance']);

  console.log("📊 Budget data found:", budgetData.length, "rows");
  if (budgetData.length > 0) {
    console.log("📄 Sample row:", budgetData[0]);
    console.log("🔑 Available keys:", Object.keys(budgetData[0]));
  }

  if (budgetData.length === 0) {
    console.log("❌ No budget data found");
    return {
      success: false,
      answer: "No budget data found in uploaded files."
    };
  }

  const overBudget = budgetData
    .filter(row => {
      const variance = parseFloat(row.variance_amount || row.variance || '0');
      return !isNaN(variance) && variance > 0;
    })
    .map(row => ({
      department: row.department || row.Department || 'Unknown',
      category: row.category || row.expense_category || row.Expense_Category || '',
      budgeted: parseFloat(row.budgeted_amount || row.budget || row.FY23_Approved_Budget || '0'),
      actual: parseFloat(row.actual_amount || row.actual || row.FY23_Actual_Spend || '0'),
      variance: parseFloat(row.variance_amount || row.variance || row.Variance_Amount || '0'),
      variancePct: parseFloat(row.variance_pct || row.Variance_Pct || '0')
    }))
    .sort((a, b) => b.variance - a.variance);

  if (overBudget.length === 0) {
    return {
      success: true,
      answer: "Great news! No departments are over budget. All spending is within allocated budgets.",
      artifactHtml: generateSimpleCard("✅ Budget Status", "All departments are within budget")
    };
  }

  const answer = `Found ${overBudget.length} department${overBudget.length > 1 ? 's' : ''} over budget:\n\n` +
    overBudget.slice(0, 10).map((d, i) =>
      `${i + 1}. ${d.department}${d.category ? ` - ${d.category}` : ''}: $${d.actual.toLocaleString()} vs $${d.budgeted.toLocaleString()} budgeted (+${d.variancePct.toFixed(1)}%)`
    ).join('\n');

  const artifactHtml = generateBudgetTable(overBudget);

  return {
    success: true,
    answer,
    artifactHtml
  };
}

function answerBudgetVariance(csvData: Map<string, CSVRow[]>): QueryResult {
  const budgetData = findData(csvData, ['budget', 'variance']);

  if (budgetData.length === 0) {
    return { success: false, answer: "No budget data found." };
  }

  const variances = budgetData
    .map(row => ({
      department: row.department || row.Department || 'Unknown',
      category: row.category || row.expense_category || row.Expense_Category || '',
      variance: Math.abs(parseFloat(row.variance_amount || row.variance || '0'))
    }))
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 10);

  const answer = `Top budget variances:\n\n` +
    variances.map((v, i) =>
      `${i + 1}. ${v.department}${v.category ? ` - ${v.category}` : ''}: $${v.variance.toLocaleString()}`
    ).join('\n');

  return { success: true, answer };
}

function answerHighRiskCustomers(csvData: Map<string, CSVRow[]>): QueryResult {
  const customerData = findData(csvData, ['customer', 'ar', 'receivable']);

  if (customerData.length === 0) {
    return { success: false, answer: "No customer data found." };
  }

  const highRisk = customerData
    .filter(row => (row.risk_rating || row.Risk_Rating || '').toLowerCase().includes('high'))
    .map(row => ({
      id: row.customer_id || row.Customer_ID || '',
      risk: row.risk_rating || row.Risk_Rating || '',
      balance: parseFloat(row.outstanding_ar_balance || row.Outstanding_AR_Balance || '0'),
      daysDue: parseInt(row.days_past_due || row.Days_Past_Due || '0')
    }))
    .sort((a, b) => b.balance - a.balance);

  if (highRisk.length === 0) {
    return {
      success: true,
      answer: "No high risk customers found. All customers have low or medium risk ratings."
    };
  }

  const answer = `Found ${highRisk.length} high risk customers:\n\n` +
    highRisk.slice(0, 10).map((c, i) =>
      `${i + 1}. ${c.id}: $${c.balance.toLocaleString()} (${c.daysDue} days past due)`
    ).join('\n');

  const artifactHtml = generateCustomerTable(highRisk, "High Risk Customers");

  return { success: true, answer, artifactHtml };
}

function answerPastDueCustomers(csvData: Map<string, CSVRow[]>): QueryResult {
  const customerData = findData(csvData, ['customer', 'ar', 'receivable']);

  if (customerData.length === 0) {
    return { success: false, answer: "No customer data found." };
  }

  const pastDue = customerData
    .filter(row => {
      const days = parseInt(row.days_past_due || row.Days_Past_Due || '0');
      return !isNaN(days) && days > 0;
    })
    .map(row => ({
      id: row.customer_id || row.Customer_ID || '',
      balance: parseFloat(row.outstanding_ar_balance || row.Outstanding_AR_Balance || '0'),
      daysDue: parseInt(row.days_past_due || row.Days_Past_Due || '0'),
      risk: row.risk_rating || row.Risk_Rating || ''
    }))
    .sort((a, b) => b.daysDue - a.daysDue);

  const answer = `Found ${pastDue.length} customers past due:\n\n` +
    pastDue.slice(0, 10).map((c, i) =>
      `${i + 1}. ${c.id}: $${c.balance.toLocaleString()} (${c.daysDue} days past due, ${c.risk})`
    ).join('\n');

  return { success: true, answer };
}

function answerTotalPayroll(csvData: Map<string, CSVRow[]>): QueryResult {
  const payrollData = findData(csvData, ['payroll', 'employee', 'salary']);

  if (payrollData.length === 0) {
    return { success: false, answer: "No payroll data found." };
  }

  const activeEmployees = payrollData.filter(row =>
    (row.status || row.Status || '').toLowerCase() === 'active'
  );

  const totalPayroll = activeEmployees.reduce((sum, row) => {
    const salary = parseFloat(row.salary || row.base_salary || row.Base_Salary || '0');
    return sum + (isNaN(salary) ? 0 : salary);
  }, 0);

  const answer = `Total Payroll Cost: $${totalPayroll.toLocaleString()}\nActive Employees: ${activeEmployees.length}`;

  const artifactHtml = generateKPICard("Total Payroll Cost", `$${(totalPayroll / 1000).toFixed(0)}K`, `${activeEmployees.length} active employees`);

  return { success: true, answer, artifactHtml };
}

function answerHeadcountByDepartment(csvData: Map<string, CSVRow[]>): QueryResult {
  const payrollData = findData(csvData, ['payroll', 'employee']);

  if (payrollData.length === 0) {
    return { success: false, answer: "No employee data found." };
  }

  const deptCounts = new Map<string, number>();
  payrollData.forEach(row => {
    const dept = row.department || row.Department || 'Unknown';
    deptCounts.set(dept, (deptCounts.get(dept) || 0) + 1);
  });

  const sorted = Array.from(deptCounts.entries())
    .sort((a, b) => b[1] - a[1]);

  const answer = `Headcount by department:\n\n` +
    sorted.map(([dept, count]) => `${dept}: ${count}`).join('\n');

  return { success: true, answer };
}

function answerARBalance(csvData: Map<string, CSVRow[]>): QueryResult {
  const customerData = findData(csvData, ['customer', 'ar', 'receivable']);

  if (customerData.length === 0) {
    return { success: false, answer: "No AR data found." };
  }

  const totalAR = customerData.reduce((sum, row) => {
    const balance = parseFloat(row.outstanding_ar_balance || row.Outstanding_AR_Balance || '0');
    return sum + (isNaN(balance) ? 0 : balance);
  }, 0);

  const answer = `Total AR Balance: $${totalAR.toLocaleString()}\nCustomers: ${customerData.length}`;

  const artifactHtml = generateKPICard("Total AR Balance", `$${(totalAR / 1000000).toFixed(1)}M`, `${customerData.length} customers`);

  return { success: true, answer, artifactHtml };
}

function answerMRR(csvData: Map<string, CSVRow[]>): QueryResult {
  const stripeData = findData(csvData, ['stripe', 'subscriber']);

  if (stripeData.length === 0) {
    return { success: false, answer: "No subscription data found." };
  }

  const activeSubs = stripeData.filter(row =>
    (row.status || '').toLowerCase() === 'active'
  );

  const totalMRR = activeSubs.reduce((sum, row) => {
    const mrr = parseFloat(row.mrr || row.MRR || '0');
    return sum + (isNaN(mrr) ? 0 : mrr);
  }, 0);

  const answer = `Total MRR: $${totalMRR.toLocaleString()}\nActive Subscribers: ${activeSubs.length}`;

  const artifactHtml = generateKPICard("Monthly Recurring Revenue", `$${(totalMRR / 1000).toFixed(0)}K`, `${activeSubs.length} active subscribers`);

  return { success: true, answer, artifactHtml };
}

function findData(dataMap: Map<string, CSVRow[]>, keywords: string[]): CSVRow[] {
  for (const [filename, data] of dataMap.entries()) {
    if (keywords.some(kw => filename.includes(kw))) {
      return data;
    }
  }
  return [];
}

// HTML Generators

function generateBudgetTable(data: any[]): string {
  const rows = data.slice(0, 20).map(d => `
    <tr>
      <td>${d.department}</td>
      <td>${d.category}</td>
      <td>$${d.budgeted.toLocaleString()}</td>
      <td>$${d.actual.toLocaleString()}</td>
      <td class="variance ${d.variance > 0 ? 'over' : 'under'}">
        ${d.variance > 0 ? '+' : ''}$${d.variance.toLocaleString()}
        <span class="pct">(${d.variancePct > 0 ? '+' : ''}${d.variancePct.toFixed(1)}%)</span>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><head><meta charset='UTF-8'>
<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #e6edf3; font-family: 'Inter', sans-serif; padding: 24px; }
  h1 { color: #3b82f6; margin-bottom: 20px; font-size: 28px; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
  th { background: #30363d; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #8b949e; }
  td { padding: 12px; border-top: 1px solid #30363d; font-size: 14px; }
  .variance { font-weight: 600; }
  .variance.over { color: #f87171; }
  .variance.under { color: #34d399; }
  .pct { font-size: 12px; color: #8b949e; margin-left: 8px; }
</style></head><body>
<h1>🚨 Departments Over Budget</h1>
<table>
  <thead><tr>
    <th>Department</th>
    <th>Category</th>
    <th>Budgeted</th>
    <th>Actual</th>
    <th>Variance</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
}

function generateCustomerTable(data: any[], title: string): string {
  const rows = data.slice(0, 20).map(c => `
    <tr>
      <td>${c.id}</td>
      <td>$${c.balance.toLocaleString()}</td>
      <td>${c.daysDue} days</td>
      <td class="risk-${c.risk.toLowerCase().replace(' ', '-')}">${c.risk}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html><head><meta charset='UTF-8'>
<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #e6edf3; font-family: 'Inter', sans-serif; padding: 24px; }
  h1 { color: #3b82f6; margin-bottom: 20px; font-size: 28px; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
  th { background: #30363d; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #8b949e; }
  td { padding: 12px; border-top: 1px solid #30363d; font-size: 14px; }
  .risk-high-risk { color: #f87171; font-weight: 600; }
  .risk-medium-risk { color: #fbbf24; font-weight: 600; }
  .risk-low-risk { color: #34d399; font-weight: 600; }
</style></head><body>
<h1>🚨 ${title}</h1>
<table>
  <thead><tr>
    <th>Customer ID</th>
    <th>Outstanding Balance</th>
    <th>Days Past Due</th>
    <th>Risk Rating</th>
  </tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`;
}

function generateKPICard(title: string, value: string, subtitle: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset='UTF-8'>
<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #e6edf3; font-family: 'Inter', sans-serif; padding: 48px; display: flex; align-items: center; justify-content: center; height: 100vh; }
  .card { background: #161b22; border: 2px solid #3b82f6; border-radius: 16px; padding: 48px; text-align: center; min-width: 400px; }
  .title { font-size: 16px; color: #8b949e; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
  .value { font-size: 64px; font-weight: 700; color: #3b82f6; margin-bottom: 12px; }
  .subtitle { font-size: 14px; color: #8b949e; }
</style></head><body>
<div class="card">
  <div class="title">${title}</div>
  <div class="value">${value}</div>
  <div class="subtitle">${subtitle}</div>
</div>
</body></html>`;
}

function generateSimpleCard(title: string, message: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset='UTF-8'>
<link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d1117; color: #e6edf3; font-family: 'Inter', sans-serif; padding: 48px; display: flex; align-items: center; justify-content: center; height: 100vh; }
  .card { background: #161b22; border: 2px solid #34d399; border-radius: 16px; padding: 48px; text-align: center; min-width: 400px; }
  .title { font-size: 32px; margin-bottom: 16px; }
  .message { font-size: 18px; color: #8b949e; }
</style></head><body>
<div class="card">
  <div class="title">${title}</div>
  <div class="message">${message}</div>
</div>
</body></html>`;
}
