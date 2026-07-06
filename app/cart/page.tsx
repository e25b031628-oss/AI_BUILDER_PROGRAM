"use client";

import { useMemo } from "react";
import { useCart } from "@/lib/CartContext";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(value);
}

export default function CartPage() {
	const { cartItems, removeFromCart, updateQuantity, clearCart } = useCart();

	const subtotal = useMemo(
		() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
		[cartItems],
	);

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
							<div className="flex items-center justify-between gap-4">
								<div>
									<p className="text-sm uppercase tracking-[0.2em] text-slate-300">
										Subtotal
									</p>
									<p className="mt-1 text-2xl font-semibold">{formatCurrency(subtotal)}</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>
		</main>
	);
}
