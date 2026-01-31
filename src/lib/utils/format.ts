/**
 * Formatting utilities
 */

/**
 * Format relative time from a date
 */
export function timeAgo(dateInput: string | number | Date, locale = 'en-US'): string {
	const date = new Date(dateInput);
	const now = new Date();
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

	if (seconds < 60) return locale.startsWith('zh') ? '刚刚' : 'just now';
	if (seconds < 3600) return Math.floor(seconds / 60) + (locale.startsWith('zh') ? '分钟前' : 'm');
	if (seconds < 86400)
		return Math.floor(seconds / 3600) + (locale.startsWith('zh') ? '小时前' : 'h');
	return Math.floor(seconds / 86400) + (locale.startsWith('zh') ? '天前' : 'd');
}

/**
 * Get relative time with more detail
 */
export function getRelativeTime(dateInput: string | number | Date, locale = 'en-US'): string {
	const date = new Date(dateInput);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const hours = Math.floor(diff / (1000 * 60 * 60));
	const days = Math.floor(hours / 24);

	if (hours < 1) return locale.startsWith('zh') ? '刚刚' : 'Just now';
	if (hours < 24) return locale.startsWith('zh') ? `${hours}小时前` : `${hours}h ago`;
	if (days < 7) return locale.startsWith('zh') ? `${days}天前` : `${days}d ago`;
	return date.toLocaleDateString(locale);
}

/**
 * Format currency value
 */
export function formatCurrency(
	value: number,
	options: { decimals?: number; compact?: boolean; symbol?: string; locale?: string } = {}
): string {
	const { decimals = 2, compact = false, symbol = '$', locale = 'en-US' } = options;

	if (compact) {
		if (Math.abs(value) >= 1e12) return symbol + (value / 1e12).toFixed(1) + 'T';
		if (Math.abs(value) >= 1e9) return symbol + (value / 1e9).toFixed(1) + 'B';
		if (Math.abs(value) >= 1e6) return symbol + (value / 1e6).toFixed(1) + 'M';
		if (Math.abs(value) >= 1e3) return symbol + (value / 1e3).toFixed(0) + 'K';
	}

	return symbol + value.toLocaleString(locale, { maximumFractionDigits: decimals });
}

/**
 * Format number with compact notation
 */
export function formatNumber(value: number, decimals = 2, locale = 'en-US'): string {
	const isZh = locale.startsWith('zh');

	if (Math.abs(value) >= 1e9) return (value / 1e9).toFixed(1) + (isZh ? '十亿' : 'B');
	if (Math.abs(value) >= 1e6) return (value / 1e6).toFixed(1) + (isZh ? '百万' : 'M');
	if (Math.abs(value) >= 1e3) return (value / 1e3).toFixed(1) + (isZh ? '千' : 'K');
	return value.toFixed(decimals);
}

/**
 * Format percent change with sign
 */
export function formatPercentChange(value: number, decimals = 2): string {
	const sign = value > 0 ? '+' : '';
	return sign + value.toFixed(decimals) + '%';
}

/**
 * Get CSS class for positive/negative change
 */
export function getChangeClass(value: number): 'up' | 'down' | '' {
	if (value > 0) return 'up';
	if (value < 0) return 'down';
	return '';
}

/**
 * Escape HTML for safe display
 */
export function escapeHtml(text: string): string {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

/**
 * Get date from days ago
 */
export function getDateDaysAgo(days: number): string {
	const date = new Date();
	date.setDate(date.getDate() - days);
	return date.toISOString().split('T')[0];
}

/**
 * Get today's date formatted
 */
export function getToday(): string {
	return new Date().toISOString().split('T')[0];
}

/**
 * Convert lat/lon to map position (equirectangular projection)
 */
export function latLonToXY(
	lat: number,
	lon: number,
	width: number,
	height: number
): { x: number; y: number } {
	const x = ((lon + 180) / 360) * width;
	const y = ((90 - lat) / 180) * height;
	return { x, y };
}
