"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function NavBarShell({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const hideNavbar = pathname === "/login" || pathname === "/signup";

	return (
		<>
			{!hideNavbar ? <Navbar /> : null}
			<div className={!hideNavbar ? "pt-20" : undefined}>{children}</div>
		</>
	);
}
