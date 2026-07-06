"use client";

import { FormEvent, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { CartContext } from "../../lib/CartContext";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(value);
}

export default function CheckoutPage() {
	const router = useRouter();
	const cartContext = useContext(CartContext);
	const [uid, setUid] = useState<string | null>(null);
	const [fullName, setFullName] = useState("");
	const [address, setAddress] = useState("");
	const [phoneNumber, setPhoneNumber] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	if (!cartContext) {
		throw new Error("CheckoutPage must be used within a CartProvider");
	}

	const { cartItems, clearCart } = cartContext;

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			setUid(user ? user.uid : null);
		});

		return unsubscribe;
	}, []);

	const subtotal = useMemo(
		() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
		[cartItems],
	);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setMessage("");

		if (!uid) {
			setMessage("Please log in before checking out.");
			return;
		}

		if (cartItems.length === 0) {
			setMessage("Your cart is empty.");
			return;
		}

		setLoading(true);

		try {
			await addDoc(collection(db, "orders"), {
				userId: uid,
				items: cartItems,
				totalAmount: subtotal,
				status: "Placed",
				createdAt: new Date(),
				fullName,
				address,
				phoneNumber,
			});

			clearCart();
			setMessage("Order placed successfully.");
			await new Promise((resolve) => setTimeout(resolve, 700));
			router.push("/orders");
		} catch {
			setMessage("Unable to place the order right now.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 py-12 text-slate-100 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-6xl">
				<div className="mb-8 space-y-3 text-center">
					<p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
						Smart Cart
					</p>
					<h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
						Checkout
					</h1>
					<p className="text-sm leading-6 text-slate-300 sm:text-base">
						Complete your delivery details and place your grocery order.
					</p>
				</div>

				<div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
					<form
						onSubmit={handleSubmit}
						className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur"
					>
						<div className="space-y-5">
							<div className="space-y-2">
								<label htmlFor="fullName" className="text-sm font-medium text-slate-200">
									Full Name
								</label>
								<input
									id="fullName"
									type="text"
									value={fullName}
									onChange={(event) => setFullName(event.target.value)}
									required
									className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
									placeholder="Your full name"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="address" className="text-sm font-medium text-slate-200">
									Address
								</label>
								<textarea
									id="address"
									value={address}
									onChange={(event) => setAddress(event.target.value)}
									required
									rows={4}
									className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
									placeholder="Street, city, state, postal code"
								/>
							</div>

							<div className="space-y-2">
								<label htmlFor="phoneNumber" className="text-sm font-medium text-slate-200">
									Phone Number
								</label>
								<input
									id="phoneNumber"
									type="tel"
									value={phoneNumber}
									onChange={(event) => setPhoneNumber(event.target.value)}
									required
									className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
									placeholder="Your phone number"
								/>
							</div>

							{message ? (
								<p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
									{message}
								</p>
							) : null}

							<button
								type="submit"
								disabled={loading}
								className="flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{loading ? "Saving order..." : "Place Order"}
							</button>
						</div>
					</form>

					<aside className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
						<div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
							<div>
								<p className="text-sm uppercase tracking-[0.2em] text-slate-300">
									Subtotal
								</p>
								<p className="mt-1 text-3xl font-semibold text-white">
									{formatCurrency(subtotal)}
								</p>
							</div>
						</div>

						<div className="mt-6 space-y-4">
							{cartItems.length === 0 ? (
								<p className="text-sm leading-6 text-slate-300">Your cart is empty.</p>
							) : (
								cartItems.map((item) => (
									<div
										key={item.productId}
										className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm"
									>
										<div>
											<p className="font-medium text-white">{item.name}</p>
											<p className="text-slate-300">Qty: {item.quantity}</p>
										</div>
										<p className="font-semibold text-cyan-300">
											{formatCurrency(item.price * item.quantity)}
										</p>
									</div>
								))
							)}
						</div>
					</aside>
				</div>
			</div>
		</main>
	);
}
