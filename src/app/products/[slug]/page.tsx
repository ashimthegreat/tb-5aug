import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getProductCategories, getBrands } from "@/lib/data";
import AddToCartButton from "@/components/shop/AddToCartButton";
import QuoteButton from "@/components/shop/QuoteButton";
import ProductCard from "@/components/ProductCard";
import { Icon } from "@/components/icons";
import {
  effectivePrice,
  formatNPR,
  purchaseLabels,
  stockBadge,
  stockLabels,
} from "@/lib/format";

export const dynamicParams = true;

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = products.find((p) => p.slug === slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.summary,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [products, categories, brands] = await Promise.all([
    getProducts(),
    getProductCategories(),
    getBrands(),
  ]);

  const product = products.find((p) => p.slug === slug && p.active);
  if (!product) notFound();

  const category = categories.find((c) => c.id === product.categoryId);
  const brand = brands.find((b) => b.id === product.brand);
  const price = effectivePrice(product);
  const canBuy = product.purchaseType !== "quote" && product.stock !== "out-of-stock";
  const canQuote = product.purchaseType !== "purchase";

  const related = products
    .filter(
      (p) => p.active && p.id !== product.id && p.categoryId === product.categoryId
    )
    .slice(0, 3);

  return (
    <>
      <div className="bg-brand-50/50 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-brand-700">
              Home
            </Link>
            <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
            <Link href="/products" className="hover:text-brand-700">
              Products
            </Link>
            {category && (
              <>
                <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
                <Link
                  href={`/products?cat=${category.id}`}
                  className="hover:text-brand-700"
                >
                  {category.name}
                </Link>
              </>
            )}
            <Icon name="arrow" className="h-3.5 w-3.5 rotate-180" />
            <span className="text-ink">{product.name}</span>
          </nav>
        </div>
      </div>

      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="flex aspect-square items-center justify-center rounded-3xl border border-slate-100 bg-brand-50/40 p-8">
              <Image
                src={product.images[0] ?? "/images/products/placeholder.svg"}
                alt={product.name}
                width={700}
                height={700}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${stockBadge[product.stock]}`}
                >
                  {stockLabels[product.stock]}
                </span>
                {category && (
                  <Link
                    href={`/products?cat=${category.id}`}
                    className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:text-brand-700"
                  >
                    {category.name}
                  </Link>
                )}
              </div>

              <h1 className="mt-4 text-3xl font-bold text-ink sm:text-4xl">
                {product.name}
              </h1>
              {brand && (
                <p className="mt-2 text-sm font-medium text-slate-500">
                  by{" "}
                  <Link
                    href="/brands"
                    className="text-brand-700 hover:underline"
                  >
                    {brand.name}
                  </Link>
                </p>
              )}

              <div className="mt-6 flex items-end gap-3">
                {product.salePrice ? (
                  <>
                    <p className="text-xs text-slate-400 line-through">
                      {formatNPR(product.price)}
                    </p>
                    <p className="text-4xl font-bold text-brand-700">
                      {formatNPR(product.salePrice)}
                    </p>
                  </>
                ) : (
                  <p className="text-4xl font-bold text-ink">{formatNPR(price)}</p>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-400">
                NPR, inclusive of VAT · {purchaseLabels[product.purchaseType]}
              </p>

              <p className="mt-6 text-base leading-relaxed text-slate-600">
                {product.description}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-stretch">
                {canBuy && <AddToCartButton product={product} />}
                {canQuote && <QuoteButton product={product} />}
              </div>

              {product.features.length > 0 && (
                <ul className="mt-8 grid gap-2 sm:grid-cols-2">
                  {product.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {product.specs.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-bold text-ink">Specifications</h2>
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
                <table className="w-full text-left text-sm">
                  <tbody>
                    {product.specs.map((spec, i) => (
                      <tr
                        key={spec.label}
                        className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}
                      >
                        <th className="w-1/3 px-5 py-3.5 font-medium text-slate-500">
                          {spec.label}
                        </th>
                        <td className="px-5 py-3.5 font-medium text-ink">
                          {spec.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div className="mt-14">
              <h2 className="text-2xl font-bold text-ink">
                More in {category?.name ?? "this category"}
              </h2>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
