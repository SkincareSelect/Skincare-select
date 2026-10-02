import Image from "next/image";
import { getProductPhoto } from "@/app/lib/product-image";
import type { Product } from "@/app/lib/types";

/**
 * Renders a product's real photo when one has been uploaded (via the admin
 * dashboard), falling back to the emoji placeholder otherwise so the layout
 * never breaks for products that don't have a photo yet.
 */
export function ProductThumb({
  product,
  className = "",
  emojiClassName = "text-4xl",
  sizes = "(max-width: 768px) 50vw, 25vw",
}: {
  product: Pick<Product, "image" | "images" | "name">;
  className?: string;
  emojiClassName?: string;
  sizes?: string;
}) {
  const photo = getProductPhoto(product);

  if (photo) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={photo}
          alt={product.name}
          fill
          sizes={sizes}
          className="object-cover"
          unoptimized
        />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className={emojiClassName} aria-hidden="true">
        {product.image}
      </span>
    </div>
  );
}
