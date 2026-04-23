/**
 * Generate smart question suggestions based on uploaded files and conversation context
 */

interface FileSchema {
  filename: string;
  columns: { name: string; dtype: string }[];
}

export function generateInitialSuggestions(files: FileSchema[]): string[] {
  if (files.length === 0) {
    return [
      "What can you help me with?",
      "How do I get started?",
      "What kind of data can I upload?"
    ];
  }

  const fileNames = files.map(f => f.filename.toLowerCase());
  const allColumns = files.flatMap(f => f.columns.map(c => c.name.toLowerCase()));
  const suggestions: string[] = [];

  console.log("📁 Files:", fileNames);
  console.log("📊 Columns:", allColumns);

  // Check for AR/Receivables data (1_Customer_Master_AR.csv)
  if (allColumns.some(c => c.includes('outstanding') && c.includes('ar')) ||
      allColumns.some(c => c.includes('days_past_due'))) {
    suggestions.push("Show me customers past due");
    suggestions.push("What is our total AR balance?");
  }

  // Check for General Ledger data (2_General_Ledger_Detail.csv)
  if (allColumns.some(c => c.includes('debit') && c.includes('credit')) ||
      allColumns.some(c => c.includes('gl_account'))) {
    suggestions.push("Show me total expenses");
    suggestions.push("What are unreconciled transactions?");
  }

  // Check for Employee/Payroll data (3_Employee_Census.csv)
  if (allColumns.some(c => c.includes('base_salary')) ||
      (allColumns.some(c => c.includes('emp_id')) && allColumns.some(c => c.includes('salary')))) {
    suggestions.push("What is our total payroll?");
    suggestions.push("Show me headcount by department");
  }

  // Check for Budget data (4_Budget_Vs_Actuals.csv)
  if (allColumns.some(c => c.includes('variance_pct')) ||
      (allColumns.some(c => c.includes('actual')) && allColumns.some(c => c.includes('budget')))) {
    suggestions.push("Which departments are over budget?");
    suggestions.push("Show me biggest variances");
  }

  // Check for Risk Rating (enterprise data)
  if (allColumns.some(c => c.includes('risk_rating'))) {
    suggestions.push("Show me high risk customers");
  }

  // Check for Credit Limit
  if (allColumns.some(c => c.includes('credit_limit'))) {
    suggestions.push("Who is over their credit limit?");
  }

  // Check for SaaS/Revenue data (old schema - for backward compatibility)
  if (allColumns.some(c => c.includes('mrr')) || allColumns.some(c => c.includes('plan_type'))) {
    suggestions.push("What is our total MRR?");
    suggestions.push("Show me revenue by plan");
  }

  // Check for customer/churn data (old schema)
  if (allColumns.some(c => c.includes('churn_date')) ||
      (fileNames.some(f => f.includes('customer')) && allColumns.some(c => c.includes('status')))) {
    suggestions.push("What is our customer churn rate?");
  }

  // Check for cash flow data (old schema)
  if (fileNames.some(f => f.includes('cash_flow')) && allColumns.some(c => c.includes('runway'))) {
    suggestions.push("How many months of runway?");
  }

  // Generic suggestions if not enough specific ones
  if (suggestions.length < 2 && files.length >= 3) {
    suggestions.push("Create a financial dashboard");
  }

  if (suggestions.length < 3) {
    suggestions.push("What insights can you find?");
  }

  console.log("💡 Generated suggestions:", suggestions.slice(0, 3));

  // Return top 3 suggestions
  return suggestions.slice(0, 3);
}

