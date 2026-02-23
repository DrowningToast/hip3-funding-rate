import type { InfoClient } from "@nktkas/hyperliquid";

export interface IDexService {
	GetDexes(): Promise<string[]>;
}

export class DexService implements IDexService {
	constructor(private readonly hlInfo: InfoClient) {}

	async GetDexes(): Promise<string[]> {
		const dexesResponse = await this.hlInfo.perpDexs();
		return dexesResponse.filter((r) => !!r).map((res) => res.name);
	}
}
