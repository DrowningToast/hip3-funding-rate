import type { FilterConfiguration } from "./ArbitageService";

export const filterConfig: FilterConfiguration = {
	dexCountGreaterThan: 1,
	dexFilterList: [],
	dexFilter: "EXCLUDE",
};

/**
 * Alias groups for asset search. Keys are human-readable labels; values are the
 * ticker symbols used on Hyperliquid HIP3 DEXes. Matching is bidirectional:
 * searching "S&P500" resolves to US500/SPX/etc., and searching "US500" pulls in
 * all other tickers in that group.
 *
 * Tickers verified against live perpDexs() + metaAndAssetCtxs() on 2026-05-23:
 *   xyz → SP500 | flx → USA500 | km → US500 | abcd → USA500 | cash → USA500
 */
export const assetAliases: Record<string, string[]> = {
	"s&p500": ["SP500", "USA500", "US500"],
	nasdaq: ["USA100", "USTECH", "XYZ100"],
	nikkei: ["JP225", "JPN225"],
	russell: ["SMALL2000", "US2000"],
	mag7: ["MAG7"],
	semis: ["SEMIS", "SEMI"],
	energy: ["USENERGY"],
	"us bond": ["USBOND"],
	gold: ["GOLD", "GOLDJM"],
	silver: ["SILVER", "SILVERJM"],
	oil: ["USOIL", "OIL", "WTI", "BRENTOIL"],
	"natural gas": ["NATGAS", "GAS"],
	vix: ["VIX"],
	dxy: ["DXY"],
	copper: ["COPPER"],
	platinum: ["PLATINUM"],
	palladium: ["PALLADIUM"],
};
