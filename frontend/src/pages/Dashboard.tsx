import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { api } from "../api";
import type { Analytics, CaseStudy } from "../types";

export default function Dashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [study, setStudy] = useState<CaseStudy | null>(null);

  useEffect(() => {
    api.analytics().then(setData);
    api.caseStudy().then(setStudy);
  }, []);

  if (!data || !study) return <p>Loading analytics...</p>;

  const visitBars = data.attendanceByCustomer.slice(0, 18);

  return (
    <>
      <div className="top">
        <div>
          <h1>Business Overview</h1>
          <p>Welcome back. Lumen Pharmacy case study dashboard.</p>
        </div>
        <span className="badge">SQLite Database</span>
      </div>

      <div className="grid process">
        {study.process.map((step) => (
          <article className="step" key={step.step}>
            <b>{step.step}</b>
            <h3>{step.question}</h3>
            <p>{step.work}</p>
          </article>
        ))}
      </div>

      {data.kpis.totalCustomers === 0 && (
        <article className="card waiting">
          <h2>Waiting for customers</h2>
          <p>The customer list is empty. Add a customer to see the dashboard again.</p>
        </article>
      )}

      {data.kpis.totalCustomers > 0 && (
      <>
      <div className="grid kpis">
        <article className="card kpi">
          <div className="label">Total Customers</div>
          <div className="value">{data.kpis.totalCustomers}</div>
          <div className="hint">Active accounts</div>
        </article>
        <article className="card kpi">
          <div className="label">Avg. Monthly Spend</div>
          <div className="value">₱{data.kpis.avgSpend.toLocaleString()}</div>
          <div className="hint">Per customer</div>
        </article>
        <article className="card kpi">
          <div className="label">Avg. Visits</div>
          <div className="value">{data.kpis.avgVisits}</div>
          <div className="hint">Visits / month</div>
        </article>
        <article className="card kpi">
          <div className="label">Est. Revenue</div>
          <div className="value">₱{data.kpis.revenue.toLocaleString()}</div>
          <div className="hint">Current month</div>
        </article>
      </div>

      <h2 className="section-title" style={{ marginTop: 22 }}>Descriptive Analytics</h2>
      <div className="grid two">
        <article className="card">
          <h3>Visits per Customer</h3>
          <p>Individual customer visit frequency</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={visitBars}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visits" fill="#4f7cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <h3>Pharmacist vs Customer Count</h3>
          <p>Client distribution across staff</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data.pharmacistLoad}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#7c6cff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <h3>Statistical Summary</h3>
        <table>
          <thead>
            <tr>
              <th>CATEGORY</th>
              <th>METRIC</th>
              <th>FORMULA / DESC</th>
              <th>RESULT</th>
            </tr>
          </thead>
          <tbody>
            {data.summary.map((row) => (
              <tr key={row.metric}>
                <td>{row.category}</td>
                <td>{row.metric}</td>
                <td>{row.formula}</td>
                <td><b>{row.result}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      <h2 className="section-title" style={{ marginTop: 22 }}>Predictive Analytics</h2>
      <div className="grid two">
        <article className="card">
          <h3>Revenue Forecasting</h3>
          <p>Actual vs Linear Regression, Exponential Smoothing, and Moving Average</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={data.forecast}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="actual" stroke="#2563eb" dot={false} />
                <Line type="monotone" dataKey="smoothing" stroke="#f59e0b" dot={false} />
                <Line type="monotone" dataKey="linear" stroke="#ef4444" strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="moving" stroke="#22c55e" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="card">
          <h3>Product Mix</h3>
          <p>Volume by category</p>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <BarChart data={data.categoryDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="card" style={{ marginTop: 16 }}>
        <h3>Visit Prediction by Customer Type</h3>
        <p>Next-month forecast from current averages × 12% growth</p>
        <div className="grid two">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Average Visits</th>
                <th>Predicted Next Month</th>
              </tr>
            </thead>
            <tbody>
              {data.typeGroups.map((row) => (
                <tr key={row.type}>
                  <td>{row.type}</td>
                  <td>{row.avgVisits}</td>
                  <td><b>{row.predictedNext}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="chart-wrap">
            <ResponsiveContainer>
              <LineChart data={data.typeGroups}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line dataKey="avgVisits" stroke="#3b82f6" />
                <Line dataKey="predictedNext" stroke="#ef4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </article>

      <div className="dark-panel" style={{ marginTop: 18 }}>
        <h2>Prescriptive Analytics</h2>
        <p>Automated insights based on current metrics</p>
        <h3>Strategic Action Plan</h3>
        <table>
          <thead>
            <tr>
              <th>ISSUE / GOAL</th>
              <th>RECOMMENDATION</th>
              <th>EXPECTED RESULT</th>
            </tr>
          </thead>
          <tbody>
            {data.actions.map((row) => (
              <tr key={row.issue}>
                <td>{row.issue}</td>
                <td>{row.recommendation}</td>
                <td className="good">{row.result}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="alerts">
          {data.alerts.map((alert, i) => (
            <div className={`alert ${i === 0 ? "warn" : "gold"}`} key={alert.title}>
              <b>{alert.title}</b>
              <p>{alert.text}</p>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </>
  );
}
