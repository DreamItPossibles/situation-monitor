<script lang="ts">
	import { Panel, NewsItem } from '$lib/components/common';
	import { cnNews } from '$lib/stores';
	import { t } from 'svelte-i18n';

	const items = $derived($cnNews.items);
	const loading = $derived($cnNews.loading);
	const error = $derived($cnNews.error);
	const count = $derived(items.length);
</script>

<Panel id="chinese-api" title="中文渠道 API (Chinese News API)" {count} {loading} {error}>
	{#if items.length === 0 && !loading && !error}
		<div class="empty-state">{$t('common.no_news')}</div>
	{:else}
		<div class="news-list">
			{#each items as item (item.id)}
				<NewsItem {item} />
			{/each}
		</div>
	{/if}
</Panel>

<style>
	.news-list {
		display: flex;
		flex-direction: column;
	}

	.empty-state {
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.7rem;
		padding: 1rem;
	}
</style>
