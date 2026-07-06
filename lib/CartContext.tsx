"use client";

import { createContext, useEffect, useContext, useMemo, useState } from "react";

export type CartItem = {
	productId: string;
	name: string;
	price: number;
	quantity: number;
};

type CartContextValue = {
	cartItems: CartItem[];
	addToCart: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
	removeFromCart: (productId: string) => void;
	updateQuantity: (productId: string, quantity: number) => void;
	clearCart: () => void;
};

export const CartContext = createContext<CartContextValue | undefined>(undefined);

const CART_STORAGE_KEY = "smart-cart-items";

function loadCartItems() {
	if (typeof window === "undefined") {
		return [] as CartItem[];
	}

	try {
		const storedValue = window.localStorage.getItem(CART_STORAGE_KEY);
		if (!storedValue) {
			return [] as CartItem[];
		}

		const parsedValue = JSON.parse(storedValue) as CartItem[];
		return Array.isArray(parsedValue) ? parsedValue : [];
	} catch {
		return [] as CartItem[];
	}
}

export function CartProvider({ children }: { children: React.ReactNode }) {
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isHydrated, setIsHydrated] = useState(false);

	useEffect(() => {
		setCartItems(loadCartItems());
		setIsHydrated(true);
	}, []);

	useEffect(() => {
		if (!isHydrated) {
			return;
		}

		window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
	}, [cartItems, isHydrated]);

	const addToCart = (item: Omit<CartItem, "quantity">, quantity = 1) => {
		setCartItems((currentItems) => {
			const existingItem = currentItems.find(
				(cartItem) => cartItem.productId === item.productId,
			);

			if (existingItem) {
				return currentItems.map((cartItem) =>
					cartItem.productId === item.productId
						? {
							...cartItem,
							quantity: cartItem.quantity + quantity,
						}
						: cartItem,
				);
			}

			return [...currentItems, { ...item, quantity }];
		});
	};

	const removeFromCart = (productId: string) => {
		setCartItems((currentItems) =>
			currentItems.filter((cartItem) => cartItem.productId !== productId),
		);
	};

	const updateQuantity = (productId: string, quantity: number) => {
		if (quantity <= 0) {
			removeFromCart(productId);
			return;
		}

		setCartItems((currentItems) =>
			currentItems.map((cartItem) =>
				cartItem.productId === productId ? { ...cartItem, quantity } : cartItem,
			),
		);
	};

	const clearCart = () => {
		setCartItems([]);
	};

	const value = useMemo(
		() => ({
			cartItems,
			addToCart,
			removeFromCart,
			updateQuantity,
			clearCart,
		}),
		[cartItems],
	);

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
	const context = useContext(CartContext);

	if (!context) {
		throw new Error("useCart must be used within a CartProvider");
	}

	return context;
}
