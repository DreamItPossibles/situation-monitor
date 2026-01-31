<script lang="ts">
	import { Panel, HeatmapCell } from '$lib/components/common';
	import { sectors } from '$lib/stores';
	import { t } from 'svelte-i18n';

	const items = $derived($sectors.items);
	const loading = $derived($sectors.loading);
	const error = $derived($sectors.error);
</script>

<Panel id="heatmap" {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">
			{$t('common.empty_state', { values: { type: $t('panels.heatmap') } })}
		</div>
	{:else}
		<div class="heatmap-grid">
			{#each items as sector (sector.symbol)}
				<HeatmapCell {sector} />
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.heatmap-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.25rem;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}

	@media (max-width: 400px) {
		.heatmap-grid {
			grid-template-columns: repeat(3, 1fr);
		}
	}
</style>
