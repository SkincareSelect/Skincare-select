import { deleteProduct, saveProduct } from "./actions";
import ProductImageUpload from "@/components/ProductImageUpload";
import { requireAdmin } from "@/lib/supabase/require-admin";
import SendDealsButton from "./send-deals-button";

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
};

export default async function Products() {
  const s = await requireAdmin();

  const { data = [] } = await s
    .from("products")
    .select("*")
    .order("createdAt", { ascending: false });

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

        <ProductForm />
      </details>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {(data || []).map((p: AdminProduct) => (
              <tr key={p.id}>
                <td>
                  <b>{p.name}</b>
                  <br />
                  <small>{p.description}</small>

                  <details>
                    <summary>Edit</summary>
                    <ProductForm product={p} />
                  </details>
                </td>

                <td>{p.category}</td>
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

function ProductForm({ product }: { product?: AdminProduct }) {
  return (
    <form
      action={saveProduct}
      className="admin-form"
      style={{ marginTop: 15 }}
    >
      <input type="hidden" name="id" value={product?.id || ""} />

      <label>
        Name
        <input
          name="name"
          defaultValue={product?.name}
          required
        />
      </label>

      <label>
        Description
        <textarea
          name="description"
          defaultValue={product?.description ?? ""}
        />
      </label>

      <div className="form-grid">
        <label>
          Category
          <select
            name="category"
            defaultValue={product?.category || "Face Care"}
          >
            <option>Face Care</option>
            <option>Body Care</option>
            <option>Hair Care</option>
            <option>Men&apos;s Grooming</option>
            <option>Apparel and footwear</option>
            <option>Fragrances</option>
            <option>Accessories</option>
            <option>Baby Care</option>
          </select>
        </label>

        <label>
          Price
          <input
            name="price"
            type="number"
            step=".01"
            min="0"
            defaultValue={product?.price}
            required
          />
        </label>

        <label>
          Old price
          <input
            name="originalPrice"
            type="number"
            step=".01"
            min="0"
            defaultValue={product?.originalPrice ?? ""}
          />
        </label>

        <label>
          Stock
          <input
            name="stock"
            type="number"
            min="0"
            defaultValue={product?.stock || 0}
            required
          />
        </label>

        <label>
          Badge
          <input
            name="badge"
            defaultValue={product?.badge ?? ""}
          />
        </label>
      </div>

      <ProductImageUpload
        defaultValue={product?.image || ""}
      />

      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <input
          style={{ width: "auto" }}
          type="checkbox"
          name="hidden"
          defaultChecked={!product?.hidden}
        />

        Visible in store
      </label>

      <button className="btn btn-primary">
        Save product
      </button>
    </form>
  );
}