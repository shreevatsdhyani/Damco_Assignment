/**
 * Fallback Dashboard Generator
 * Creates visual KPI cards from text-only responses
 * Enhanced with smart chart selection
 */

import { generateSmartChartHTML } from './enhancedChartHTML';

export function generateFallbackDashboard(question: string, answer: string): string {
  // Try to extract structured data for smart charts
  const chartData = extractChartData(answer);

  if (chartData.length >= 2) {
    console.log('📊 Extracted chart data:', chartData);
    return generateSmartChartHTML(chartData, question, answer);
  }

  // Extract numbers from the answer
  const numbers = extractNumbers(answer);

  // Always show text dashboard if no numbers found
  // Remove the "incomplete" check - just show the text nicely
  if (numbers.length === 0) {
    return generateTextDashboard(question, answer);
  }

  return generateKPIDashboard(question, answer, numbers);
}

/**
 * Extract structured chart data from text answers
 * Looks for patterns like "Department X: $1000" or "Jan: 45%"
 */
function extractChartData(text: string): Array<{ name: string; value: number }> {
  const chartData: Array<{ name: string; value: number }> = [];

  // Pattern 1: "Name: $value" or "Name - $value"
  const pattern1 = /([A-Za-z][A-Za-z\s]+)[\s:–-]+\$([0-9,]+(?:\.[0-9]+)?)/g;
  let match;

  while ((match = pattern1.exec(text)) !== null) {
    const name = match[1].trim();
    const value = parseFloat(match[2].replace(/,/g, ''));
    if (!isNaN(value)) {
      chartData.push({ name, value });
    }
  }

  // Pattern 2: "Name: value%" or "Name - value%"
  if (chartData.length === 0) {
    const pattern2 = /([A-Za-z][A-Za-z\s]+)[\s:–-]+([0-9,]+(?:\.[0-9]+)?)\s*%/g;
    while ((match = pattern2.exec(text)) !== null) {
      const name = match[1].trim();
      const value = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(value)) {
        chartData.push({ name, value });
      }
    }
  }

  // Pattern 3: Numbered list "1. Name: value"
  if (chartData.length === 0) {
    const pattern3 = /\d+\.\s+([A-Za-z][A-Za-z\s&]+)[\s:–-]+\$?([0-9,]+(?:\.[0-9]+)?)/g;
    while ((match = pattern3.exec(text)) !== null) {
      const name = match[1].trim().replace(/\s+\(.+\)$/, ''); // Remove parenthetical
      const value = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(value) && value > 0) {
        chartData.push({ name, value });
      }
    }
  }

  return chartData;
}

function extractNumbers(text: string): Array<{ value: number; label: string; unit: string }> {
  const results: Array<{ value: number; label: string; unit: string }> = [];

  // Match currency values: $1,234.56 or $1.2M or $45K
  const currencyRegex = /\$([0-9,]+(?:\.[0-9]+)?)\s*([KMB])?/g;
  let match;

  while ((match = currencyRegex.exec(text)) !== null) {
    let value = parseFloat(match[1].replace(/,/g, ''));
    const multiplier = match[2];

    if (multiplier === 'K') value *= 1000;
    if (multiplier === 'M') value *= 1000000;
    if (multiplier === 'B') value *= 1000000000;

    // Find label (words before the number)
    const beforeMatch = text.substring(0, match.index).split(' ').slice(-5).join(' ');

    results.push({
      value,
      label: beforeMatch || 'Value',
      unit: 'currency'
    });
  }

  // Match percentages: 15% or 15.5%
  const percentRegex = /([0-9]+(?:\.[0-9]+)?)\s*%/g;

  while ((match = percentRegex.exec(text)) !== null) {
    const value = parseFloat(match[1]);
    const beforeMatch = text.substring(0, match.index).split(' ').slice(-5).join(' ');

    results.push({
      value,
      label: beforeMatch || 'Percentage',
      unit: 'percent'
    });
  }

  // Match plain numbers with context
  const numberRegex = /([0-9,]+(?:\.[0-9]+)?)\s+(customers?|employees?|transactions?|months?|days?)/gi;

  while ((match = numberRegex.exec(text)) !== null) {
    const value = parseFloat(match[1].replace(/,/g, ''));
    const label = match[2];

    results.push({
      value,
      label,
      unit: 'count'
    });
  }

  return results.slice(0, 6); // Max 6 KPIs
}

