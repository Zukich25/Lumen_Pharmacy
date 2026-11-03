const { all, get } = require("./db");

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function mode(values) {
  const tally = {};
  values.forEach((v) => {
    tally[v] = (tally[v] || 0) + 1;
  });
  let best = values[0];
  let max = 0;
  Object.keys(tally).forEach((key) => {
    if (tally[key] > max) {
      max = tally[key];
      best = key;
    }
  });
  return best;
}

function linearRegression(points) {
  const n = points.length;
  const sumX = points.reduce((s, p) => s + p.x, 0);
  const sumY = points.reduce((s, p) => s + p.y, 0);
  const sumXY = points.reduce((s, p) => s + p.x * p.y, 0);
  const sumXX = points.reduce((s, p) => s + p.x * p.x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function movingAverage(values, windowSize) {
  return values.map((_, i) => {
    const start = Math.max(0, i - windowSize + 1);
    const slice = values.slice(start, i + 1);
    return Math.round(average(slice));
  });
}

function expSmoothing(values, alpha) {
  const out = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(alpha * values[i] + (1 - alpha) * out[i - 1]);
  }
  return out.map((n) => Math.round(n));
}

function peso(n) {
  return Math.round(n * 100) / 100;
}

function buildAnalytics() {
  const customers = all("SELECT * FROM customers ORDER BY name");
  const products = all("SELECT * FROM products ORDER BY name");
  const daily = all("SELECT * FROM daily_sales ORDER BY day");
  const transactions = all("SELECT * FROM transactions");
  const inventory = all("SELECT * FROM inventory_logs");

  const visits = customers.map((c) => c.visits);
  const spend = customers.map((c) => c.monthly_spend);
  const revenueSeries = daily.map((d) => d.revenue);
  const points = daily.map((d) => ({ x: d.day, y: d.revenue }));
  const { slope, intercept } = linearRegression(points);

  const forecast = daily.map((d) => ({
    day: d.day,
    actual: d.revenue,
    linear: Math.round(slope * d.day + intercept),
    smoothing: 0,
    moving: 0
  }));
  const smooth = expSmoothing(revenueSeries, 0.35);
  const moving = movingAverage(revenueSeries, 7);
  forecast.forEach((row, i) => {
    row.smoothing = smooth[i];
    row.moving = moving[i];
  });

  const typeGroups = ["Regular", "Senior", "Clinic Partner"].map((type) => {
    const group = customers.filter((c) => c.type === type);
    const avgVisits = average(group.map((c) => c.visits));
    return {
      type,
      count: group.length,
      avgVisits: peso(avgVisits),
      predictedNext: peso(avgVisits * 1.12)
    };
  });

  const categories = {};
  products.forEach((p) => {
    categories[p.category] = (categories[p.category] || 0) + 1;
  });

  const pharmacistLoads = {};
  customers.forEach((c) => {
    pharmacistLoads[c.pharmacist] = (pharmacistLoads[c.pharmacist] || 0) + 1;
  });

  const lowStock = products.filter((p) => p.stock < 15).slice(0, 4);
  const slowMovers = [...products].sort((a, b) => a.monthly_sold - b.monthly_sold).slice(0, 3);
  const atRisk = customers.filter((c) => c.last_visit_days > 25).slice(0, 4);
  const busiest = Object.entries(pharmacistLoads).sort((a, b) => b[1] - a[1])[0] || ["None", 0];

  const totalRevenue = spend.reduce((a, b) => a + b, 0);
  const avgFee = average(spend);
  const avgVisits = average(visits);

  const summary = [
    { category: "Customers", metric: "Total Active Customers", formula: "COUNT(Customers)", result: customers.length },
    { category: "Visits", metric: "Highest Visit Count", formula: "MAX(Visits)", result: visits.length ? Math.max(...visits) : 0 },
    { category: "Visits", metric: "Lowest Visit Count", formula: "MIN(Visits)", result: visits.length ? Math.min(...visits) : 0 },
    { category: "Visits", metric: "Average Visits", formula: "AVERAGE(Visits)", result: peso(avgVisits) },
    { category: "Finance", metric: "Highest Monthly Spend", formula: "MAX(Spend)", result: "₱" + (spend.length ? Math.max(...spend) : 0).toLocaleString() },
    { category: "Finance", metric: "Average Monthly Spend", formula: "AVERAGE(Spend)", result: "₱" + peso(avgFee).toLocaleString() },
    { category: "Finance", metric: "Estimated Monthly Revenue", formula: "SUM(Spend)", result: "₱" + Math.round(totalRevenue).toLocaleString() },
    { category: "Staff", metric: "Most Assigned Pharmacist", formula: "MODE(Pharmacist)", result: mode(customers.map((c) => c.pharmacist)) },
    { category: "Membership", metric: "Most Common Type", formula: "MODE(Type)", result: mode(customers.map((c) => c.type)) },
    { category: "Inventory", metric: "Total SKUs", formula: "COUNT(Products)", result: products.length }
  ];

  const actions = [
    {
      issue: "Low regular visit frequency",
      recommendation: "Launch a refill-reminder promo for Regular customers",
      result: "+10–15% repeat visits"
    },
    {
      issue: "Encourage Senior and Clinic upgrades",
      recommendation: "Offer a 1-week wellness bundle with vitamins",
      result: "2–3 new partner accounts"
    },
    {
      issue: "Retain high-spend customers",
      recommendation: "Start a loyalty stamp card after 8 visits",
      result: "Higher retention"
    },
    {
      issue: "Reduce expiry waste",
      recommendation: "Discount slow-moving vitamins 2 weeks before expiry",
      result: "Lower write-off cost"
    }
  ];

  const alerts = [
    {
      title: "High risk of churn",
      text: `${atRisk.length} customers have not visited in 25+ days. Assign pharmacists for check-in calls.`
    },
    {
      title: "Pharmacist load",
      text: `${busiest[0]} is handling ${busiest[1]} active clients. Consider balancing load to junior staff.`
    }
  ];

  if (lowStock.length) {
    alerts.push({
      title: "Stockout risk",
      text: `${lowStock.map((p) => p.name).join(", ")} are below 15 units. Restock this week.`
    });
  }

  return {
    kpis: {
      totalCustomers: customers.length,
      avgSpend: peso(avgFee),
      avgVisits: peso(avgVisits),
      revenue: Math.round(totalRevenue),
      productCount: products.length,
      transactionCount: transactions.length,
      inventoryLogs: inventory.length,
      dailyRecords: daily.length
    },
    attendanceByCustomer: customers.map((c) => ({ name: c.name, visits: c.visits })),
    pharmacistLoad: Object.entries(pharmacistLoads).map(([name, count]) => ({ name, count })),
    categoryDistribution: Object.entries(categories).map(([name, count]) => ({ name, count })),
    forecast,
    typeGroups,
    summary,
    actions,
    alerts,
    slowMovers: slowMovers.map((p) => p.name),
    counts: {
      customers: customers.length,
      products: products.length,
      transactions: transactions.length,
      dailySales: daily.length,
      inventoryLogs: inventory.length
    }
  };
}

function overview() {
  return get(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM transactions) AS transactions,
      (SELECT COUNT(*) FROM daily_sales) AS dailySales,
      (SELECT COUNT(*) FROM inventory_logs) AS inventoryLogs
  `);
}

module.exports = { buildAnalytics, overview };
