type OrderConfirmationPageProps = {
	searchParams?: {
		orderId?: string;
	};
};

export default function OrderConfirmationPage({ searchParams }: OrderConfirmationPageProps) {
	const orderId = searchParams?.orderId;

	return (
		<main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 text-slate-900 sm:px-6 lg:px-8">
			<section className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
				<p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
					Order placed
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
					Thank you for your order
				</h1>
				<p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
					Your order has been saved and your cart has been cleared.
				</p>
				{orderId ? (
					<p className="mt-6 rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-700">
						Order ID: {orderId}
					</p>
				) : null}
				<a
					href="/products"
					className="mt-8 inline-flex rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
				>
					Continue Shopping
				</a>
			</section>
		</main>
	);
}
