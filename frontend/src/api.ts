import type { Analytics, CaseStudy, Customer, Product } from "./types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const text = await res.text();
  if (!res.ok) throw new Error(text || "Request failed");
  return (text ? JSON.parse(text) : {}) as T;
}

export const api = {
  analytics: () => request<Analytics>("/api/analytics"),
  caseStudy: () => request<CaseStudy>("/api/case-study"),
  customers: () => request<Customer[]>("/api/customers"),
  addCustomer: (body: Omit<Customer, "id">) =>
    request("/api/customers", { method: "POST", body: JSON.stringify(body) }),
  deleteCustomer: (id: number) => request(`/api/customers/${id}`, { method: "DELETE" }),
  products: () => request<Product[]>("/api/products"),
  addProduct: (body: Omit<Product, "id">) =>
    request("/api/products", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: number, body: Pick<Product, "price" | "stock" | "monthly_sold">) =>
    request(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: number) => request(`/api/products/${id}`, { method: "DELETE" })
};
