"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
} from "firebase/auth";
import auth from "../../lib/firebase";

type TabMode = "login" | "signup";

export default function GetStartedPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [activeTab, setActiveTab] = useState<TabMode>("login");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState("");

	useEffect(() => {
		const nextMessage = searchParams.get("message");
		if (nextMessage) {
			setMessage(decodeURIComponent(nextMessage));
		}
	}, [searchParams]);

	const handleTabChange = (tab: TabMode) => {
		setActiveTab(tab);
		setMessage("");
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		setMessage("");

		try {
			if (activeTab === "login") {
				await signInWithEmailAndPassword(auth, email, password);
				setMessage("Logged in successfully.");
			} else {
				await createUserWithEmailAndPassword(auth, email, password);
				setMessage("Account created successfully.");
			}

			setEmail("");
			setPassword("");
			router.push("/");
		} catch (error) {
			setMessage(
				error instanceof Error
					? error.message
					: activeTab === "login"
						? "Failed to log in."
						: "Failed to create account."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-4 text-slate-100">
			<section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
				<div className="mb-6 grid grid-cols-2 rounded-2xl border border-white/10 bg-slate-950/60 p-1">
					<button
						type="button"
						onClick={() => handleTabChange("login")}
						className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
							activeTab === "login"
								? "bg-cyan-400 text-slate-950"
								: "text-slate-300 hover:text-slate-100"
						}`}
					>
						Login
					</button>
					<button
						type="button"
						onClick={() => handleTabChange("signup")}
						className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
							activeTab === "signup"
								? "bg-cyan-400 text-slate-950"
								: "text-slate-300 hover:text-slate-100"
						}`}
					>
						Sign Up
					</button>
				</div>

				<div className="mb-8 space-y-2 text-center">
					<p className="text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
						Smart Cart
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">
						Welcome to Smart Cart
					</h1>
					<p className="text-sm leading-6 text-slate-300">
						Log in or create an account to start shopping.
					</p>
				</div>

				<form onSubmit={handleSubmit} className="space-y-5">
					<div className="space-y-2">
						<label htmlFor="email" className="text-sm font-medium text-slate-200">
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(event) => setEmail(event.target.value)}
							required
							className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
							placeholder="you@example.com"
						/>
					</div>

					<div className="space-y-2">
						<label htmlFor="password" className="text-sm font-medium text-slate-200">
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(event) => setPassword(event.target.value)}
							required
							minLength={6}
							className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
							placeholder={activeTab === "login" ? "Your password" : "At least 6 characters"}
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
					>
						{loading
							? activeTab === "login"
								? "Logging in..."
								: "Creating account..."
							: activeTab === "login"
								? "Log in"
								: "Sign up"}
					</button>
				</form>

				{message ? (
					<p className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
						{message}
					</p>
				) : null}
			</section>
		</main>
	);
}