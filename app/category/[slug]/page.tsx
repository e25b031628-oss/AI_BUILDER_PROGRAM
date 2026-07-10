"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useCart } from "@/lib/CartContext";

type Product = {
	id: string;
	name: string;
	price: number;
	stock: number;
	imageUrl: string;
};

function normalizeKey(value: string) {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFieldValue(data: Record<string, unknown>, candidates: string[]) {
	const normalizedCandidates = candidates.map(normalizeKey);

	for (const [key, value] of Object.entries(data)) {
		if (normalizedCandidates.includes(normalizeKey(key))) {
			return value;
		}
	}

	return undefined;
}

function toNumber(value: unknown) {
	if (typeof value === "number") {
		return Number.isFinite(value) ? value : 0;
	}

	if (typeof value === "string") {
		const parsed = Number(value.replace(/[^0-9.-]/g, ""));
		return Number.isFinite(parsed) ? parsed : 0;
	}

	return 0;
}

function toText(value: unknown) {
	if (typeof value === "string") {
		return value.trim();
	}

	if (typeof value === "number" && Number.isFinite(value)) {
		return String(value);
	}

	return "";
}

async function resolveImageUrl(value: unknown) {
	const rawValue = toText(value);

	if (!rawValue) {
		return "";
	}

	if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
		return rawValue;
	}

	try {
		return await getDownloadURL(ref(storage, rawValue));
	} catch {
		return "";
	}
}

function formatPrice(price: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format(price);
}

function titleCase(value: string) {
	if (!value) {
		return "Category";
	}

	return value
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

export default function CategoryPage() {
	const params = useParams<{ slug?: string | string[] }>();
	const slugValue = params?.slug;
	const slug = useMemo(() => {
		if (Array.isArray(slugValue)) {
			return slugValue[0] ?? "";
		}

		return slugValue ?? "";
	}, [slugValue]);
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { addToCart } = useCart();
	const [quantities, setQuantities] = useState<Record<string, number>>({});

	useEffect(() => {
		let isMounted = true;

		async function fetchCategoryProducts() {
			if (!slug) {
				setProducts([]);
				setLoading(false);
				return;
			}

			try {
				const productsQuery = query(
					collection(db, "products"),
					where("category", "==", slug),
				);
				const snapshot = await getDocs(productsQuery);

				if (!isMounted) {
					return;
				}

				const items = await Promise.all(
					snapshot.docs.map(async (document) => {
						const data = document.data() as Record<string, unknown>;
						const name = toText(
							getFieldValue(data, ["name", "productName", "title", "product"]),
						);
						const price = toNumber(
							getFieldValue(data, ["price", "Price", "amount", "cost"]),
						);
						const stock = toNumber(
							getFieldValue(data, [
								"stock",
								"stock_qty",
								"Stock",
								"quantity",
								"qty",
								"inventory",
							]),
						);
						const imageSource = getFieldValue(data, [
							"imageUrl",
							"image",
							"Image",
							"productImage",
							"photo",
						]);

						return {
							id: document.id,
							name: name || "Unnamed product",
							price,
							stock,
							imageUrl: await resolveImageUrl(imageSource),
						};
					}),
				);

				setProducts(items);
			} catch {
				if (isMounted) {
					setError("Unable to load products for this category right now.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		setLoading(true);
		setError("");
		fetchCategoryProducts();

		return () => {
			isMounted = false;
		};
	}, [slug]);

	return (
		<main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
				<header className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
						Category
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
						{titleCase(slug)}
					</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
						Matching products from Firestore where the category field equals “{slug}”.
					</p>
				</header>

				{loading ? (
					<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
						Loading category products...
					</div>
				) : error ? (
					<div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-10 text-sm text-rose-200 shadow-lg">
						{error}
					</div>
				) : products.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
						No products were found in {titleCase(slug)}. Try a different category.
					</div>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{products.map((product) => (
							<article
								key={product.id}
								className="overflow-hidden rounded-3xl border border-cyan-500/15 bg-slate-900/80 shadow-xl shadow-cyan-950/10 transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/10"
							>
								<div className="aspect-[4/3] bg-slate-800">
									{product.imageUrl ? (
										<div className="h-full w-full overflow-hidden">
											{/* eslint-disable-next-line @next/next/no-img-element */}
											<img
												src={product.imageUrl}
												alt={product.name}
												className="h-full w-full object-cover"
												onError={(event) => {
													event.currentTarget.style.display = "none";
												}}
											/>
										</div>
									) : (
										<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 text-sm font-medium text-slate-400">
											No image available
										</div>
									)}
								</div>

								<div className="flex flex-col gap-4 p-5">
									<div className="space-y-1">
										<h2 className="text-lg font-semibold leading-6 text-white">
											{product.name}
										</h2>
										<p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
											{titleCase(slug)}
										</p>
									</div>

									<div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-300">
										<span>Stock</span>
										<span className="font-semibold text-white">{product.stock}</span>
									</div>

									<div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-sm text-white ring-1 ring-cyan-500/15">
										<span>Price</span>
										<span className="font-semibold text-cyan-300">
											{formatPrice(product.price)}
										</span>
									</div>

									<div className="flex items-center justify-between gap-2">
										<div className="flex items-center gap-2">
											<button
												type="button"
												onClick={() =>
													setQuantities((current) => ({
														...current,
														[product.id]: Math.max(1, (current[product.id] ?? 1) - 1),
													}))
												}
												className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/20 bg-slate-950 text-lg font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
												disabled={(quantities[product.id] ?? 1) <= 1}
												aria-label={`Decrease quantity for ${product.name}`}
											>
												-
											</button>

											<div className="flex h-9 min-w-10 items-center justify-center rounded-full border border-cyan-500/20 bg-slate-950 px-3 text-sm font-semibold text-white">
												{quantities[product.id] ?? 1}
											</div>

											<button
												type="button"
												onClick={() =>
													setQuantities((current) => ({
														...current,
														[product.id]: (current[product.id] ?? 1) + 1,
													}))
												}
												className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/20 bg-slate-950 text-lg font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
												aria-label={`Increase quantity for ${product.name}`}
											>
												+
											</button>
										</div>

										<button
											type="button"
											onClick={() => {
												addToCart(
													{
														productId: product.id,
														name: product.name,
														price: product.price,
													},
													quantities[product.id] ?? 1,
												);
											}}
											className="rounded-2xl bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
										>
											Add to Cart
										</button>
									</div>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
