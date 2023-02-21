/* Copied from https://github.com/gzuidhof/coi-serviceworker/blob/master/coi-serviceworker.js */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('message', (ev) => {
	if (!ev.data) {
		return;
	}

	if (ev.data.type === 'deregister') {
		self.registration
			.unregister()
			.then(() => {
				return self.clients.matchAll();
			})
			.then((clients) => {
				clients.forEach((client) => client.navigate(client.url));
			});
	}
});

self.addEventListener('fetch', (event) => {
	const r = event.request;

	if (r.cache === 'only-if-cached' && r.mode !== 'same-origin') {
		return;
	}

	const request = new Request(r, {
		credentials: 'omit',
	});

	event.respondWith(
		fetch(request)
			.then((response) => {
				if (response.status === 0) {
					return response;
				}

				const newHeaders = new Headers(response.headers);

				newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');
				newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

				return new Response(response.body, {
					status: response.status,
					statusText: response.statusText,
					headers: newHeaders,
				});
			})
			.catch((e) => console.error(e)),
	);
});
