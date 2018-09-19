let restaurants,
	neighborhoods,
	cuisines
var map
var markers = []

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	DBHelper.fetchOfflineRequestsFromIDB(document);
	fetchNeighborhoods();
	fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
fetchNeighborhoods = () => {
	DBHelper.fetchNeighborhoods((error, neighborhoods) => {
		if (error) { // Got an error
			console.error(error);
		} else {
			self.neighborhoods = neighborhoods;
			fillNeighborhoodsHTML();
		}
	});
}

/**
 * Set neighborhoods HTML.
 */
fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
	const select = document.getElementById('neighborhoods-select');
	neighborhoods.forEach(neighborhood => {
		const option = document.createElement('option');
		option.innerHTML = neighborhood;
		option.value = neighborhood;
		select.append(option);
	});
}

/**
 * Fetch all cuisines and set their HTML.
 */
fetchCuisines = () => {
	DBHelper.fetchCuisines((error, cuisines) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.cuisines = cuisines;
			fillCuisinesHTML();
		}
	});
}

/**
 * Set cuisines HTML.
 */
fillCuisinesHTML = (cuisines = self.cuisines) => {
	const select = document.getElementById('cuisines-select');

	cuisines.forEach(cuisine => {
		const option = document.createElement('option');
		option.innerHTML = cuisine;
		option.value = cuisine;
		select.append(option);
	});
}

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
	let loc = {
		lat: 40.722216,
		lng: -73.987501
	};
	self.map = new google.maps.Map(document.getElementById('map'), {
		zoom: 12,
		center: loc,
		scrollwheel: false
	});
	updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
updateRestaurants = () => {
	const cSelect = document.getElementById('cuisines-select');
	const nSelect = document.getElementById('neighborhoods-select');

	const cIndex = cSelect.selectedIndex;
	const nIndex = nSelect.selectedIndex;

	const cuisine = cSelect[cIndex].value;
	const neighborhood = nSelect[nIndex].value;

	DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			resetRestaurants(restaurants);
			fillRestaurantsHTML();
		}
	})
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
resetRestaurants = (restaurants) => {
	// Remove all restaurants
	self.restaurants = [];
	const ul = document.getElementById('restaurants-list');
	ul.innerHTML = '';

	// Remove all map markers
	self.markers.forEach(m => m.setMap(null));
	self.markers = [];
	self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
fillRestaurantsHTML = (restaurants = self.restaurants) => {
	const ul = document.getElementById('restaurants-list');
	restaurants.forEach(restaurant => {
		ul.append(createRestaurantHTML(restaurant));
	});
	addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
createRestaurantHTML = (restaurant) => {
	const li = document.createElement('li');

	/**
   *  add source elements to allow picture element to load the image based on viewport size 
   *  display a figure caption next to the image 
  **/
	const figure = document.createElement('figure');
	figure.className = 'restaurant-figure';

	const picture = document.createElement('picture');

	const imgSrc = DBHelper.imageUrlForRestaurant(restaurant);

	const source1 = document.createElement('source');
	source1.media = "(min-width: 750px)";
	source1.srcset = imgSrc.replace(".jpg", "-800_large_1X.jpg");
	source1.type = "image/jpeg"

	picture.append(source1);

	const source2 = document.createElement('source');
	source2.media = "(min-width: 500px)";
	source2.srcset = imgSrc.replace(".jpg", "-600_medium.jpg");
	source2.type = "image/jpeg"

	picture.append(source2);

	const figCaption = document.createElement('figCaption');
	figCaption.className = 'restaurant-figCaption';
	figCaption.innerHTML = restaurant.name + " restaurant";

	const image = document.createElement('img');
	image.className = 'restaurant-img';
	image.src = imgSrc.replace(".jpg", "-315_small.jpg");
	image.alt = "Photo at the " + restaurant.name + " restaurant";

	picture.append(image);
	figure.append(picture);
	figure.append(figCaption);
	li.append(figure);

	const name = document.createElement('h1');
	name.innerHTML = restaurant.name;
	li.append(name);

	const neighborhood = document.createElement('p');
	neighborhood.innerHTML = restaurant.neighborhood;
	li.append(neighborhood);

	const address = document.createElement('p');
	address.innerHTML = restaurant.address;
	li.append(address);

	// add hidden labels to the combo boxes to improve accessibility
	const label = document.createElement('label');
	label.className = "hidden";
	label.setAttribute("for", "restaurant" + restaurant.id);
	label.innerHTML = "View Details of " + restaurant.name + " restaurant";
	li.append(label);
  
	const more = document.createElement('button');
	more.innerHTML = "View Details"
	more.id = "restaurant" + restaurant.id;
	more.setAttribute("onclick", "location.href='" + DBHelper.urlForRestaurant(restaurant) + "'");
	li.append(more)

	return li
}

/**
 * Add markers for current restaurants to the map.
 */
addMarkersToMap = (restaurants = self.restaurants) => {
	restaurants.forEach(restaurant => {
		// Add marker to the map
		const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
		google.maps.event.addListener(marker, 'click', () => {
			window.location.href = marker.url
		});
		self.markers.push(marker);
	});
}
