/**
 * Common database helper functions.
*/
class DBHelper {

	static get IDB_DATABASE(){
		return 'restaurants-app';
	} 

   /**
   * DATABASE URL
   * MAKE SURE TO UPDATE THE DEBHELPER WHEN YOU UPDATE THE PORT 
   */
	static get DATABASE_URL() {
		//const port = 1337; // Change this to your server port
		//return `http://localhost:${port}`;
		return `https://hp-mws-resto-rev-three-server.herokuapp.com`;
	}

	static get DATABASE_RESTAURANTS_URL(){
		return DBHelper.DATABASE_URL + '/restaurants';
	}

	static get DATABASE_REVIEWS_URL(){
		return DBHelper.DATABASE_URL + '/reviews';
	}

	static DATABASE_REVIEWS_BY_ID_URL(id){
		return `${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`;
	}

	static DATABASE_RESTAURANT_BY_ID_URL(id){
		return `${DBHelper.DATABASE_URL}/restaurants/${id}`;
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurantID(id) {
		return (`./restaurant.html?id=${id}`);
	}

	/**
	 * Restaurant page URL retrieved by ID.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	* Server favorite page URL.
	*/
	static urlForRestaurantFavorite(id, is_favorite) {
		return (`${DBHelper.DATABASE_RESTAURANTS_URL}/${id}/?is_favorite=${is_favorite}`);
	}

	/**
	* Restaurant image URL.
	*/
	static imageUrlForRestaurant(restaurant) {
		if (restaurant.photograph){
			return (`/img/${restaurant.photograph}.jpg`);
		}
		else{
			return (`/img/${restaurant.id}.jpg`);
		}
	}

	/**
	 * Create IDB object stores
	 */
	static createIDBObjects(){

		return idb.open(DBHelper.IDB_DATABASE, 1, upgradeDb => {

			var restaurantsStore = upgradeDb.createObjectStore('restaurants',{
				keyPath: 'id'
			});

			var reviewsStore = upgradeDb.createObjectStore('reviews',{
				keyPath: 'id'
			});
			reviewsStore.createIndex("restaurant_id", "restaurant_id");

			var offlineStore = upgradeDb.createObjectStore('offlineRequests',{
				keyPath: 'id',
				autoIncrement: true
			});

		});
	}

	/**
   * Fetch all offline requests.
   */
	static fetchOfflineRequestsFromIDB(document) {

		const idbPromise = DBHelper.createIDBObjects();

		idbPromise.onerror = function(e) {
			return;
		};
		
		// Retrieve the offline requests from indexedDB
		idbPromise.then(db => {

			if (!db.objectStoreNames) {
				db.close();
				throw Error("An error occurred while opening the restaurants-app IDB");
			}

			const requestsObj = db.transaction('offlineRequests', 'readwrite');
			var requestsStore = requestsObj.objectStore('offlineRequests');

			return requestsStore.getAll();

		})
		.then(requests => fetchOfflineRequests(document, idbPromise, requests))
		.catch(e => console.log(`fetchOfflineRequestsFromIDB: ${e}`));

		function fetchOfflineRequests (document, idbPromise, requests) {

			var error, hasError;

			// Loop over the array of requests and call the appropriate fetch method for each request
			if (requests){
				for (let i = 0; i < requests.length; i++){

					let request = requests[i];
	
					if (request.method == 'PUT'){
						processOfflinePut(document, idbPromise, request, error);
					}
					else if(request.method == 'POST'){
						processOfflinePost(request, idbPromise, error);
					}
					if (error){                     // If an error occurs, assume that no database connection can be made and stop looping
						if (error.length > 0){
							hasError = true;
							break;
						}
					}
					
				}
			}
			if (hasError){
				throw Error(error);
			}

			return;

		}

		function processOfflinePut(document, idbPromise, request, error){

			const new_fave_state = request.data.is_favorite;
			const restaurant_id = request.data.restaurant_id;

			fetch(request.url, {
				method: 'PUT',
			})
			.then(response => {
				// Assume that the database is offline
				if (!response.ok && !response.redirected) {
					throw Error(response.statusText);
				}
				// Delete requests from IDB
				deleteFromIDB(idbPromise, request.id);
				return;
			}).then(() => {
				let success;
				DBHelper.updateIDBRestaurantFavorite(restaurant_id, new_fave_state);
				if (document.getElementById('reviewModal').getAttribute('restaurantID') == restaurant_id){
					DBHelper.updateFavoriteButton(document, restaurant_id, new_fave_state);
				}
			})
			.catch(e => requestError(error, e));

			function requestError(error, e) {
				error = (`Error occurred for PUT offline request. Returned status of ${e}`);
			}
		}

		function processOfflinePost(request, idbPromise, error){
			fetch(request.url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(request.data)
			})
			.then(response => {
				// Assume that the database is offline
				if (!response.ok) {
					throw Error(response.statusText);
				}
				// Delete requests from IDB
				deleteFromIDB(idbPromise, request.id);
			})
			.catch(e => requestError(error, e));
		}

		function requestError(error, e) {
			error = (`Error occurred for POST offline request. Returned status of ${e}`);
		}

		function deleteFromIDB(idbPromise, id){
			return idbPromise.then(db => {
				const tx = db.transaction('offlineRequests', 'readwrite');
				tx.objectStore('offlineRequests').delete(parseInt(id));
				return tx.complete;
			});
		}
	}

