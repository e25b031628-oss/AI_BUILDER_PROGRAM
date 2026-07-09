type TagProps = {
	label: string;
	variant?: "success" | "warning" | "danger" | "info" | "ai";
};

const variantClasses: Record<NonNullable<TagProps["variant"]>, string> = {
	success: "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30",
	warning: "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30",
	danger: "bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/30",
	info: "bg-slate-700/70 text-cyan-200 ring-1 ring-cyan-400/20",
	ai: "bg-cyan-500/15 text-cyan-200 ring-1 ring-cyan-400/30",
};

export default function Tag({ label, variant = "info" }: TagProps) {
	return (
		<span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium leading-none ${variantClasses[variant]}`}>
			{variant === "ai" ? "✨ " : ""}
			{label}
		</span>
	);
}
