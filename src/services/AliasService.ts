export class AliasService {
	private readonly groups: string[][];

	constructor(aliases: Record<string, string[]>) {
		this.groups = Object.entries(aliases).map(([key, values]) => [
			key.toLowerCase(),
			...values.map((v) => v.toLowerCase()),
		]);
	}

	resolveTerms(search: string): string[] {
		const lower = search.toLowerCase().trim();
		if (!lower) return [];

		const terms = new Set<string>([lower]);

		for (const group of this.groups) {
			if (group.some((t) => t.includes(lower) || lower.includes(t))) {
				group.forEach((t) => terms.add(t));
			}
		}

		return [...terms];
	}
}
