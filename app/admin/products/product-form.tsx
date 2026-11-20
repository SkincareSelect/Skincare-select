"use client";

import { useActionState } from "react";
import ProductImageUpload from "@/components/ProductImageUpload";
import type { ProductCategory } from "@/app/lib/types";
import { saveProduct, type ProductSaveState } from "./actions";

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

const initialState: ProductSaveState = { status: "idle", message: "" };

export default function ProductForm({
  product,
  categories,
}: {
  product?: AdminProduct;
  categories: ProductCategory[];
}) {
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  return (
    <form action={formAction} className="admin-form" style={{ marginTop: 15 }}>
      <input type="hidden" name="id" value={product?.id || ""} />

      <label>
        Name
        <input name="name" defaultValue={product?.name} required />
      </label>

      <label>
        Description
        <textarea name="description" defaultValue={product?.description ?? ""} />
      </label>

      <div className="form-grid">
        <label>
          Category
          <select name="category" defaultValue={product?.category || "Face Care"}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
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
          <input name="badge" defaultValue={product?.badge ?? ""} />
        </label>
      </div>

      <fieldset className="panel">
        <legend>Apparel and footwear sizes</legend>
        <div className="form-grid">
          <label>
            Item type
            <select name="sizeType" defaultValue={product?.size_options?.type ?? ""}>
              <option value="">No size selection</option>
              <option value="apparel">Apparel</option>
              <option value="footwear">Footwear</option>
            </select>
          </label>
          <label>
            Shoe size system
            <select name="sizeSystem" defaultValue={product?.size_options?.system ?? "EU"}>
              <option value="EU">EU (Europe)</option>
              <option value="US">US (USA)</option>
              <option value="UK">UK</option>
            </select>
          </label>
          <label>
            Available sizes
            <input
              name="availableSizes"
              defaultValue={product?.size_options?.available.join(", ") ?? ""}
              placeholder={product?.size_options?.type === "footwear" ? "e.g. 38, 39, 40, 41" : "e.g. S, M, L, XL"}
            />
          </label>
        </div>
        <p style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
          Use comma-separated sizes. Apparel uses XS, S, M, L, XL, or XXL. For footwear, choose EU (Europe), UK, or US (USA) and enter numeric sizes only (for example, 37, 38, 39). This applies to the Apparel and footwear category.
        </p>
      </fieldset>

      <ProductImageUpload defaultValue={product?.image || ""} />

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          style={{ width: "auto" }}
          type="checkbox"
          name="visible"
          defaultChecked={!product?.hidden}
        />
        Visible in store
      </label>

      <button className="btn btn-primary" disabled={pending}>
        {pending ? "Saving..." : "Save product"}
      </button>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          style={{ color: state.status === "success" ? "#166534" : "var(--danger)" }}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
