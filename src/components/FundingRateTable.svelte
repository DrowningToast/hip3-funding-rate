<script lang="ts">
	import { untrack } from 'svelte';
	import * as Select from '$lib/components/ui/select/index.js';
	import { ArbitageService } from '../services/ArbitageService';
	import { FilterService } from '../services/FilterService';
	import { SortService } from '../services/SortService';
	import type { ArbitageViewModel, FilterConfiguration } from '../services/ArbitageService';
	import type { SortColumn } from '../services/SortService';

	interface Props {
		/** Raw (unfiltered) arbitrage data from the server */
		data: ArbitageViewModel;
		/** Initial filter configuration parsed down from the server */
		filterConfig: FilterConfiguration;
	}

	let { data, filterConfig: initialConfig }: Props = $props();

	// ── Seed local state from the server-provided initial config ─────────────
	let dexCountGreaterThan = $state(untrack(() => initialConfig.dexCountGreaterThan));
	let dexCountLessThan = $state<number | undefined>(untrack(() => initialConfig.dexCountLessThan));
	let dexFilter = $state<'EXCLUDE' | 'INCLUDE'>(untrack(() => initialConfig.dexFilter));
	// Multi-select: array of selected DEX names (for the dexFilterList)
	let selectedDexes = $state<string[]>(untrack(() => initialConfig.dexFilterList));

	// All unique DEX names found in the raw data → options for the multi-select
	let availableDexes = $derived(
		[...new Set(Object.values(data).flatMap((rates) => Object.keys(rates)))].sort()
	);

	let currentConfig = $derived<FilterConfiguration>({
		dexCountGreaterThan,
		dexCountLessThan,
		dexFilter,
		dexFilterList: selectedDexes,
	});

	// FilterService: created once, updated reactively as config changes
	const filterService = untrack(() => new FilterService(initialConfig));
	// ArbitageService + SortService: pure utility instances for client-side use
	const arbitageService = new ArbitageService();
	const sortService = new SortService({ column: 'spread', direction: 'desc' });
	// Increment to trigger reactive re-sort when SortService state changes
	let sortVersion = $state(0);

	let filteredData = $derived.by(() => {
		filterService.UpdateConfiguration(currentConfig);
		return filterService.Filter(data);
	});

	// DEX columns derived from filtered result
	let dexes = $derived(
		[...new Set(Object.values(filteredData).flatMap((rates) => Object.keys(rates)))].sort()
	);

	// ArbitageService maps ArbitageViewModel → ArbitageRow[] (spread calculation lives in service)
	let rows = $derived(arbitageService.ToRows(filteredData));

	// ── Search (display concern) ──────────────────────────────────────────────
	let search = $state('');
	let visibleRows = $derived(
		rows.filter((r) => r.asset.toLowerCase().includes(search.toLowerCase()))
	);

	// ── Sort (delegated to SortService) ──────────────────────────────────────
	let sortedRows = $derived.by(() => {
		void sortVersion; // reactive dependency — re-runs when sort config changes
		return sortService.Sort(visibleRows);
	});

	// Current sort config snapshot — used for rendering sort icons
	let sortConfig = $derived.by(() => {
		void sortVersion;
		return sortService.GetConfiguration();
	});

	function toggleSort(col: SortColumn) {
		sortService.Toggle(col);
		sortVersion++;
	}

	// ── Formatters ────────────────────────────────────────────────────────────
	function fmt(rate: number): string {
		return (rate * 100).toFixed(4) + '%';
	}

	/** APR = spread × (24h / 8h per period) × 365 days = spread × 1095 */
	function fmtAPR(spread: number): string {
		return (spread * 1095 * 100).toFixed(2) + '%';
	}

	function sortIcon(col: SortColumn): string {
		if (sortConfig.column !== col) return '↕';
		return sortConfig.direction === 'asc' ? '↑' : '↓';
	}

	function rateClass(rate: number): string {
		if (rate > 0) return 'text-green-400';
		if (rate < 0) return 'text-red-400';
		return 'text-slate-400';
	}

	function spreadClass(spread: number): string {
		if (spread > 0.001) return 'text-amber-400 font-semibold';
		if (spread > 0.0001) return 'text-slate-400 font-semibold';
		return 'text-slate-700 font-semibold';
	}

	function aprClass(spread: number): string {
		if (spread > 0.001) return 'text-emerald-400 font-semibold';
		if (spread > 0.0001) return 'text-slate-400 font-semibold';
		return 'text-slate-700 font-semibold';
	}

	// Multi-select trigger label
	let triggerLabel = $derived(
		selectedDexes.length === 0
			? 'All DEXes'
			: selectedDexes.length === 1
				? selectedDexes[0]
				: `${selectedDexes.length} DEXes`
	);
</script>

