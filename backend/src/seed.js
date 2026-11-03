const { getDb, count, get, run, save } = require("./db");

const firstNames = [
  "Rina", "Quin", "Pio", "Omar", "Nina", "Mark", "Lia", "Kylo", "Jane", "Ivan",
  "Hazel", "George", "Faith", "Enzo", "Dana", "Carlo", "Bella", "Alex", "John", "Mira",
  "Sofia", "Luis", "Kara", "Ben", "Aya", "Noel", "Iris", "Paolo", "Elena", "Gio"
];

const lastNames = [
  "Go", "Alonzo", "Mercado", "Cortez", "Sotto", "Villanueva", "David", "Ramos",
  "Torres", "Cruz", "Yu", "Lim", "Tan", "Lopez", "Dizon", "Reyes", "Santos",
  "Garcia", "Bautista", "Navarro", "Flores", "Chua", "Ocampo", "Dela Cruz"
];

const types = ["Regular", "Senior", "Clinic Partner"];
const pharmacists = ["John Kenny Cabansay", "Thomas Patalinghug", "Nino Pritz Densing"];

const productCatalog = [
  ["Paracetamol 500mg", "OTC", 45],
  ["Ibuprofen 400mg", "OTC", 68],
  ["Cetirizine 10mg", "OTC", 32],
  ["Loperamide 2mg", "OTC", 28],
  ["Oral Rehydration Salts", "OTC", 22],
  ["Multivitamins", "Vitamins", 185],
  ["Vitamin C 500mg", "Vitamins", 95],
  ["Vitamin D3", "Vitamins", 140],
  ["Calcium + Zinc", "Vitamins", 160],
  ["Iron Supplement", "Vitamins", 120],
  ["Amoxicillin 500mg", "Antibiotics", 210],
  ["Cefalexin 500mg", "Antibiotics", 245],
  ["Azithromycin 500mg", "Antibiotics", 320],
  ["Ciprofloxacin 500mg", "Antibiotics", 275],
  ["Metronidazole 500mg", "Antibiotics", 155],
  ["Losartan 50mg", "Prescription", 180],
  ["Metformin 500mg", "Prescription", 95],
  ["Amlodipine 5mg", "Prescription", 88],
  ["Atorvastatin 20mg", "Prescription", 210],
  ["Omeprazole 20mg", "Prescription", 75],
  ["Salbutamol Inhaler", "Prescription", 390],
  ["Insulin Pen Needle", "Prescription", 45],
  ["Blood Pressure Monitor", "Devices", 1450],
  ["Digital Thermometer", "Devices", 280],
  ["Pulse Oximeter", "Devices", 650],
  ["Alcohol 70% 500ml", "First Aid", 85],
  ["Hydrogen Peroxide", "First Aid", 55],
  ["Gauze Pad", "First Aid", 35],
  ["Elastic Bandage", "First Aid", 48],
  ["Adhesive Strips", "First Aid", 42],
  ["Povidone Iodine", "First Aid", 60],
  ["Face Mask Box", "First Aid", 95],
  ["Hand Sanitizer 250ml", "OTC", 78],
  ["Cough Syrup", "OTC", 115],
  ["Nasal Spray", "OTC", 165],
  ["Antacid Tablet", "OTC", 52],
  ["Eye Drops", "OTC", 125],
  ["Skin Ointment", "OTC", 98],
  ["Probiotic Capsule", "Vitamins", 245],
  ["Omega-3", "Vitamins", 310],
  ["Collagen Drink", "Vitamins", 420],
  ["Glucose Strips", "Devices", 890],
  ["Nebulizer Kit", "Devices", 1850],
  ["Wheelchair Cushion", "Devices", 760],
  ["Clopidogrel 75mg", "Prescription", 230],
  ["Levothyroxine 50mcg", "Prescription", 175],
  ["Prednisone 5mg", "Prescription", 90],
  ["Mupirocin Cream", "Prescription", 210],
  ["Hydrocortisone Cream", "OTC", 88],
  ["Sunscreen SPF50", "OTC", 340]
];

function pick(list, i) {
  return list[i % list.length];
}

function rand(min, max, i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  const n = x - Math.floor(x);
  return min + Math.floor(n * (max - min + 1));
}

async function seed() {
  await getDb();

  if (get("SELECT value FROM meta WHERE key = 'seeded'")) {
    console.log("Database already seeded. Deleted rows stay deleted.");
    return;
  }

  if (count("customers") > 0 || count("products") > 0) {
    run("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')");
    console.log("Existing data kept. Sample seed will not run again.");
    return;
  }

  for (let i = 0; i < 60; i++) {
    const name = `${pick(firstNames, i)} ${pick(lastNames, i + 3)}`;
    const type = pick(types, i);
    const visits = rand(2, 28, i + 1);
    const lastVisit = rand(1, 40, i + 7);
    const pharmacist = pick(pharmacists, i + 2);
    const spend = rand(180, 4200, i + 11);
    run(
      "INSERT INTO customers (name, type, visits, last_visit_days, pharmacist, monthly_spend) VALUES (?, ?, ?, ?, ?, ?)",
      [name, type, visits, lastVisit, pharmacist, spend]
    );
  }

  for (let i = 0; i < productCatalog.length; i++) {
    const [name, category, price] = productCatalog[i];
    const stock = rand(4, 180, i + 20);
    const sold = rand(8, 90, i + 33);
    run(
      "INSERT INTO products (name, category, price, stock, monthly_sold) VALUES (?, ?, ?, ?, ?)",
      [name, category, price, stock, sold]
    );
  }

  for (let day = 1; day <= 56; day++) {
    const weekend = day % 7 === 6 || day % 7 === 0;
    const base = weekend ? 9800 : 14500;
    const wave = Math.sin(day / 6) * 1800;
    const noise = rand(-900, 900, day + 40);
    const revenue = Math.max(4200, Math.round(base + wave + noise));
    const visits = rand(weekend ? 18 : 28, weekend ? 36 : 52, day + 9);
    run("INSERT INTO daily_sales (day, revenue, visits) VALUES (?, ?, ?)", [
      day,
      revenue,
      visits
    ]);
  }

  for (let i = 0; i < 150; i++) {
    const customerId = rand(1, 60, i + 2);
    const productId = rand(1, 50, i + 5);
    const qty = rand(1, 4, i + 8);
    const price = productCatalog[(productId - 1) % productCatalog.length][2];
    const amount = qty * price;
    const day = rand(1, 56, i + 14);
    run(
      "INSERT INTO transactions (customer_id, product_id, quantity, amount, day) VALUES (?, ?, ?, ?, ?)",
      [customerId, productId, qty, amount, day]
    );
  }

  const actions = ["Restock", "Adjustment", "Expiry Pull"];
  for (let i = 0; i < 50; i++) {
    const productId = rand(1, 50, i + 21);
    const action = pick(actions, i);
    const qty = rand(2, 40, i + 18);
    const day = rand(1, 56, i + 4);
    run(
      "INSERT INTO inventory_logs (product_id, action, quantity, day) VALUES (?, ?, ?, ?)",
      [productId, action, qty, day]
    );
  }

  run("INSERT OR REPLACE INTO meta (key, value) VALUES ('seeded', '1')");
  save();
  console.log("Seed complete:");
  console.log("  customers       =", count("customers"));
  console.log("  products        =", count("products"));
  console.log("  transactions    =", count("transactions"));
  console.log("  daily_sales     =", count("daily_sales"));
  console.log("  inventory_logs  =", count("inventory_logs"));
}

if (require.main === module) {
  seed().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { seed };
