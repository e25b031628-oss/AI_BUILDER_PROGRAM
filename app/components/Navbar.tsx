"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { CartContext } from "@/lib/CartContext";

export default function Navbar() {
	const cartContext = useContext(CartContext);
	const [user, setUser] = useState<User | null>(null);
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
			setUser(currentUser);
		});

		return unsubscribe;
	}, []);

	const cartItemCount = useMemo(() => {
		return cartContext?.cartItems.reduce((total, item) => total + item.quantity, 0) ?? 0;
	}, [cartContext]);

	const handleLogout = async () => {
		try {
			await signOut(auth);
			router.push("/get-started");
		} catch {
			// Ignore sign-out errors for now; the UI will still reflect the current auth state.
		}
	};

	return (
		<header className="fixed inset-x-0 top-0 z-50 border-b border-cyan-500/15 bg-slate-950/90 backdrop-blur-xl">
			<div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="inline-flex items-center rounded-full border border-cyan-400/20 bg-slate-900/80 px-4 py-2 text-sm font-semibold tracking-wide text-white transition hover:border-cyan-300/40 hover:text-cyan-300"
				>
					Smart Cart
				</Link>

				<div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
					<nav className="flex items-center gap-2 sm:gap-3">
						<Link
							href="/"
							className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-cyan-300"
						>
							Home
						</Link>
						<Link
							href="/cart"
							className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-cyan-300"
						>
							<span>Cart</span>
							<span className="inline-flex min-w-6 items-center justify-center rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-semibold text-slate-950">
								{cartItemCount}
							</span>
						</Link>
						<Link
							href="/orders"
							className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-cyan-300"
						>
							Orders
						</Link>
						<Link
							href="/profile"
							className="rounded-full px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/5 hover:text-cyan-300"
						>
							Profile
						</Link>
					</nav>

					<div className="h-6 w-px bg-white/10" />

					{user ? (
						<div className="flex items-center gap-2 sm:gap-3">
							<span className="hidden rounded-full border border-cyan-500/20 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 sm:inline-flex">
								{user.email ?? "Signed in"}
							</span>
							<button
								type="button"
								onClick={handleLogout}
								className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
							>
								Logout
							</button>
						</div>
					) : (
						<div className="flex items-center gap-2 sm:gap-3">
							<Link
								href="/login"
								className="rounded-full border border-cyan-500/20 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-300"
							>
								Login
							</Link>
							<Link
								href="/signup"
								className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
							>
								Sign Up
							</Link>
						</div>
					)}
				</div>
			</div>
		</header>
	);
}