function generateKPIDashboard(question: string, answer: string, numbers: Array<{ value: number; label: string; unit: string }>): string {
  const formatValue = (num: { value: number; unit: string }) => {
    if (num.unit === 'currency') {
      if (num.value >= 1000000) return `$${(num.value / 1000000).toFixed(1)}M`;
      if (num.value >= 1000) return `$${(num.value / 1000).toFixed(0)}K`;
      return `$${num.value.toFixed(0)}`;
    }
    if (num.unit === 'percent') {
      return `${num.value.toFixed(1)}%`;
    }
    return num.value.toLocaleString();
  };

  const kpiCards = numbers.map(num => `
    <div class='kpi-card'>
      <div class='kpi-label'>${num.label}</div>
      <div class='kpi-value'>${formatValue(num)}</div>
    </div>
  `).join('');

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 32px;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .header {
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
      margin-bottom: 24px;
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .kpi-card {
      background: #161b22;
      border-radius: 12px;
      padding: 24px;
      border: 2px solid #3b82f6;
      transition: transform 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.2);
    }
    .kpi-label {
      font-size: 13px;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: .05em;
      margin-bottom: 12px;
      font-weight: 600;
    }
    .kpi-value {
      font-size: 42px;
      font-weight: 700;
      color: #3b82f6;
    }
    .answer-box {
      background: #161b22;
      border-radius: 12px;
      padding: 24px;
      border: 1px solid #30363d;
      flex: 1;
      overflow-y: auto;
    }
    .answer-text {
      font-size: 15px;
      line-height: 1.6;
      color: #e6edf3;
    }
  </style>
</head>
<body>
  <div class='header'>${question}</div>

  <div class='kpi-grid'>
    ${kpiCards}
  </div>

  <div class='answer-box'>
    <div class='answer-text'>${answer}</div>
  </div>
</body>
</html>`;
}

function generateTextDashboard(question: string, answer: string): string {
  const isIncomplete = answer.length < 100 || (answer.includes('Here are') && !answer.includes('\n'));

  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 32px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .header {
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
    }
    .answer-card {
      background: #161b22;
      border-radius: 12px;
      padding: 32px;
      border: 2px solid ${isIncomplete ? '#fbbf24' : '#3b82f6'};
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .answer-text {
      font-size: 18px;
      line-height: 1.8;
      color: #e6edf3;
      white-space: pre-wrap;
    }
    .notice {
      background: rgba(251, 191, 36, 0.1);
      border-left: 4px solid #fbbf24;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      color: #fbbf24;
      margin-top: auto;
    }
    .notice-title {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .notice-text {
      color: #8b949e;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class='header'>${question}</div>

  <div class='answer-card'>
    <div class='answer-text'>${answer || 'No response received from backend.'}</div>

    ${isIncomplete ? `
      <div class='notice'>
        <div class='notice-title'>⚠️ Incomplete Response</div>
        <div class='notice-text'>
          The backend returned an incomplete answer. The response may be missing actual data or was cut off.
          <br><br>
          <strong>Try:</strong> Rephrasing the question or checking backend logs for errors.
        </div>
      </div>
    ` : ''}
  </div>
</body>
</html>`;
}

function generateIncompleteResponseDashboard(question: string, answer: string): string {
  return `<!DOCTYPE html>
<html lang='en'>
<head>
  <meta charset='UTF-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1.0'>
  <link href='https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' rel='stylesheet'>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0d1117;
      color: #e6edf3;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      padding: 32px;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .error-container {
      background: #161b22;
      border-radius: 12px;
      padding: 48px;
      border: 2px solid #fbbf24;
      text-align: center;
      max-width: 600px;
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #fbbf24;
      margin-bottom: 16px;
    }
    .message {
      font-size: 16px;
      line-height: 1.6;
      color: #8b949e;
      margin-bottom: 24px;
    }
    .question {
      font-size: 14px;
      color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-weight: 500;
    }
    .answer {
      font-size: 14px;
      color: #e6edf3;
      background: rgba(251, 191, 36, 0.1);
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 4px solid #fbbf24;
      text-align: left;
    }
    .suggestion {
      font-size: 13px;
      color: #8b949e;
      margin-top: 24px;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class='error-container'>
    <div class='icon'>⚠️</div>
    <div class='title'>Incomplete Response</div>
    <div class='message'>
      The backend returned an incomplete answer. The response appears to be cut off or missing the actual data.
    </div>
    <div class='question'>
      Your Question: ${question}
    </div>
    <div class='answer'>
      Backend Response: ${answer}
    </div>
    <div class='suggestion'>
      💡 Try asking the question again, or rephrase it for better results.
    </div>
  </div>
</body>
</html>`;
}
