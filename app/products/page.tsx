"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import { useCart } from "@/lib/CartContext";

type Product = {
	id: string;
	name: string;
	stock: number;
	price: number;
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
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(price);
}

export default function ProductsPage() {
	const [products, setProducts] = useState<Product[]>([]);
	const [searchText, setSearchText] = useState("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const { addToCart } = useCart();

	const filteredProducts = products.filter((product) =>
		product.name.toLowerCase().includes(searchText.toLowerCase()),
	);

	useEffect(() => {
		let isMounted = true;

		async function fetchProducts() {
			try {
				const snapshot = await getDocs(collection(db, "products"));

				if (!isMounted) {
					return;
				}

				const items = await Promise.all(
					snapshot.docs.map(async (document) => {
						const data = document.data();
						const name = toText(
							getFieldValue(data, ["name", "productName", "title", "product"]),
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
						const price = toNumber(
							getFieldValue(data, ["price", "Price", "amount", "cost"]),
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
							stock,
							price,
							imageUrl: await resolveImageUrl(imageSource),
						};
					}),
				);

				setProducts(items);
			} catch {
				if (isMounted) {
					setError("Unable to load products right now.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		fetchProducts();

		return () => {
			isMounted = false;
		};
	}, []);

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
				<header className="flex flex-col gap-3">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
						Inventory
					</p>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Products
					</h1>
					<p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
						All documents from the Firestore products collection are shown here as
						a responsive card grid.
					</p>
				</header>

				<div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
					<label htmlFor="product-search" className="mb-2 block text-sm font-medium text-slate-700">
						Search products
					</label>
					<input
						id="product-search"
						type="search"
						value={searchText}
						onChange={(event) => setSearchText(event.target.value)}
						placeholder="Search by product name"
						className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:bg-white"
					/>
				</div>

				{loading ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-sm text-slate-500 shadow-sm">
						Loading products...
					</div>
				) : error ? (
					<div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-sm text-rose-700 shadow-sm">
						{error}
					</div>
				) : products.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-sm text-slate-500 shadow-sm">
						No products found in Firestore.
					</div>
				) : filteredProducts.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-sm text-slate-500 shadow-sm">
						No products match your search.
					</div>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{filteredProducts.map((product) => (
							<article
								key={product.id}
								className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
							>
								<div className="aspect-[4/3] bg-slate-100">
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
										<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-200 to-slate-100 text-sm font-medium text-slate-500">
											No image available
										</div>
									)}
								</div>

								<div className="flex flex-col gap-4 p-5">
									<div className="space-y-1">
										<h2 className="text-lg font-semibold leading-6 text-slate-900">
											{product.name}
										</h2>
									</div>

									<div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
										<span>Stock</span>
										<span className="font-semibold text-slate-900">{product.stock}</span>
									</div>

									<div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white">
										<span>Price</span>
										<span className="font-semibold">{formatPrice(product.price)}</span>
									</div>

									<button
										type="button"
										onClick={() =>
											addToCart({
												productId: product.id,
												name: product.name,
												price: product.price,
											}, 1)
										}
										className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
									>
										Add to Cart
									</button>
								</div>
							</article>
						))}
					</div>
				)}
			</div>
		</main>
	);
}
