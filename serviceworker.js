var siteCacheName = 'restaurantreview-cache-v3';
var idbDatabase = 'restaurants-app';

self.importScripts('/js/idb.js');

// DATABASE URL
// MAKE SURE TO UPDATE THE DEBHELPER WHEN YOU UPDATE THE PORT 
DATABASE_URL = () => {
	//const port = 1337; // Change this to your server port
	//return `http://localhost:${port}`;
	return `https://hp-mws-resto-rev-three-server.herokuapp.com`;
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(siteCacheName).then((cache) => {
			// WE ARE CACHING SOME OF THE ITEMS HERE SO THEY'LL GET ADDED TO THE CACHE IN THEIR OWN GOOD TIME AND WILL NOT
			// DELAY THE INSTALLATION OF THE SERVICE WORKER.
			cache.addAll([
				'img/1-315_small.jpg',
				'img/2-315_small.jpg',
				'img/3-315_small.jpg',
				'img/4-315_small.jpg',
				'img/5-315_small.jpg',
				'img/6-315_small.jpg',
				'img/7-315_small.jpg',
				'img/8-315_small.jpg',
				'img/9-315_small.jpg',
				'img/10-315_small.jpg',
				'img/1-600_medium.jpg',
				'img/2-600_medium.jpg',
				'img/3-600_medium.jpg',
				'img/4-600_medium.jpg',
				'img/5-600_medium.jpg',
				'img/6-600_medium.jpg',
				'img/7-600_medium.jpg',
				'img/8-600_medium.jpg',
				'img/9-600_medium.jpg',
				'img/10-600_medium.jpg',
				'img/1-800_large_1X.jpg',
				'img/2-800_large_1X.jpg',
				'img/3-800_large_1X.jpg',
				'img/4-800_large_1X.jpg',
				'img/5-800_large_1X.jpg',
				'img/6-800_large_1X.jpg',
				'img/7-800_large_1X.jpg',
				'img/8-800_large_1X.jpg',
				'img/9-800_large_1X.jpg',
				'img/10-800_large_1X.jpg', 
			]);
			// The items below are part of the return statement for the promise created by caches.open. Since the service worker
			// will not install until all these items are in cache, we try to keep them to a minimum
			return cache.addAll([
				'/',
				'/restaurant.html',
				'/favicon.ico',
				'/manifest.json',
				'js/helper.js',            // merged dbhelper.js, and serviceworkerController.js to helper.js, removed JSON file
				'js/idb.js',
				'js/main.js',
				'js/restaurant_info.js',
				'css/main.css',
				'css/styles.css',
				'img/icons/Icon.svg',
				'img/icons/Icon-512.png'   // added icon for custom splash screen
			]);
		})
	);
});

// This fires once the old service worker is gone, and your new service worker is able to control the client
// At this point, we can delete the old cache
self.addEventListener('activate', event => {
	event.waitUntil(
		self.clients.claim(),
		caches.keys().then( cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					return cacheName.startsWith('restaurantreview-') &&
				 cacheName != siteCacheName;
				}).map(cacheName => {
					return caches.delete(cacheName);
				})
			);
		})
	);
});

// This intercepts the requests made to the domain
self.addEventListener('fetch', event => {

	var request = event.request;
	var requestUrl = new URL(request.url);
	var requestMethod = request.method;

	if (requestUrl.origin === DATABASE_URL()){
		if (requestMethod == 'POST'){
			return;
		}
		if (requestMethod == 'PUT'){
			return;
		}
		if (requestMethod == 'GET'){
			// Fetch the restaurants or retrieve from cache
			if (requestUrl.pathname.startsWith('/restaurants')){
				return getRestaurants(event, request, requestUrl);
			}

			// Fetch the reviews or retrieve from cache
			if (requestUrl.pathname == '/reviews/'){
				return getReviews(event, request, requestUrl);
			}
		}
		return;
	}
	
	if (requestUrl.origin === location.origin){
		// If a restaurant page is loaded, and it doesn't exist in the cache, clone the response and add it to the cache
		if (requestUrl.pathname.startsWith('/restaurant.html')) {
			event.respondWith(
				caches.open(siteCacheName).then(cache => {
					return cache.match('restaurant.html').then(response => {
						return response || fetch(request).then(response => {
							var responseClone = response.clone();
							cache.put(request, responseClone);
							return response;
						});
					});
				})
			);
			return;			
		}
	}
	
	// If the request doesn't exist in the cache, clone the response and add it to the cache
	event.respondWith(
		caches.open(siteCacheName).then(cache => {
			return cache.match(request).then(response => {
				return response || fetch(request).then(response => {
					var responseClone = response.clone();
					cache.put(request, responseClone);
					return response;
				})
			})
		})
	);

});

getRestaurants = (event, request, requestUrl) => {

	var pathArray = requestUrl.pathname.split('/');

	// Get the ID from the pathname
	if (pathArray.length > 1){
		var id = pathArray[2];
	}

	event.respondWith(
		// Fetch the restaurant from the network
		fetch(request).catch(() => {
			// Fallback to cache if a fetch error occurs
			return serveRestaurants(id);
		})
	);

	return;
}

getReviews = (event, request, requestUrl) => {

	event.respondWith(
		// Fetch the reviews from the network
		fetch(request).catch(() => {
			// Fallback to cache if a fetch error occurs
			return serveReviews(requestUrl.searchParams.get('restaurant_id'));
		})
	);

	return;
}

serveRestaurants = (restaurant_id) => {
	
	// Load the restaurant info from IDB
	return idb.open(idbDatabase, 1).then((db) => {
	  
	  	var myObject = db.transaction('restaurants', 'readonly');
	  	var store = myObject.objectStore('restaurants');
	  	if (restaurant_id){
			return store.get(parseInt(restaurant_id));
		}
		return store.getAll();
  
	}).then(objects => {
	  	if (objects) {
			return new Response(JSON.stringify(objects));
	  	}  
	});
}  

serveReviews = (restaurant_id) => {
		
	// Load the reviews from IDB using the restaurant_id index
	return idb.open(idbDatabase, 1).then((db) => {
	  
		var myObject = db.transaction('reviews', 'readonly');
		var store = db.transaction('reviews', 'readonly').objectStore('reviews');
		var myIndex = store.index('restaurant_id');
		
		return myIndex.getAll(parseInt(restaurant_id));
  
	}).then(objects => {
	  	if (objects) {
			return new Response(JSON.stringify(objects));
	  	}  
	});
}  

// This message will cause the service worker to kick out the current active worker and activate itself
self.addEventListener('message', (event) => {
	if (event.data.action === 'skipWaiting') {
		self.skipWaiting();
	}
});