export type Customer = {
  id: number;
  name: string;
  type: string;
  visits: number;
  last_visit_days: number;
  pharmacist: string;
  monthly_spend: number;
};

export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  monthly_sold: number;
};

export type Analytics = {
  kpis: {
    totalCustomers: number;
    avgSpend: number;
    avgVisits: number;
    revenue: number;
    productCount: number;
    transactionCount: number;
    inventoryLogs: number;
    dailyRecords: number;
  };
  attendanceByCustomer: { name: string; visits: number }[];
  pharmacistLoad: { name: string; count: number }[];
  categoryDistribution: { name: string; count: number }[];
  forecast: {
    day: number;
    actual: number;
    linear: number;
    smoothing: number;
    moving: number;
  }[];
  typeGroups: {
    type: string;
    count: number;
    avgVisits: number;
    predictedNext: number;
  }[];
  summary: {
    category: string;
    metric: string;
    formula: string;
    result: string | number;
  }[];
  actions: { issue: string; recommendation: string; result: string }[];
  alerts: { title: string; text: string }[];
  counts: {
    customers: number;
    products: number;
    transactions: number;
    dailySales: number;
    inventoryLogs: number;
  };
};

export type CaseStudy = {
  company: string;
  title: string;
  problem: string;
  variables: string[];
  process: { step: string; question: string; work: string }[];
};
