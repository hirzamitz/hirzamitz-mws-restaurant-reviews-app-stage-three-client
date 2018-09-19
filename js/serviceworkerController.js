if (navigator.serviceWorker){
	// Register the service worker. If a service worker already exists and it's current, then return the existing istance
	navigator.serviceWorker.register('/serviceworker.js', { scope: '/'}).then(function(registration){
		console.log('ServiceWorker registration successful with scope: ', registration.scope);

		if (navigator.serviceWorker.controller) {   
			console.log('navigator.serviceWorker.controller');
			// Check if notification permission is granted
			if(Notification && Notification.permission === 'default') {
				Notification.requestPermission(function (permission) {
					if(!('permission' in Notification)) {
						Notification.permission = permission;
					}
				});
			}
			// If the new service worker has been successfully installed, send a message to the user and ask if the new service
			// worker can be activated
			if (registration.waiting) {
				updateReady(registration.waiting);
			}
			// If a new service worker is being installed, wait until state changes to installed and then send a message to the user
			// to ask if the new service worker can be activated
			else if (registration.installing) {
				trackInstalling(registration.installing);
			}
			// If a new service worker exists, wait until the service worker is installed and then send a message to the user to ask
			// if the new service worker can be activated
			else {
				registration.addEventListener('updatefound', function() {
					trackInstalling(registration.installing);
				});
			}
		}

	}).catch(function(err) {
		// If registration fails, log an error
		console.log('ServiceWorker registration failed: ', err);
	});
}

trackInstalling = function(worker) {
	console.log('A new ServiceWorker is installing');
	worker.addEventListener('statechange', function() {
		if (worker.state == 'installed') {
			updateReady(worker);
		}
	});
};
  
updateReady = function (worker){
	console.log('A new ServiceWorker is waiting');
	if (Notification.permission === 'granted') {
		var notification = new Notification('New ServiceWorker is Ready', {
			body: 'Click close to update',
			tag: 'updateSW',
		});
		setTimeout(notification.close.bind(notification), 10000);
		notification.onclick = function(event) {
			worker.postMessage({
				action: 'skipWaiting'
			});
			window.console.log('Send skipWaiting message from onclick');
		};
		notification.onerror = function(error){
			window.console.log('Notification error: ', error);
		};
	}
};

