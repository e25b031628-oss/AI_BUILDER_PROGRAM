"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/lib/CartContext";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format(value);
}

export default function CartPage() {
	const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

	const subtotal = useMemo(
		() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
		[cartItems],
	);

	// Budget Guard state
	const [budget, setBudget] = useState<number | null>(null);
	const [budgetInput, setBudgetInput] = useState<string>("");

	return (
		<main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-5xl">
				<div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
							Checkout
						</p>
						<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
							Your Cart
						</h1>
					</div>

					{cartItems.length > 0 ? (
						<button
							type="button"
							onClick={clearCart}
							className="w-fit rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
						>
							Clear Cart
						</button>
					) : null}
				</div>

				{/* Budget Guard: place above cart items list */}
				<div className="mb-4 rounded-3xl border border-slate-200 bg-slate-900 p-4 text-white shadow-sm">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-sm font-medium text-slate-300">Set a budget</p>
							<div className="mt-2 flex items-center gap-2">
								<input
									type="number"
									inputMode="numeric"
									min={0}
									value={budgetInput}
									onChange={(e) => setBudgetInput(e.target.value)}
									placeholder="e.g. 500"
									className="w-32 rounded-full bg-slate-800/60 px-3 py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
								/>
								<button
									type="button"
									onClick={() => {
										const n = Number(budgetInput);
										setBudget(!Number.isNaN(n) && n > 0 ? n : null);
									}}
									className="rounded-full bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-300"
								>
									Set Budget
								</button>

								{budget !== null && (
									<button
										type="button"
										onClick={() => {
										setBudget(null);
										setBudgetInput("");
									}}
										className="ml-2 rounded-full bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-white/10"
									>
										Clear budget
									</button>
								)}
							</div>
						</div>
					</div>

					{budget !== null && (
						<div className="mt-4">
							<div className="flex items-center justify-between text-sm text-slate-300">
								<div>
									{formatCurrency(subtotal)} of {formatCurrency(budget)} spent
								</div>
								<div>
									{subtotal > budget ? (
										<span className="inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-2 py-1 text-xs font-semibold text-rose-300">
											Over Budget
										</span>
									) : subtotal > 0 && subtotal / budget >= 0.8 ? (
										<span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
											Near Budget
										</span>
									) : null}
								</div>
							</div>

							{/* progress bar */}
							<div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-white/5">
								{(() => {
									const pct = budget ? Math.min(100, (subtotal / budget) * 100) : 0;
									const ratio = budget ? subtotal / budget : 0;
									const barColor =
										ratio > 1 ? "bg-rose-400" : ratio >= 0.8 ? "bg-amber-400" : "bg-cyan-400";
									return (
										<div
											className={`${barColor} h-3 transition-all duration-300`}
											style={{ width: `${pct}%` }}
										/>
									);
								})()}
							</div>

							{budget !== null && subtotal > budget && (
								<p className="mt-3 text-sm text-rose-300">
									You're {formatCurrency(subtotal - budget)} over your budget.
								</p>
								)}
						</div>
					)}
				</div>

				{cartItems.length === 0 ? (
					<div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 shadow-sm">
						Your cart is empty.
					</div>
				) : (
					<div className="grid gap-6">
						{cartItems.map((item) => (
							<article
								key={item.productId}
								className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
							>
								<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
									<div className="space-y-1">
										<h2 className="text-lg font-semibold text-slate-900">{item.name}</h2>
										<p className="text-sm text-slate-500">{formatCurrency(item.price)} each</p>
									</div>

									<div className="flex flex-wrap items-center gap-3">
										<div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50">
											<button
												type="button"
												onClick={() => updateQuantity(item.productId, item.quantity - 1)}
												className="px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
												aria-label={`Decrease quantity for ${item.name}`}
											>
												-
											</button>
											<span className="min-w-12 px-4 py-2 text-center text-sm font-semibold text-slate-900">
												{item.quantity}
											</span>
											<button
												type="button"
												onClick={() => updateQuantity(item.productId, item.quantity + 1)}
												className="px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
												aria-label={`Increase quantity for ${item.name}`}
											>
												+
											</button>
										</div>

										<button
											type="button"
											onClick={() => removeFromCart(item.productId)}
											className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
										>
											Remove
										</button>
									</div>
								</div>
							</article>
						))}

						<div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
							<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
								<div>
									<p className="text-sm uppercase tracking-[0.2em] text-slate-300">
										Subtotal
									</p>
									<p className="mt-1 text-2xl font-semibold">{formatCurrency(subtotal)}</p>
								</div>

								<Link
									href="/checkout"
									className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
								>
									Proceed to Checkout
								</Link>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
