const fs = require("fs");
const path = require("path");
const initSqlJs = require("sql.js");

const dataDir = process.env.VERCEL
  ? "/tmp"
  : path.join(__dirname, "..", "data");
const dbPath = path.join(dataDir, "lumen.db");

let db;

function save() {
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(path.dirname(require.resolve("sql.js")), file)
  });
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const file = fs.readFileSync(dbPath);
    db = new SQL.Database(file);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      visits INTEGER NOT NULL,
      last_visit_days INTEGER NOT NULL,
      pharmacist TEXT NOT NULL,
      monthly_spend REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      monthly_sold INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      amount REAL NOT NULL,
      day INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day INTEGER NOT NULL,
      revenue REAL NOT NULL,
      visits INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      day INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  const staffNames = [
    ["Ana Reyes", "John Kenny Cabansay"],
    ["Miguel Santos", "Thomas Patalinghug"],
    ["Lara Cruz", "Nino Pritz Densing"]
  ];
  staffNames.forEach(([oldName, newName]) => {
    db.run("UPDATE customers SET pharmacist = ? WHERE pharmacist = ?", [newName, oldName]);
  });
  save();

  return db;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function get(sql, params = []) {
  return all(sql, params)[0] || null;
}

function run(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length) stmt.bind(params);
  stmt.step();
  stmt.free();
  save();
}

function count(table) {
  return get(`SELECT COUNT(*) AS n FROM ${table}`).n;
}

module.exports = { getDb, all, get, run, save, count, dbPath };