export function generateFollowUpSuggestions(
  lastQuestion: string,
  lastAnswer: string,
  files: FileSchema[]
): string[] {
  const suggestions: string[] = [];
  const questionLower = lastQuestion.toLowerCase();
  const answerLower = lastAnswer.toLowerCase();
  const fileNames = files.map(f => f.filename.toLowerCase());
  const allColumns = files.flatMap(f => f.columns.map(c => c.name.toLowerCase()));

  console.log("🔄 Follow-up generation:");
  console.log("  Question:", questionLower);
  console.log("  Answer preview:", answerLower.substring(0, 100));
  console.log("  Available columns:", allColumns);

  // AR/Receivables follow-ups
  if (questionLower.includes('ar') || questionLower.includes('receivable') ||
      questionLower.includes('past due') || questionLower.includes('customer')) {

    // Add diverse suggestions
    if (allColumns.some(c => c.includes('risk_rating'))) {
      suggestions.push("Which customers are high risk?");
    }
    if (allColumns.some(c => c.includes('credit_limit'))) {
      suggestions.push("Show credit limit exposures");
    }
    if (allColumns.some(c => c.includes('days_past_due'))) {
      suggestions.push("Aging analysis of receivables");
    }

    // Switch to completely different domain
    if (suggestions.length < 3 && allColumns.some(c => c.includes('variance'))) {
      suggestions.push("Check budget vs actuals");
    }
    if (suggestions.length < 3 && allColumns.some(c => c.includes('base_salary'))) {
      suggestions.push("Analyze payroll by department");
    }
    if (suggestions.length < 3) {
      suggestions.push("Show me financial summary");
    }

    console.log("  AR follow-ups generated:", suggestions);
    return suggestions.slice(0, 3);
  }

  // GL/Ledger/Expense follow-ups
  if (questionLower.includes('ledger') || questionLower.includes('expense') ||
      questionLower.includes('gl') || questionLower.includes('transaction')) {
    if (allColumns.some(c => c.includes('department'))) {
      suggestions.push("Show me expenses by department");
    }
    if (allColumns.some(c => c.includes('reconciled'))) {
      suggestions.push("Show unreconciled transactions");
    }
    if (allColumns.some(c => c.includes('gl_account'))) {
      suggestions.push("Show me account breakdown");
    }
    if (suggestions.length < 3 && allColumns.some(c => c.includes('variance'))) {
      suggestions.push("Compare to budget"); // Fresh
    }
    return suggestions.slice(0, 3);
  }

  // Employee/Payroll follow-ups
  if (questionLower.includes('employee') || questionLower.includes('payroll') ||
      questionLower.includes('headcount') || questionLower.includes('salary')) {
    if (allColumns.some(c => c.includes('department'))) {
      suggestions.push("Show salary by department");
    }
    if (allColumns.some(c => c.includes('role_level'))) {
      suggestions.push("Show headcount by role");
    }
    if (allColumns.some(c => c.includes('status'))) {
      suggestions.push("How many active employees?");
    }
    if (suggestions.length < 3 && allColumns.some(c => c.includes('outstanding'))) {
      suggestions.push("What is our AR balance?"); // Fresh
    }
    return suggestions.slice(0, 3);
  }

  // Budget follow-ups
  if (questionLower.includes('budget') || questionLower.includes('variance') ||
      questionLower.includes('over budget')) {

    // Add specific budget-related questions
    if (allColumns.some(c => c.includes('expense_category'))) {
      suggestions.push("Break down spending by category");
    }
    if (allColumns.some(c => c.includes('actual')) && allColumns.some(c => c.includes('budget'))) {
      suggestions.push("Show me under-budget departments");
    }

    // Switch to different domain for diversity
    if (suggestions.length < 3 && allColumns.some(c => c.includes('outstanding'))) {
      suggestions.push("Review AR aging report");
    }
    if (suggestions.length < 3 && allColumns.some(c => c.includes('base_salary'))) {
      suggestions.push("What's our biggest payroll expense?");
    }
    if (suggestions.length < 3 && allColumns.some(c => c.includes('debit'))) {
      suggestions.push("Audit general ledger entries");
    }
    if (suggestions.length < 3) {
      suggestions.push("Generate executive summary");
    }

    console.log("  Budget follow-ups generated:", suggestions);
    return suggestions.slice(0, 3);
  }

  // Risk/High risk follow-ups
  if (questionLower.includes('risk') || questionLower.includes('high risk')) {
    if (allColumns.some(c => c.includes('days_past_due'))) {
      suggestions.push("Show customers by days past due");
    }
    if (allColumns.some(c => c.includes('credit_limit'))) {
      suggestions.push("Show credit limit analysis");
    }
    if (allColumns.some(c => c.includes('outstanding'))) {
      suggestions.push("Calculate total exposure");
    }
    if (suggestions.length < 3) {
      suggestions.push("Show me low risk customers"); // Fresh
    }
    return suggestions.slice(0, 3);
  }

  // MRR-related follow-ups (SaaS schema - backward compatibility)
  if (questionLower.includes('mrr')) {
    suggestions.push("What's our MRR growth rate?");
    suggestions.push("Show me revenue by plan");
    suggestions.push("What's our churn rate?");
    return suggestions.slice(0, 3);
  }

  // Dashboard/summary follow-ups
  if (questionLower.includes('dashboard') || questionLower.includes('summary') ||
      questionLower.includes('overview')) {
    if (allColumns.some(c => c.includes('risk_rating'))) {
      suggestions.push("Show high risk customers");
    }
    if (allColumns.some(c => c.includes('variance'))) {
      suggestions.push("Show budget variances");
    }
    if (allColumns.some(c => c.includes('reconciled'))) {
      suggestions.push("Show unreconciled items");
    }
    if (suggestions.length < 3) {
      suggestions.push("What are the biggest risks?");
    }
    return suggestions.slice(0, 3);
  }

  // Generic follow-ups based on available columns
  if (allColumns.some(c => c.includes('days_past_due'))) {
    suggestions.push("Show customers past due");
  }
  if (allColumns.some(c => c.includes('variance_pct'))) {
    suggestions.push("Which depts are over budget?");
  }
  if (allColumns.some(c => c.includes('base_salary'))) {
    suggestions.push("What is total payroll?");
  }

  // Fill remaining with generic options
  const generic = [
    "Create a financial dashboard",
    "What should I focus on?",
    "Show me key metrics",
    "Any red flags in the data?",
    "What insights can you find?"
  ];

  for (const gen of generic) {
    if (suggestions.length >= 3) break;
    if (!suggestions.includes(gen)) {
      suggestions.push(gen);
    }
  }

  console.log("💡 Follow-up suggestions:", suggestions.slice(0, 3));
  console.log("📝 Last question was:", questionLower);

  return suggestions.slice(0, 3);
}

