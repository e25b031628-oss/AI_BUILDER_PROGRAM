"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { CartContext } from "../../lib/CartContext";

function formatCurrency(value: number) {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
	}).format(value);
}

export default function CheckoutPage() {
	const router = useRouter();
	const cartContext = useContext(CartContext);
	const [uid, setUid] = useState<string | null>(null);
	const [profile, setProfile] = useState({
		displayName: "",
		phone: "",
		address: "",
		avatarSeed: "",
	});
	const [profileLoading, setProfileLoading] = useState(true);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	if (!cartContext) {
		throw new Error("CheckoutPage must be used within a CartProvider");
	}

	const { cartItems, clearCart } = cartContext;

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, async (user) => {
			setUid(user ? user.uid : null);
			setProfileLoading(true);
			if (user) {
				try {
					const docRef = doc(db, "users", user.uid);
					const snap = await getDoc(docRef);
					if (snap.exists()) {
						const data = snap.data() as any;
						setProfile({
							displayName: data.displayName ?? "",
							phone: data.phone ?? "",
							address: data.address ?? "",
							avatarSeed: data.avatarSeed ?? "",
						});
					} else {
						setProfile({ displayName: "", phone: "", address: "", avatarSeed: "" });
					}
				} catch (err) {
					console.error(err);
				}
			} else {
				setProfile({ displayName: "", phone: "", address: "", avatarSeed: "" });
			}
			setProfileLoading(false);
		});

		return unsubscribe;
	}, []);

	const subtotal = useMemo(
		() => cartItems.reduce((total, item) => total + item.price * item.quantity, 0),
		[cartItems],
	);

	const handlePlaceOrder = async () => {
		setMessage("");

		if (!uid) {
			setMessage("Please log in before checking out.");
			return;
		}

		if (cartItems.length === 0) {
			setMessage("Your cart is empty.");
			return;
		}

		// ensure profile is complete
		if (!profile.displayName || !profile.address || !profile.phone) {
			setMessage("Please complete your profile before checking out.");
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
				deliveryName: profile.displayName,
				deliveryAddress: profile.address,
				deliveryPhone: profile.phone,
			});

			clearCart();
			setMessage("Order placed successfully.");
			await new Promise((resolve) => setTimeout(resolve, 700));
			router.push("/orders");
		} catch (err) {
			console.error(err);
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
					<div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
						{profileLoading ? (
							<p className="text-slate-300">Loading profile...</p>
						) : profile.displayName && profile.address && profile.phone ? (
							<div className="space-y-4">
								<div className="rounded-2xl bg-slate-950/40 px-4 py-3">
									<p className="text-sm text-slate-300">Delivering to</p>
									<p className="mt-1 text-lg font-semibold text-white">{profile.displayName}</p>
									<p className="text-slate-300">{profile.address}</p>
									<p className="text-slate-300">{profile.phone}</p>
									<Link href="/profile" className="mt-3 inline-block text-sm text-cyan-300 hover:underline">
										Edit
									</Link>
								</div>

								{message ? (
									<p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
										{message}
									</p>
								) : null}

								<button
									onClick={handlePlaceOrder}
									disabled={loading}
									className="mt-2 flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
								>
									{loading ? "Placing order..." : "Place Order"}
								</button>
							</div>
						) : (
							<div className="space-y-4">
								<div className="rounded-2xl bg-slate-950/40 px-4 py-6 text-center">
									<p className="text-sm text-slate-300">Please complete your profile before checking out.</p>
									<Link
										href="/profile"
										className="mt-3 inline-flex items-center justify-center rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
									>
										Complete Profile
									</Link>
								</div>
								{message ? (
									<p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
										{message}
									</p>
								) : null}
							</div>
						)}
					</div>

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
