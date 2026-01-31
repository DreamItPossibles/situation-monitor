import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const FREE_PROXY_POOL = [
	'https://api.allorigins.win/raw?url=',
	'https://corsproxy.io/?url=',
	'https://proxy.cors.sh/',
	'https://thingproxy.freeboard.io/fetch/',
	'https://cors-anywhere.herokuapp.com/'
];

export const GET: RequestHandler = async ({ url }) => {
	const targetUrl = url.searchParams.get('url');

	if (!targetUrl) {
		return json({ error: 'Missing url parameter' }, { status: 400 });
	}

	// For Chinese sources or GDELT, try direct fetch first (server-side)
	if (
		targetUrl.includes('gdelt') ||
		targetUrl.includes('sourcelang:chinese') ||
		targetUrl.includes('.cn')
	) {
		try {
			const res = await fetch(targetUrl, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				},
				signal: AbortSignal.timeout(15000)
			});
			if (res.ok) {
				const data = await res.text();
				return new Response(data, {
					headers: {
						'Content-Type': res.headers.get('Content-Type') || 'text/plain',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		} catch {
			// Fail silently and move to proxy pool
		}
	}

	let lastError: Error | null = null;

	// Try each proxy in the pool
	for (const proxyBase of FREE_PROXY_POOL) {
		try {
			const proxyRequestUrl = proxyBase.includes('?')
				? `${proxyBase}${encodeURIComponent(targetUrl)}`
				: `${proxyBase}${targetUrl}`;

			const response = await fetch(proxyRequestUrl, {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
				},
				signal: AbortSignal.timeout(10000)
			});

			if (response.ok) {
				const contentType = response.headers.get('Content-Type');
				const data = await response.text();

				return new Response(data, {
					headers: {
						'Content-Type': contentType || 'text/plain',
						'Cache-Control': 'public, max-age=300',
						'Access-Control-Allow-Origin': '*'
					}
				});
			}
		} catch (error) {
			lastError = error as Error;
			console.warn(`Server proxy ${proxyBase} failed for ${targetUrl}, trying next...`);
		}
	}

	// If all failed, try one last time with a direct fetch without special headers
	try {
		const res = await fetch(targetUrl, { signal: AbortSignal.timeout(5000) });
		if (res.ok) {
			const data = await res.text();
			return new Response(data, {
				headers: {
					'Content-Type': res.headers.get('Content-Type') || 'text/plain',
					'Access-Control-Allow-Origin': '*'
				}
			});
		}
	} catch {
		// ignore
	}

	return json({ error: 'All proxies failed', details: lastError?.message }, { status: 502 });
};