/**
 * Helper to check if a suggestion is too similar to a used question
 * Returns true if they're essentially the same question
 */
export function isSimilarQuestion(suggestion: string, usedQuestion: string): boolean {
  const s1 = suggestion.toLowerCase().trim().replace(/[?.,!]/g, '');
  const s2 = usedQuestion.toLowerCase().trim().replace(/[?.,!]/g, '');

  // Exact match
  if (s1 === s2) {
    console.log(`    ✗ Exact match: "${suggestion}" === "${usedQuestion}"`);
    return true;
  }

  // Normalize common abbreviations and variations
  const normalize = (str: string) => str
    .replace(/which /g, '')
    .replace(/what /g, '')
    .replace(/show me /g, '')
    .replace(/show /g, '')
    .replace(/give me /g, '')
    .replace(/departments?/g, 'dept')
    .replace(/depts?/g, 'dept')
    .replace(/customers?/g, 'customer')
    .replace(/employees?/g, 'employee')
    .replace(/transactions?/g, 'transaction')
    .replace(/\s+/g, ' ')
    .trim();

  const n1 = normalize(s1);
  const n2 = normalize(s2);

  // Check if normalized versions match
  if (n1 === n2) {
    console.log(`    ✗ Normalized match: "${suggestion}" ≈ "${usedQuestion}"`);
    return true;
  }

  // Check if one contains the core keywords of the other
  // Only filter if 90%+ keywords match (less aggressive than 80%)
  const words1 = n1.split(' ').filter(w => w.length > 4); // Longer words only
  const words2 = n2.split(' ').filter(w => w.length > 4);

  if (words1.length >= 2 && words2.length >= 2) {
    const commonWords = words1.filter(w => words2.includes(w)).length;
    const similarity = commonWords / Math.max(words1.length, words2.length);

    if (similarity >= 0.9) {
      console.log(`    ✗ High similarity (${(similarity * 100).toFixed(0)}%): "${suggestion}" ≈ "${usedQuestion}"`);
      return true;
    } else if (similarity > 0) {
      console.log(`    ✓ Acceptable similarity (${(similarity * 100).toFixed(0)}%): "${suggestion}" vs "${usedQuestion}"`);
    }
  }

  return false;
}
