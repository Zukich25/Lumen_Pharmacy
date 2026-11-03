import { useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import type { Customer } from "../types";

const empty = {
  name: "",
  type: "Regular",
  visits: 1,
  last_visit_days: 1,
  pharmacist: "John Kenny Cabansay",
  monthly_spend: 500
};

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("All");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(empty);

  async function load() {
    setRows(await api.customers());
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((row) => {
    const matchName = row.name.toLowerCase().includes(q.toLowerCase());
    const matchTier = tier === "All" || row.type === tier;
    return matchName && matchTier;
  });

  async function addCustomer(e: FormEvent) {
    e.preventDefault();
    await api.addCustomer(form);
    setOpen(false);
    setForm(empty);
    load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Customers</h1>
          <p>Interactive customer records used in the BA model.</p>
        </div>
        <button onClick={() => setOpen(true)}>+ Add Customer</button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search customers..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option>All</option>
          <option>Regular</option>
          <option>Senior</option>
          <option>PWD</option>
        </select>
      </div>

      <article className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Last visit</th>
              <th>Pharmacist</th>
              <th>Monthly spend</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={`pill ${row.type.split(" ")[0]}`}>{row.type}</span>
                </td>
                <td>{row.last_visit_days} days</td>
                <td>{row.pharmacist}</td>
                <td>₱{row.monthly_spend.toLocaleString()}</td>
                <td className="row-actions">
                  <button onClick={async () => {
                    await api.deleteCustomer(row.id);
                    load();
                  }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={addCustomer}>
            <h3>New customer</h3>
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <div className="form-grid">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option>Regular</option>
                <option>Senior</option>
                <option>PWD</option>
              </select>
              <select
                value={form.pharmacist}
                onChange={(e) => setForm({ ...form, pharmacist: e.target.value })}
              >
                <option>John Kenny Cabansay</option>
                <option>Thomas Patalinghug</option>
                <option>Nino Pritz Densing</option>
              </select>
              <input
                type="number"
                placeholder="Visits"
                value={form.visits}
                onChange={(e) => setForm({ ...form, visits: Number(e.target.value) })}
              />
              <input
                type="number"
                placeholder="Monthly spend"
                value={form.monthly_spend}
                onChange={(e) => setForm({ ...form, monthly_spend: Number(e.target.value) })}
              />
            </div>
            <button type="submit">Save customer</button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
          </form>
        </div>
      )}
    </>
  );
}
