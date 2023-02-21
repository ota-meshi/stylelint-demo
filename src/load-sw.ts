/* eslint-disable no-console */
/* Copied from https://github.com/gzuidhof/coi-serviceworker/blob/master/coi-serviceworker.js */
(() => {
	if (window.crossOriginIsolated !== false) return;

	if (!window.isSecureContext) {
		console.log('COOP/COEP Service Worker not registered, a secure context is required.');

		return;
	}

	// In some environments (e.g. Chrome incognito mode) this won't be available
	if (navigator.serviceWorker) {
		navigator.serviceWorker
			.register(`${import.meta.env.BASE_URL}sw.js`, {
				scope: import.meta.env.BASE_URL,
			})
			.then(
				(registration) => {
					console.log('COOP/COEP Service Worker registered', registration.scope);

					registration.addEventListener('updatefound', () => {
						console.log('Reloading page to make use of updated COOP/COEP Service Worker.');
						window.location.reload();
					});

					// If the registration is active, but it's not controlling the page
					if (registration.active && !navigator.serviceWorker.controller) {
						console.log('Reloading page to make use of COOP/COEP Service Worker.');
						window.location.reload();
					}
				},
				(err) => {
					console.error('COOP/COEP Service Worker failed to register:', err);
				},
			);
	}
})();
export {};
