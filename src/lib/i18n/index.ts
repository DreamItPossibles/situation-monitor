import { register, init } from 'svelte-i18n';

register('en', () => import('./en.json'));
register('zh', () => import('./zh.json'));

init({
	fallbackLocale: 'zh',
	initialLocale: 'zh'
});