<!-- ── Filter panel ──────────────────────────────────────────────────────── -->
<div class="mb-5 p-4 bg-slate-950 border border-slate-700 rounded-xl">
	<p class="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Filter</p>
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

		<!-- DEX count > -->
		<label class="flex flex-col gap-1">
			<span class="text-[0.7rem] text-slate-500 uppercase tracking-wide">DEX count &gt;</span>
			<input
				type="number"
				min="0"
				class="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
				bind:value={dexCountGreaterThan}
			/>
		</label>

		<!-- DEX count < -->
		<label class="flex flex-col gap-1">
			<span class="text-[0.7rem] text-slate-500 uppercase tracking-wide">DEX count &lt; (optional)</span>
			<input
				type="number"
				min="0"
				placeholder="—"
				class="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors placeholder:text-slate-700"
				value={dexCountLessThan ?? ''}
				oninput={(e) => {
					const v = (e.target as HTMLInputElement).valueAsNumber;
					dexCountLessThan = isNaN(v) ? undefined : v;
				}}
			/>
		</label>

		<!-- DEX filter mode -->
		<label class="flex flex-col gap-1">
			<span class="text-[0.7rem] text-slate-500 uppercase tracking-wide">DEX filter mode</span>
			<select
				class="bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-sm text-slate-200 outline-none focus:border-blue-500 transition-colors"
				bind:value={dexFilter}
			>
				<option value="EXCLUDE">EXCLUDE</option>
				<option value="INCLUDE">INCLUDE</option>
			</select>
		</label>

		<!-- DEX list — shadcn multi-select -->
		<div class="flex flex-col gap-1">
			<span class="text-[0.7rem] text-slate-500 uppercase tracking-wide">DEX list</span>
			<Select.Root type="multiple" bind:value={selectedDexes}>
				<Select.Trigger class="w-full bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800 data-placeholder:text-slate-600">
					{#snippet children()}
						<span class="truncate">{triggerLabel}</span>
					{/snippet}
				</Select.Trigger>
				<Select.Portal>
					<Select.Content class="bg-slate-900 border-slate-700 text-slate-200">
						<Select.ScrollUpButton />
						<Select.Group>
							<Select.GroupHeading class="text-slate-500">Available DEXes</Select.GroupHeading>
							{#if availableDexes.length === 0}
								<p class="px-3 py-2 text-xs text-slate-500">No DEXes in data</p>
							{:else}
								{#each availableDexes as dex}
									<Select.Item
										value={dex}
										label={dex}
										class="text-slate-200 data-highlighted:bg-slate-800 data-highlighted:text-slate-100"
									/>
								{/each}
							{/if}
						</Select.Group>
						<Select.ScrollDownButton />
					</Select.Content>
				</Select.Portal>
			</Select.Root>
		</div>

	</div>
</div>

<!-- ── Search + count ────────────────────────────────────────────────────── -->
<div class="flex items-center gap-4 mb-3">
	<input
		class="flex-1 max-w-xs bg-slate-900 border border-slate-700 rounded-md text-slate-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors placeholder:text-slate-600"
		type="search"
		placeholder="Search asset…"
		bind:value={search}
	/>
	<span class="text-slate-500 text-xs">
		{sortedRows.length} asset{sortedRows.length !== 1 ? 's' : ''}
	</span>
</div>

<!-- ── Table ──────────────────────────────────────────────────────────────── -->
{#if sortedRows.length === 0}
	<p class="text-center text-slate-500 py-16">No assets match the current filter.</p>
{:else}
	<div class="overflow-x-auto rounded-xl border border-slate-800">
		<table class="w-full text-sm whitespace-nowrap border-collapse">
			<thead class="bg-slate-950">
				<tr>
					<th
						class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors border-b border-slate-800"
						onclick={() => toggleSort('asset')}
					>
						Asset <span class="text-slate-600 inline-block w-3">{sortIcon('asset')}</span>
					</th>
					{#each dexes as dex}
						<th
							class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors border-b border-slate-800"
							onclick={() => toggleSort(dex)}
						>
							{dex} <span class="text-slate-600 inline-block w-3">{sortIcon(dex)}</span>
						</th>
					{/each}
					<th
						class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer select-none hover:text-slate-200 transition-colors border-b border-slate-800"
						onclick={() => toggleSort('spread')}
					>
						Spread <span class="text-slate-600 inline-block w-3">{sortIcon('spread')}</span>
					</th>
					<th
						class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-amber-600 cursor-pointer select-none hover:text-amber-400 transition-colors border-b border-slate-800"
						onclick={() => toggleSort('apr')}
						title="Annualised: spread × 3 periods/day × 365 days"
					>
						APR <span class="text-slate-600 inline-block w-3">{sortIcon('apr')}</span>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each sortedRows as row}
					<tr class="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors last:border-0">
						<td class="px-4 py-2.5 text-left font-semibold text-slate-200 font-mono text-xs">
							{row.asset}
						</td>
						{#each dexes as dex}
							<td class="px-4 py-2.5 text-right font-mono text-xs {row.rates[dex] !== undefined ? rateClass(row.rates[dex]) : 'text-slate-700'}">
								{#if row.rates[dex] !== undefined}
									{fmt(row.rates[dex])}
								{:else}
									—
								{/if}
							</td>
						{/each}
						<td class="px-4 py-2.5 text-right font-mono text-xs {spreadClass(row.spread)}">
							{row.spread > 0 ? fmt(row.spread) : '—'}
						</td>
						<td class="px-4 py-2.5 text-right font-mono text-xs {aprClass(row.spread)}">
							{row.spread > 0 ? fmtAPR(row.spread) : '—'}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
