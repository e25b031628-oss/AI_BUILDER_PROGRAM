"use client";

import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { CartContext } from "../../lib/CartContext";

type OrderItem = {
	productId: string;
	name: string;
	price: number;
	quantity: number;
};

type Order = {
	id: string;
	items: OrderItem[];
	totalAmount: number;
	status: string;
	createdAt?: Date | { toDate: () => Date } | null;
};

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(value);
}

function formatOrderDate(value: Order["createdAt"]) {
	if (!value) {
		return "Date unavailable";
	}

	const date = value instanceof Date ? value : value.toDate();

	return new Intl.DateTimeFormat("en-US", {
		dateStyle: "medium",
		timeStyle: "short",
	}).format(date);
}

function statusStyles(status: string) {
	if (status.toLowerCase() === "placed") {
		return "border-emerald-200 bg-emerald-50 text-emerald-700";
	}

	if (status.toLowerCase() === "completed") {
		return "border-cyan-200 bg-cyan-50 text-cyan-700";
	}

	if (status.toLowerCase() === "cancelled") {
		return "border-rose-200 bg-rose-50 text-rose-700";
	}

	return "border-slate-200 bg-slate-100 text-slate-700";
}

export default function OrdersPage() {
	const router = useRouter();
	const cartContext = useContext(CartContext);
	const [uid, setUid] = useState<string | null>(null);
	const [orders, setOrders] = useState<Order[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	if (!cartContext) {
		throw new Error("OrdersPage must be used within a CartProvider");
	}

	const { addToCart } = cartContext;

	const handleReorder = (order: Order) => {
		order.items.forEach((item) => {
			addToCart(
				{
					productId: item.productId,
					name: item.name,
					price: item.price,
				},
				item.quantity,
			);
		});

		router.push("/cart");
	};

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUid(user ? user.uid : null);
		});

		return unsubscribe;
	}, []);

	useEffect(() => {
		let isMounted = true;

		async function fetchOrders() {
			if (uid === null) {
				setOrders([]);
				setLoading(false);
				return;
			}

			setLoading(true);
			setError("");

			try {
				const ordersQuery = query(
					collection(db, "orders"),
					where("userId", "==", uid),
					orderBy("createdAt", "desc"),
				);
				const snapshot = await getDocs(ordersQuery);

				if (!isMounted) {
					return;
				}

				const orderItems = snapshot.docs.map((document) => {
					const data = document.data();

					return {
						id: document.id,
						items: Array.isArray(data.items) ? (data.items as OrderItem[]) : [],
						totalAmount: typeof data.totalAmount === "number" ? data.totalAmount : 0,
						status: typeof data.status === "string" ? data.status : "Unknown",
						createdAt: data.createdAt ?? null,
					};
				});

				setOrders(orderItems);
			} catch (err) {
                console.error("Orders fetch error:", err);
				if (isMounted) {
					setError("Unable to load your orders right now.");
				}
			} finally {
				if (isMounted) {
					setLoading(false);
				}
			}
		}

		fetchOrders();

		return () => {
			isMounted = false;
		};
	}, [uid]);

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-8 space-y-3 text-center">
					<p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
						Smart Cart
					</p>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Order History
					</h1>
					<p className="text-sm leading-6 text-slate-300 sm:text-base">
						View past orders placed by the currently signed-in user.
					</p>
				</div>

				{loading ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
						Loading orders...
					</div>
				) : uid === null ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
						Please log in to view your order history.
					</div>
				) : error ? (
					<div className="rounded-3xl border border-rose-400/30 bg-rose-500/10 p-8 text-center text-sm text-rose-200 shadow-2xl shadow-black/30 backdrop-blur">
						{error}
					</div>
				) : orders.length === 0 ? (
					<div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-sm text-slate-300 shadow-2xl shadow-black/30 backdrop-blur">
						No orders found for your account.
					</div>
				) : (
					<div className="grid gap-6">
						{orders.map((order) => (
							<article
								key={order.id}
								className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur"
							>
								<div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
									<div>
										<p className="text-sm uppercase tracking-[0.2em] text-slate-400">
											Order Date
										</p>
										<p className="mt-1 text-lg font-semibold text-white">
											{formatOrderDate(order.createdAt)}
										</p>
									</div>

									<span
										className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${statusStyles(order.status)}`}
									>
										{order.status}
									</span>
								</div>

								<div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_0.5fr]">
									<div className="space-y-3">
										{order.items.map((item) => (
											<div
												key={item.productId}
												className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm"
											>
												<div>
													<p className="font-medium text-white">{item.name}</p>
													<p className="text-slate-300">Quantity: {item.quantity}</p>
												</div>
												<p className="font-semibold text-cyan-300">
													{formatCurrency(item.price * item.quantity)}
												</p>
											</div>
										))}
									</div>

									<div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
										<p className="text-sm uppercase tracking-[0.2em] text-cyan-200">
											Total
										</p>
										<p className="mt-2 text-2xl font-semibold text-white">
											{formatCurrency(order.totalAmount)}
										</p>
									</div>

									<div className="mt-4 flex justify-end">
										<button
											type="button"
											onClick={() => handleReorder(order)}
											className="rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
										>
											Reorder
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