	/**
   * Fetch all restaurants.
   */
	static fetchRestaurants(callback) {

		fetch(DBHelper.DATABASE_RESTAURANTS_URL, {

		}).then(response => response.json())
		.then(addRestaurants)
		.catch(e => requestError(e));

		function addRestaurants (data) {
			const restaurants = data;

			// Add all restaurants to indexedDB
			idb.open(DBHelper.IDB_DATABASE).then(db => {
				const restaurantObj = db.transaction('restaurants', 'readwrite');
				var restaurantStore = restaurantObj.objectStore('restaurants');

				restaurants.forEach(function(restaurant){
					restaurantStore.put(restaurant);
				})

				return restaurantStore.getAll();
			})
			callback(null, restaurants);
		}

		function requestError(e) {
            const error = (`Error occurred for fetchRestaurants request. Returned status of ${e}`);
			callback(error, null);
		}
	}

	/**
	* Fetch the restaurants which corresponds to the id provided
	*/
	static fetchOneRestaurant(id, callback) {

		fetch(DBHelper.DATABASE_RESTAURANT_BY_ID_URL(id), {

		}).then(response => response.json())
		.then(addRestaurant)
		.catch(e => requestError(e));

		function addRestaurant (data) {
			const restaurant = data;

			// Add the restaurant to indexedDB
			idb.open(DBHelper.IDB_DATABASE).then(db => {
				const restaurantObj = db.transaction('restaurants', 'readwrite');
				var restaurantStore = restaurantObj.objectStore('restaurants');

				restaurantStore.put(restaurant);

				return restaurantStore.getAll();
			})
			callback(null, restaurant);
		}

		function requestError(e) {
			const error = (`Error occurred for fetchOneRestaurant request. Returned status of ${e}`);
			callback(error, null);
		}
	}


