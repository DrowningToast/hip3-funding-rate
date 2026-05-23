// @ts-check
import { defineConfig } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";
import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
	output: "server",
	adapter: vercel({
		isr: {
			// Revalidate every 5 minutes — keeps funding rates fresh without
			// hitting the Hyperliquid API on every request.
			expiration: 60 * 5,
		},
	}),
	integrations: [svelte()],
	vite: {
		plugins: [tailwindcss()],
	},
});
