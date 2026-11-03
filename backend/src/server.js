const express = require("express");
const cors = require("cors");
const { getDb, all, run } = require("./db");
const { buildAnalytics, overview } = require("./analytics");
const { seed } = require("./seed");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let ready;
function ensureReady() {
  if (!ready) {
    ready = (async () => {
      await getDb();
      const { get } = require("./db");
      if (!get("SELECT value FROM meta WHERE key = 'seeded'")) {
        await seed();
      }
    })();
  }
  return ready;
}

app.use(async (_req, _res, next) => {
  try {
    await ensureReady();
    next();
  } catch (err) {
    next(err);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/overview", (_req, res) => {
  res.json(overview());
});

app.get("/api/analytics", (_req, res) => {
  res.json(buildAnalytics());
});

app.get("/api/customers", (_req, res) => {
  res.json(all("SELECT * FROM customers ORDER BY name"));
});

app.post("/api/customers", (req, res) => {
  const { name, type, visits, last_visit_days, pharmacist, monthly_spend } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Name and type are required." });
  }
  run(
    "INSERT INTO customers (name, type, visits, last_visit_days, pharmacist, monthly_spend) VALUES (?, ?, ?, ?, ?, ?)",
    [
      name,
      type,
      Number(visits) || 0,
      Number(last_visit_days) || 0,
      pharmacist || "John Kenny Cabansay",
      Number(monthly_spend) || 0
    ]
  );
  res.json({ ok: true });
});

app.put("/api/customers/:id", (req, res) => {
  const { name, type, visits, last_visit_days, pharmacist, monthly_spend } = req.body;
  run(
    "UPDATE customers SET name=?, type=?, visits=?, last_visit_days=?, pharmacist=?, monthly_spend=? WHERE id=?",
    [name, type, visits, last_visit_days, pharmacist, monthly_spend, Number(req.params.id)]
  );
  res.json({ ok: true });
});

app.delete("/api/customers/:id", (req, res) => {
  run("DELETE FROM customers WHERE id=?", [Number(req.params.id)]);
  res.json({ ok: true });
});

app.get("/api/products", (_req, res) => {
  res.json(all("SELECT * FROM products ORDER BY category, name"));
});

app.post("/api/products", (req, res) => {
  const { name, category, price, stock, monthly_sold } = req.body;
  if (!name || !category) {
    return res.status(400).json({ error: "Name and category are required." });
  }
  run(
    "INSERT INTO products (name, category, price, stock, monthly_sold) VALUES (?, ?, ?, ?, ?)",
    [name, category, Number(price) || 0, Number(stock) || 0, Number(monthly_sold) || 0]
  );
  res.json({ ok: true });
});

app.put("/api/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const { price, stock, monthly_sold } = req.body;
  run(
    "UPDATE products SET price=?, stock=?, monthly_sold=? WHERE id=?",
    [Number(price) || 0, Number(stock) || 0, Number(monthly_sold) || 0, id]
  );
  res.json({ ok: true });
});

app.delete("/api/products/:id", (req, res) => {
  run("DELETE FROM products WHERE id=?", [Number(req.params.id)]);
  res.json({ ok: true });
});

app.get("/api/case-study", (_req, res) => {
  res.json({
    company: "Lumen Pharmacy",
    title: "Inventory waste vs missed sales",
    problem:
      "Lumen Pharmacy wants the best restocking and promotion plan so popular medicines stay in stock, slow items do not expire on the shelf, and monthly revenue still grows.",
    variables: [
      "Customers (60 records)",
      "Products (50 records)",
      "Transactions (150 records)",
      "Daily sales (56 records)",
      "Inventory logs (50 records)"
    ],
    process: [
      {
        step: "Descriptive",
        question: "What happened?",
        work: "Count customers, chart visits, summarize spend, stock, and category mix."
      },
      {
        step: "Predictive",
        question: "What is likely next?",
        work: "Forecast revenue with linear regression, exponential smoothing, and a 7-day moving average. Project next-month visits by customer type."
      },
      {
        step: "Prescriptive",
        question: "What should we do?",
        work: "Turn those numbers into actions: refill reminders, loyalty cards, restock alerts, and pharmacist load balancing."
      }
    ]
  });
});

if (require.main === module) {
  ensureReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Lumen Pharmacy API running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = app;