	/**
   * Fetch all reviews for the given restaurant.
   */
  static fetchRestaurantReviews(id, callback) {

	fetch(DBHelper.DATABASE_REVIEWS_BY_ID_URL(id), {

        }).then(response => response.json())
            .then(addReviews)
			.catch(e => reviewsError(e));

		function addReviews (data) {
			const reviews = data;

			// Add all reviews to indexedDB
			idb.open(DBHelper.IDB_DATABASE).then(db => {
				const reviewObj = db.transaction('reviews', 'readwrite');
				var reviewStore = reviewObj.objectStore('reviews');

				reviews.forEach(function(review){
					reviewStore.put(review);
				})

				return reviewStore.getAll();
			})
			callback(null, reviews);
		}

		function reviewsError(e) {
            const error = (`Error occurred for fetchRestaurantReviews request. Returned status of ${e}`);
			callback(error, null);
		}
	}	
	/**
   * Fetch a restaurant by its ID.
   */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchOneRestaurant(id, (error, restaurant) => {
			if (error) {
				callback(error, null);
			} 
			else {
				if (restaurant) { // Got the restaurant
					callback(null, restaurant);
				} 
				else { // Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}
	/**
   * Fetch reviews for a given restaurant ID.
   */
  	static fetchReviewsByRestaurantId(id, callback) {
	// fetch all reviews with proper error handling.
		DBHelper.fetchRestaurantReviews(id, (error, reviews) => {
			if (error) {
				callback(error, null);
			} 
			else {
				if (reviews) { // Got the restaurant reviews
					callback(null, reviews);
				} 
				else { // Reviews does not exist in the database
					callback('Reviews do not exist for this restaurant', null);
				}
			}
		});
	}

	/**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} 
			else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	/**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} 
			else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} 
			else {
				let results = restaurants
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
   * Fetch all neighborhoods with proper error handling.
   */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} 
			else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
   * Fetch all cuisines with proper error handling.
   */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} 
			else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
   * Mark restaurant as favorite.
   */
	static updateFavoriteButton(document, restaurant_id, is_favorite) {
		
		let favorite = document.getElementById('restaurant-fave');

		if (String(is_favorite) == 'true'){
			favorite.innerHTML = '🖤';               // Black heart means current restaurant is a favorite
			favorite.classList.add('favorite');
		}
		else{
			favorite.innerHTML = '&#9825;';         // Hollow heart means current restaurant is not a favorite
			favorite.classList.remove('favorite');
		}

		// Update the favorite icon if the favorite status has been updated. Otherwise, display an error
		favorite.onclick = function() { 
			let new_favorite_state = (String(is_favorite) == 'false');
			DBHelper.favoriteFetch(restaurant_id, new_favorite_state, (error, success) => {
				if (success){
					DBHelper.updateFavoriteButton(document, restaurant_id, new_favorite_state);
				}
				else{
					document.getElementById('reviewModal').classList.add('show');
					document.getElementById('modalTitle').innerHTML = 'Offline';
					document.getElementById('reviewModalStatus').innerHTML = 'Favorite will be updated once a database connection is made';
					document.getElementById('reviewStatus').classList.add('show');
					document.getElementById('reviewForm').classList.add('hide');
				}
			});
		}
	}

	static favoriteFetch(id, new_favorite_state, callback) {

		var url = DBHelper.urlForRestaurantFavorite(id, new_favorite_state);

		fetch(url, {
			method: 'PUT',
		})
		.then( response => {
			// Assume that the database is offline
			if (!response.ok && !response.redirected) {
				throw Error(response.statusText);
			}
			// Update indexedDB if the restaurant favorit status changes
			DBHelper.updateIDBRestaurantFavorite(id, new_favorite_state);
			callback(null, true);
		})
		.catch(error => favoriteFetchError(url, id, new_favorite_state, error, callback));

		function favoriteFetchError(request_url, id, new_favorite_state, error, callback){

			// Save the restaurant details to an object so we can update indexedDB once the fetch succeeds without parsing the URL
			var putDetails = {
				"restaurant_id": parseInt(id),
				"is_favorite": new_favorite_state
			};
			// Add the request to indexedDB is a database connection is not made
			idb.open(DBHelper.IDB_DATABASE).then(db => {
				const offlineObj = db.transaction('offlineRequests', 'readwrite');
				  const offlineStore = offlineObj.objectStore('offlineRequests');
				  offlineStore.put({
					url: request_url,
					method: 'PUT',
					data: putDetails
				});
				  return offlineObj.complete;
			});
			callback(`Error occurred for Favorite request. Returned status of ${error}`, false);
		}
	}

	static updateIDBRestaurantFavorite(id, new_favorite_state) {
		// Update the restaurant in idb
		idb.open(DBHelper.IDB_DATABASE).then(db => {
			  const restaurantObj = db.transaction('restaurants', 'readwrite');
			  const restaurantStore = restaurantObj.objectStore('restaurants');

			// Get the restaurant object that has this id 
			restaurantStore.get(parseInt(id))
			.then(restaurant => updateFavorite(restaurant))

			function updateFavorite(restaurant){
				
				// Update the is_favorite value in the object
				restaurant.is_favorite = new_favorite_state;
			
				// Insert the item back into the database
				var updateFavoriteRequest = restaurantStore.put(restaurant);
			
				return restaurantObj.complete;
			}
		});
	}

	static submitReview(id, name, rating, comment, callback) {

		var url = `${DBHelper.DATABASE_REVIEWS_URL}/`;
		var redirect_url = DBHelper.urlForRestaurantID(parseInt(id));

		var review = {
			"restaurant_id": parseInt(id),
			"name": name,
			"rating": rating,
			"comments": comment
		};
	
		fetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			  },
			body: JSON.stringify(review)
		})
		.then(response => {
			if (response.ok){
				callback(null,true);
			}
			// Assume that the database is offline if !response.ok and !response.redirected
			if (!response.ok && !response.redirected) {
				throw Error(response.statusText);
			}
		})
		.catch(error => submitFetchError(error, url, review));
	
		function submitFetchError(e, request_url, review){
			// Add the review to indexedDB if a database connection cannot be made
			if (e == 'TypeError: Failed to fetch'){
				idb.open(DBHelper.IDB_DATABASE).then(db => {
					const offlineObj = db.transaction('offlineRequests', 'readwrite');
					  	const offlineStore = offlineObj.objectStore('offlineRequests');
						offlineStore.put({
							url: request_url,
							method: 'POST',
							data: review
						});
					  return offlineObj.complete;
				});
			}
			submitError(e);
		}

		function submitError(e) {
            const error = (`Error occurred for Submit request. Returned status of ${e}`);
			callback(error, null);
		}
	}

	/**
   * Map marker for a restaurant.
   */
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP}
		);
		return marker;
	}

}
