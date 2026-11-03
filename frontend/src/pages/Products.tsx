import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { api } from "../api";
import type { Product } from "../types";

const empty = {
  name: "",
  category: "OTC",
  price: 50,
  stock: 20,
  monthly_sold: 5
};

function Field({
  label,
  hint,
  children
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export default function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [form, setForm] = useState(empty);
  const [editForm, setEditForm] = useState({ price: 0, stock: 0, monthly_sold: 0 });

  async function load() {
    setRows(await api.products());
    setLoading(false);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await api.deleteProduct(pendingDelete.id);
    setPendingDelete(null);
    await load();
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = rows.filter((row) =>
    row.name.toLowerCase().includes(q.toLowerCase())
  );

  async function addProduct(e: FormEvent) {
    e.preventDefault();
    await api.addProduct(form);
    setOpen(false);
    setForm(empty);
    load();
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    await api.updateProduct(editing.id, {
      price: Number(editForm.price),
      stock: Number(editForm.stock),
      monthly_sold: Number(editForm.monthly_sold)
    });
    setEditing(null);
    await load();
  }

  return (
    <>
      <div className="top">
        <div>
          <h1>Products</h1>
          <p>50 SKUs used for inventory, sales, and forecast charts.</p>
        </div>
        <button onClick={() => setOpen(true)}>+ Add Product</button>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search products..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <article className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sold this month</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6}>Loading products...</td>
              </tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>
                  <span className={`pill ${row.category.split(" ")[0]}`}>{row.category}</span>
                </td>
                <td>₱{row.price.toLocaleString()}</td>
                <td>{row.stock}</td>
                <td>{row.monthly_sold}</td>
                <td className="row-actions">
                  <button
                    type="button"
                    className="edit"
                    onClick={() => {
                      setEditing(row);
                      setEditForm({
                        price: row.price,
                        stock: row.stock,
                        monthly_sold: row.monthly_sold
                      });
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => setPendingDelete(row)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>

      {open && (
        <div className="modal-bg" onClick={() => setOpen(false)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={addProduct}>
            <h3>New product</h3>
            <Field label="Product name">
              <input
                placeholder="e.g. Paracetamol 500mg"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </Field>
            <div className="form-grid">
              <Field label="Category">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>OTC</option>
                  <option>Vitamins</option>
                  <option>Antibiotics</option>
                  <option>Prescription</option>
                  <option>Devices</option>
                  <option>First Aid</option>
                </select>
              </Field>
              <Field label="Price (₱)" hint="Selling price per unit">
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  required
                />
              </Field>
              <Field label="Stock" hint="Units currently in the store">
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  required
                />
              </Field>
              <Field label="Sold this month" hint="Units sold in the current month">
                <input
                  type="number"
                  min="0"
                  value={form.monthly_sold}
                  onChange={(e) => setForm({ ...form, monthly_sold: Number(e.target.value) })}
                  required
                />
              </Field>
            </div>
            <button type="submit">Save product</button>
            <button type="button" className="ghost" onClick={() => setOpen(false)}>Cancel</button>
          </form>
        </div>
      )}

      {editing && (
        <div className="modal-bg" onClick={() => setEditing(null)}>
          <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={saveEdit}>
            <h3>Edit {editing.name}</h3>
            <p className="muted">Update price, stock, and units sold this month.</p>
            <Field label="Price (₱)" hint="Selling price per unit">
              <input
                type="number"
                min="0"
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                required
              />
            </Field>
            <Field label="Stock" hint="Units currently in the store">
              <input
                type="number"
                min="0"
                value={editForm.stock}
                onChange={(e) => setEditForm({ ...editForm, stock: Number(e.target.value) })}
                required
              />
            </Field>
            <Field label="Sold this month" hint="Units sold in the current month">
              <input
                type="number"
                min="0"
                value={editForm.monthly_sold}
                onChange={(e) => setEditForm({ ...editForm, monthly_sold: Number(e.target.value) })}
                required
              />
            </Field>
            <button type="submit">Save changes</button>
            <button type="button" className="ghost" onClick={() => setEditing(null)}>Cancel</button>
          </form>
        </div>
      )}

      {pendingDelete && (
        <div className="modal-bg" onClick={() => setPendingDelete(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Delete this product?</h3>
            <p className="muted">
              {pendingDelete.name} will be removed and will not come back.
            </p>
            <div className="confirm-actions">
              <button type="button" onClick={confirmDelete}>Yes, delete</button>
              <button type="button" className="ghost" onClick={() => setPendingDelete(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
