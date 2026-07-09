"use client";

import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";
import { useCart } from "@/lib/CartContext";
import Tag from "./components/Tag";

type Product = {
	id: string;
	name: string;
	category: string;
	price: number;
	stock: number;
	imageUrl: string;
	tags: string[];
	ecoHealthTag: string | null;
};

type RecipeToCartResult = {
	matched: Array<{ ingredient: string; productName: string }>;
	unmatched: string[];
	fallback: boolean;
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

function slugifyCategory(value: string) {
	return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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

export default function Home() {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [authChecked, setAuthChecked] = useState(false);
	const [searchText, setSearchText] = useState("");
	const [activeSearchText, setActiveSearchText] = useState("");
	const [searchLoading, setSearchLoading] = useState(false);
	const [fallbackSearch, setFallbackSearch] = useState(false);
	const [matchedProductNames, setMatchedProductNames] = useState<string[]>([]);
	const [quantities, setQuantities] = useState<Record<string, number>>({});
	const [recipeDishName, setRecipeDishName] = useState("");
	const [recipeLoading, setRecipeLoading] = useState(false);
	const [recipeResult, setRecipeResult] = useState<RecipeToCartResult | null>(null);
	const [addedRecipeProductNames, setAddedRecipeProductNames] = useState<string[]>([]);
	const router = useRouter();
	const { addToCart } = useCart();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (!user) {
				router.push("/get-started");
				return;
			}

			setAuthChecked(true);
		});

		return unsubscribe;
	}, [router]);

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
						const data = document.data() as Record<string, unknown>;
						const name = toText(
							getFieldValue(data, ["name", "productName", "title", "product"]),
						);
						const category = toText(getFieldValue(data, ["category", "Category"]))
							.toLowerCase()
							.trim();
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
						const rawTags = getFieldValue(data, ["tags", "Tags"]);
						const tags = Array.isArray(rawTags)
							? rawTags.filter((tag): tag is string => typeof tag === "string")
							: [];
						const rawEcoHealthTag = getFieldValue(data, [
							"ecoHealthTag",
							"ecoHealth",
							"EcoHealthTag",
						]);
						const ecoHealthTag =
							typeof rawEcoHealthTag === "string" ? rawEcoHealthTag : null;

						return {
							id: document.id,
							name: name || "Unnamed product",
							category: category || "uncategorized",
							price,
							stock,
							imageUrl: await resolveImageUrl(imageSource),
							tags,
							ecoHealthTag,
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

	const categories = useMemo(() => {
		const values = new Map<string, string>();

		for (const product of products) {
			const slug = slugifyCategory(product.category);

			if (slug && !values.has(slug)) {
				values.set(slug, product.category);
			}
		}

		return Array.from(values.entries()).map(([slug, label]) => ({
			slug,
			label: titleCase(label || slug),
		}));
	}, [products]);

	const groupedProducts = useMemo(() => {
		const groups = new Map<
			string,
			{ slug: string; label: string; products: Product[] }
		>();

		for (const product of products) {
			const slug = slugifyCategory(product.category) || "uncategorized";
			const label = titleCase(product.category || slug);
			const existingGroup = groups.get(slug);

			if (existingGroup) {
				existingGroup.products.push(product);
				continue;
			}

			groups.set(slug, {
				slug,
				label,
				products: [product],
			});
		}

		return Array.from(groups.values());
	}, [products]);

	const filteredGroupedProducts = useMemo(() => {
		if (!activeSearchText.trim()) {
			return groupedProducts;
		}

		if (fallbackSearch) {
			const keyword = activeSearchText.toLowerCase();

			return groupedProducts
				.map((group) => ({
					...group,
					products: group.products.filter((product) =>
						product.name.toLowerCase().includes(keyword),
					),
				}))
				.filter((group) => group.products.length > 0);
		}

		if (matchedProductNames.length > 0) {
			const matchedLookup = new Set(
				matchedProductNames.map((productName) => productName.toLowerCase()),
			);

			return groupedProducts
				.map((group) => ({
					...group,
					products: group.products.filter((product) =>
						matchedLookup.has(product.name.toLowerCase()),
					),
				}))
				.filter((group) => group.products.length > 0);
		}

		return groupedProducts;
	}, [activeSearchText, fallbackSearch, groupedProducts, matchedProductNames]);

	const handleSearchSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const query = searchText.trim();

		if (!query) {
			return;
		}

		setSearchLoading(true);
		setActiveSearchText(query);
		setFallbackSearch(false);
		setMatchedProductNames([]);

		try {
			const response = await fetch("/api/ai/smart-search", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					query,
					productNames: products.map((product) => product.name),
				}),
			});

			const data = (await response.json()) as {
				matchedProducts?: unknown;
				fallback?: boolean;
			};

			const returnedProducts = Array.isArray(data.matchedProducts)
				? data.matchedProducts.filter(
					(productName): productName is string => typeof productName === "string",
				)
				: [];

			if (!data.fallback && returnedProducts.length > 0) {
				setFallbackSearch(false);
				setMatchedProductNames(returnedProducts);
				document.getElementById("products-section")?.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
				return;
			}
		} catch {
			// Fall back to keyword search below.
		} finally {
			setSearchLoading(false);
		}

		setFallbackSearch(true);
		setMatchedProductNames([]);
		document.getElementById("products-section")?.scrollIntoView({
			behavior: "smooth",
			block: "start",
		});
	};

	const clearSearch = () => {
		setSearchText("");
		setActiveSearchText("");
		setFallbackSearch(false);
		setMatchedProductNames([]);
	};

	const handleRecipeSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		const dishName = recipeDishName.trim();

		if (!dishName) {
			return;
		}

		setRecipeLoading(true);
		setRecipeResult(null);

		try {
			const response = await fetch("/api/ai/recipe-to-cart", {
				method: "POST",
				headers: {
					"content-type": "application/json",
				},
				body: JSON.stringify({
					dishName,
					productNames: products.map((product) => product.name),
				}),
			});

			const data = (await response.json()) as {
				matched?: unknown;
				unmatched?: unknown;
				fallback?: boolean;
			};

			const matched = Array.isArray(data.matched)
				? data.matched.filter(
						(item): item is { ingredient: string; productName: string } =>
							typeof item === "object" &&
							item !== null &&
							typeof (item as { ingredient?: unknown }).ingredient === "string" &&
							typeof (item as { productName?: unknown }).productName === "string",
					)
				: [];

			const unmatched = Array.isArray(data.unmatched)
				? data.unmatched.filter((item): item is string => typeof item === "string")
				: [];

			if (data.fallback || (matched.length === 0 && unmatched.length === 0)) {
				setRecipeResult({ matched: [], unmatched: [], fallback: true });
				return;
			}

			setRecipeResult({ matched, unmatched, fallback: false });
		} catch {
			setRecipeResult({ matched: [], unmatched: [], fallback: true });
		} finally {
			setRecipeLoading(false);
		}
	};

	const handleAddRecipeProduct = (productName: string) => {
		const product = products.find(
			(item) => item.name.toLowerCase() === productName.toLowerCase(),
		);

		if (!product) {
			return;
		}

		addToCart(
			{
				productId: product.id,
				name: product.name,
				price: product.price,
			},
			1,
		);

		setAddedRecipeProductNames((current) => {
			if (current.includes(product.name.toLowerCase())) {
				return current;
			}

			return [...current, product.name.toLowerCase()];
		});
	};

	const handleAddAllRecipeProducts = () => {
		if (!recipeResult?.matched) {
			return;
		}

		const matchedProducts = recipeResult.matched
			.map((item) =>
				products.find((product) => product.name.toLowerCase() === item.productName.toLowerCase()),
			)
			.filter((product): product is Product => Boolean(product));

		matchedProducts.forEach((product) => {
			addToCart(
				{
					productId: product.id,
					name: product.name,
					price: product.price,
				},
				1,
			);
		});

		setAddedRecipeProductNames((current) => {
			const next = new Set(current);

			matchedProducts.forEach((product) => {
				next.add(product.name.toLowerCase());
			});

			return Array.from(next);
		});
	};

	if (!authChecked) {
		return (
			<main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
				<div className="rounded-3xl border border-cyan-500/20 bg-slate-900/80 px-6 py-4 text-sm text-slate-300 shadow-xl shadow-cyan-950/10">
					Checking your session...
				</div>
			</main>
		);
	}

	return (
		<main className="min-h-screen bg-slate-950 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
				<header className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
					<p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
						Smart Cart
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
						Fresh categories, fast shopping.
					</h1>
					<p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
						Browse products by category or explore the full catalog below. Category
						tiles link directly to the matching Firestore-backed category pages.
					</p>
				</header>

				<section className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-5 shadow-xl shadow-cyan-950/10 sm:p-6">
					<form onSubmit={handleSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
						<div className="flex-1 space-y-2">
							<label htmlFor="smart-search" className="text-sm font-medium text-slate-200">
								Search products or categories
							</label>
							<input
								id="smart-search"
								type="text"
								value={searchText}
								onChange={(event) => setSearchText(event.target.value)}
								placeholder="What are you looking for? (e.g. quick breakfast stuff)"
								className="w-full rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
							/>
						</div>

						<div className="flex items-end gap-3">
							<button
								type="submit"
								disabled={searchLoading}
								className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{searchLoading ? "Searching..." : "Search"}
							</button>

							{activeSearchText ? (
								<button
									type="button"
									onClick={clearSearch}
									className="inline-flex items-center justify-center rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
								>
									Clear search
								</button>
							) : null}
						</div>
					</form>
				</section>

				<section className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-5 shadow-xl shadow-cyan-950/10 sm:p-6">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div>
							<div className="flex items-center gap-2">
								<h2 className="text-xl font-semibold text-white">Cook something?</h2>
								<span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
									✨ Powered by AI
								</span>
							</div>
							<p className="mt-1 text-sm text-slate-400">
								Tell us a dish and we’ll suggest ingredients you can add to your cart.
							</p>
						</div>
					</div>

					<form onSubmit={handleRecipeSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
						<input
							id="recipe-to-cart"
							type="text"
							value={recipeDishName}
							onChange={(event) => setRecipeDishName(event.target.value)}
							placeholder="What are you cooking? (e.g. paneer butter masala)"
							className="flex-1 rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
						/>

						<button
							type="submit"
							disabled={recipeLoading}
							className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{recipeLoading ? "Finding..." : "Find Ingredients"}
						</button>
					</form>

					{recipeResult ? (
						<div className="mt-5 space-y-4">
							{recipeResult.fallback || (recipeResult.matched.length === 0 && recipeResult.unmatched.length === 0) ? (
								<div className="rounded-2xl border border-cyan-500/15 bg-slate-950/70 p-4 text-sm text-slate-300">
									Couldn't find a recipe for that — try a different dish.
								</div>
							) : (
								<>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
												Recipe matches
											</p>
											<p className="mt-1 text-sm text-slate-400">
												Add ingredients to your cart in one go.
											</p>
										</div>
										<button
											type="button"
											onClick={handleAddAllRecipeProducts}
											className="rounded-2xl border border-cyan-500/20 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
										>
											Add All to Cart
										</button>
									</div>

									<div className="space-y-3">
										{recipeResult.matched.map((item) => {
											const product = products.find(
												(productItem) => productItem.name.toLowerCase() === item.productName.toLowerCase(),
											);

											if (!product) {
												return null;
											}

											const added = addedRecipeProductNames.includes(product.name.toLowerCase());

											return (
												<div
													key={`${item.ingredient}-${item.productName}`}
													className="flex flex-col gap-3 rounded-2xl border border-cyan-500/15 bg-slate-950/70 p-4 sm:flex-row sm:items-center sm:justify-between"
												>
													<div className="space-y-1">
														<div className="flex flex-wrap items-center gap-2">
															<span className="text-sm font-semibold text-white">{item.ingredient}</span>
															<span className="text-cyan-300">→</span>
															<span className="text-sm text-cyan-200">{item.productName}</span>
														</div>
														<p className="text-sm text-slate-400">{formatPrice(product.price)}</p>
													</div>

													<div className="flex items-center gap-3">
														{added ? (
															<span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
																✓ Recipe Match
															</span>
														) : (
															<button
																type="button"
																onClick={() => handleAddRecipeProduct(item.productName)}
																className="rounded-2xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
															>
																Add
															</button>
														)}
													</div>
												</div>
											);
										})}
									</div>

									{recipeResult.unmatched.length > 0 ? (
										<div className="rounded-2xl border border-dashed border-cyan-500/20 bg-slate-950/60 p-4">
											<p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300/70">
												Not available in our store:
											</p>
											<p className="mt-2 text-sm text-slate-400">{recipeResult.unmatched.join(", ")}</p>
										</div>
									) : null}
								</>
							)}
						</div>
					) : null}
				</section>

				<section className="space-y-4">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
								Categories
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-white">
								Shop by aisle
							</h2>
						</div>
						<p className="text-sm text-slate-400">
							{loading ? "Loading categories..." : `${categories.length} categories`}
						</p>
					</div>

					{categories.length > 0 ? (
						<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
							{categories.map((category) => (
								<Link
									key={category.slug}
									href={`/category/${category.slug}`}
									className="group rounded-3xl border border-cyan-500/15 bg-slate-900/80 p-5 shadow-lg shadow-cyan-950/10 transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/10"
								>
									<div className="flex h-full flex-col justify-between gap-6">
										<div className="space-y-2">
											<p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
												Category
											</p>
											<h3 className="text-xl font-semibold text-white transition group-hover:text-cyan-300">
												{category.label}
											</h3>
										</div>
										<div className="flex items-center justify-between text-sm text-slate-400">
											<span>View products</span>
											<span className="rounded-full border border-cyan-500/20 px-3 py-1 text-cyan-300 transition group-hover:border-cyan-400/40">
												Open
											</span>
										</div>
									</div>
								</Link>
							))}
						</div>
					) : loading ? (
						<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
							Loading category tiles...
						</div>
					) : error ? (
						<div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-10 text-sm text-rose-200 shadow-lg">
							{error}
						</div>
					) : (
						<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
							No categories were found in Firestore yet.
						</div>
					)}
				</section>

				<section id="products-section" className="space-y-8">
					<div className="flex items-end justify-between gap-4">
						<div>
							<p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
								Products
							</p>
							<h2 className="mt-2 text-2xl font-semibold text-white">
								Browse by category
							</h2>
						</div>
						<p className="text-sm text-slate-400">
							{loading ? "Loading catalog..." : `${products.length} items`}
						</p>
					</div>

					{loading ? (
						<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
							Loading products...
						</div>
					) : error ? (
						<div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-10 text-sm text-rose-200 shadow-lg">
							{error}
						</div>
					) : filteredGroupedProducts.length === 0 ? (
						<div className="rounded-3xl border border-dashed border-cyan-500/25 bg-slate-900/60 p-10 text-sm text-slate-300 shadow-lg">
							{activeSearchText
								? "No matching products were found for this search."
								: "No products found in Firestore."}
						</div>
					) : (
						<div className="space-y-10">
							{filteredGroupedProducts.map((group) => (
								<section key={group.slug} className="space-y-4">
									<div className="flex items-end justify-between gap-4">
										<div>
											<p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300/70">
												Category
											</p>
											<h3 className="mt-2 text-2xl font-semibold text-white">
												{group.label}
											</h3>
										</div>
										<p className="text-sm text-slate-400">
											{group.products.length} products
										</p>
									</div>

									<div className="-mx-1 overflow-x-auto pb-2">
										<div className="flex gap-4 px-1">
											{group.products.map((product) => (
												<article
													key={product.id}
													className="w-[18rem] shrink-0 overflow-hidden rounded-3xl border border-cyan-500/15 bg-slate-900/80 shadow-xl shadow-cyan-950/10 transition-transform duration-200 hover:-translate-y-1 hover:border-cyan-400/30 hover:shadow-cyan-500/10"
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
															<h4 className="text-lg font-semibold leading-6 text-white">
																{product.name}
															</h4>
															<p className="text-xs uppercase tracking-[0.25em] text-cyan-300/70">
																{group.label}
															</p>
														</div>

														{product.tags.length > 0 || product.ecoHealthTag ? (
										<div className="flex flex-wrap gap-2">
											{product.tags.map((tag) => (
												<Tag key={tag} label={tag} variant="info" />
											))}
											{product.ecoHealthTag ? (
												<Tag label={product.ecoHealthTag} variant="success" />
											) : null}
										</div>
									) : null}

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
												</article>
											))}
										</div>
									</div>
								</section>
							))}
						</div>
					)}
				</section>
			</div>
		</main>
	);
}