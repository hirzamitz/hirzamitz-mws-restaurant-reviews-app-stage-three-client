let restaurant;
var map;

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {

	DBHelper.fetchOfflineRequestsFromIDB(document);
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error('fetchRestaurantFromURL: ' + error);
		} else {
			fillBreadcrumb();
			self.map = new google.maps.Map(document.getElementById('map'), {
				zoom: 16,
				center: restaurant.latlng,
				scrollwheel: false
			});
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
		}
	});
}

/**
 * Get current restaurant from page URL.
 */
fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant)
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL'
		callback(error, null);
	} else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			createReviewsSectionHTML();
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			DBHelper.fetchReviewsByRestaurantId(id, (error, reviews) => {
				self.restaurant.reviews = reviews;
				if (!reviews) {
					console.error(error);
					return;
				}
				// fill reviews
				fillReviewsHTML();
			});

			callback(null, restaurant)
		});
	}
}

/**
 * Create restaurant HTML and add it to the webpage
 */
fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');

	const favorite = document.createElement('button');
	favorite.setAttribute('class','favorite');
	favorite.id = 'restaurant-fave';
	name.append(favorite);
	name.append(restaurant.name);

	DBHelper.updateFavoriteButton(document, restaurant.id, restaurant.is_favorite);

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;

	/**
   *  add source elements to allow picture element to load the image based on viewport size 
   *  display a figure caption next to the image 
  **/
	const picture = document.getElementById('picture-restaurant-img');

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

	const image = document.createElement('img');
	image.id = 'restaurant-img';
	image.src = imgSrc.replace(".jpg", "-315_small.jpg");
	image.alt = "Photo at the " + restaurant.name + " restaurant";

	picture.append(image);

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}

	// Add the restaurant id to the modal so we can submit the comment for the correct restaurant
	let modal = document.getElementById('reviewModal');

	modal.setAttribute('restaurantID',restaurant.id);

	// Close the Review modal when user clicks on the close button
	document.getElementById('btnModalClose').onclick = function() {
		closeReviewModal(modal);
	}; 

	// Close the Review modal when user clicks on the OK button
	document.getElementById('reviewOK').onclick = function() {
		closeReviewModal(modal);
	}; 

}

// Code for closing the Review modal
closeReviewModal = (modal) =>{
	modal.classList.remove('show');
	// Refresh the page so that the comment is displayed
	if (modal.getAttribute('submitStatus') == 'true'){
		window.location.href = DBHelper.urlForRestaurantID(modal.getAttribute('restaurantID'));
	}	
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		// replace comma with a break to display hours in multiple lines
		time.innerHTML = operatingHours[key].replace(",", "<br/>");
		row.appendChild(time);

		hours.appendChild(row);
	}
}

/**
 * Create reviews section  
 */
createReviewsSectionHTML = () => {
	const container = document.getElementById('reviews-container');
	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';

	const addReview = document.createElement('button');

	addReview.innerHTML = '&#10133;';     // Plus sign for the New review button
	addReview.onclick = function() {
		var modal = document.getElementById('reviewModal');
		modal.classList.add('show');
		document.getElementById('reviewStatus').classList.remove('show');
		document.getElementById('reviewForm').classList.remove('hide');

		document.getElementById('review_name').value = '';
		document.getElementById('review_rating').value = '1';
		document.getElementById('review_comments').value = '';

		// Set to false so that the page doesn't refresh if the modal is closed and no new reviews are added
		modal.setAttribute('submitStatus', 'false');

		// Display the success or error message after submitting a new review
		document.getElementById('reviewSubmit').onclick = function() {
			let id = modal.getAttribute('restaurantID');
			let name = document.getElementById('review_name').value;
			let rating = document.getElementById('review_rating');
			let comments = document.getElementById('review_comments').value;
			let rating_value = rating.options[rating.selectedIndex].value;
			
			DBHelper.submitReview(id, name, rating_value, comments, (error, success) => {
				if (success){
					document.getElementById('modalTitle').innerHTML = 'Success';
					document.getElementById('reviewModalStatus').innerHTML = 'New review was saved to the database';
					document.getElementById('reviewModal').setAttribute('submitStatus','true');
				}
				else{
					document.getElementById('modalTitle').innerHTML = 'Offline';
					document.getElementById('reviewModalStatus').innerHTML = 'Review will be saved once a database connection is made';
				}
				document.getElementById('reviewStatus').classList.add('show');
				document.getElementById('reviewForm').classList.add('hide');
				
			});
			
		}; 
    };
	title.append(addReview);

	container.appendChild(title);
} 

/**
 * Create all reviews HTML and add them to the webpage.
 */
fillReviewsHTML = (reviews = self.restaurant.reviews) => {
	const container = document.getElementById('reviews-container');

	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.innerHTML = review.name;
	li.appendChild(name);

	const date = document.createElement('p');
	var d = new Date(review.updatedAt);
	date.innerHTML = d.toLocaleDateString();
	li.appendChild(date);

	const rating = document.createElement('p');

	rating.innerHTML = 'Rating: '
	for (i = 0; i < review.rating; i++){
		rating.innerHTML = rating.innerHTML + '&#x2605';
	}
	for (i = review.rating; i < 5; i++){
		rating.innerHTML = rating.innerHTML + '&#x2606;';
	}
	/*rating.innerHTML = `Rating: ${review.rating}`;*/
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
fillBreadcrumb = (restaurant=self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
