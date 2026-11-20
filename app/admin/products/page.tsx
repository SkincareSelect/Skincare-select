import { deleteProduct } from "./actions";
import { requireAdmin } from "@/lib/supabase/require-admin";
import SendDealsButton from "./send-deals-button";
import ProductForm from "./product-form";
import { categories } from "@/app/lib/store-data";
import { shoeSizeSystemLabel } from "@/app/lib/shoe-size";

type AdminProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  originalPrice: number | null;
  stock: number;
  badge: string | null;
  image: string | null;
  hidden: boolean;
  size_options: ProductSizeOptions | null;
};

type ProductSizeOptions = {
  type: "apparel" | "footwear";
  system?: "EU" | "US" | "UK";
  available: string[];
};

export default async function Products() {
  const s = await requireAdmin();

  const { data, error } = await s
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("ADMIN PRODUCT LOAD ERROR:", error);
    throw new Error("Products could not be loaded from Supabase.");
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <p className="eyebrow">CATALOGUE</p>
          <h1>Products</h1>
        </div>
        <SendDealsButton />
      </div>

      <details className="panel" style={{ marginBottom: 20 }}>
        <summary>
          <b>+ Add a new product</b>
        </summary>

        <ProductForm categories={categories.map((category) => category.label)} />
      </details>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Available sizes</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {(data ?? []).map((p: AdminProduct) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                  <br />
                  <small>{p.description}</small>

                  <details>
                    <summary>Edit</summary>
                    <ProductForm
                      product={p}
                      categories={categories.map((category) => category.label)}
                    />
                  </details>
                </td>

                <td>{p.category}</td>
                <td>
                  {p.size_options
                    ? `${p.size_options.type === "footwear" ? `${shoeSizeSystemLabel(p.size_options.system) ?? "Shoe"} ` : ""}${p.size_options.available.join(", ")}`
                    : "—"}
                </td>
                <td>K{Number(p.price).toFixed(2)}</td>
                <td>{p.stock}</td>
                <td>{p.hidden ? "Hidden" : "Active"}</td>

                <td>
                  <form action={deleteProduct}>
                    <input type="hidden" name="id" value={p.id} />

                    <button
                      className="btn"
                      style={{
                        background: "#f3dcda",
                        color: "var(--danger)",
                      }}
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}