# Mobile Web Specialist Certification Course
---
#### _Three Stage Course Material Project - Restaurant Reviews_

![Lighthouse Report for index.html](https://github.com/hirzamitz/mws-restaurant-reviews-app-stage-three-client/blob/master/img/Mockup.png)

## Project Overview: Stage 3

For the **Restaurant Reviews** projects, you will incrementally convert a static webpage to a mobile-ready web application. In **Stage Three**, you will complete the following tasks:
1. Change the code for your restaurant requests to use the stage three development server.
2. Add a form to allow users to submit their own reviews. 
3. Allow users to mark restaurants as favorites
4. Add functionality to defer submission of the form (or changing restaurant favorites) until connection is re-established.
5. Follow the recommendations provided by Lighthouse to achieve the required performance targets.

### What do I do from here?

        This web application is currently hosted on https://hp-mws-resto-rev-three.netlify.com/.
        To test this on your local machine, please follow the instructions below. 
        Note that you will need to supply your own Google Maps API Key in index.html and restaurant.html. 

1. Start up the development server by following the instructions [here](https://github.com/hirzamitz/mws-restaurant-reviews-app-stage-three-server/blob/master/README.md). 

2. Install project dependencies by running *npm i* on a terminal

3. Change the Google Maps API Key in index.html and restaurant.html

4. Run the default gulp task by running gulp on a terminal

5. Start up the client server in the dist folder. In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000` (or some other port, if port 8000 is already in use.) For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

6. With your server running, visit the site: `http://localhost:8000`.


## Project Submission Summary: Stage 3

The following changes were completed to satisfy the requirements for Stage 3: 
1. User Interface and Offline Use
    - [x] Users are able to mark a restaurant as a favorite, this toggle is visible in the application. A form is added to allow users to add their own reviews for a restaurant. Form submission works properly and adds a new review to the database.
    - [x] The client application works offline. JSON responses are cached using the IndexedDB API. Any data previously accessed while connected is reachable while offline. User is able to add a review to a restaurant while offline and the review is sent to the server when connectivity is re-established.
2. Responsive Design and Accessibility
    - [x] The application maintains a responsive design on mobile, tablet and desktop viewports. All new features are responsive, including the form to add a review and the control for marking a restaurant as a favorite.
    - [x] The application retains accessibility features from the previous projects. Images have alternate text, the application uses appropriate focus management for navigation, and semantic elements and ARIA attributes are used correctly. Roles are correctly defined for all elements of the review form.
3. Performance
    - [x] Lighthouse targets for each category exceed:
            Progressive Web App: >90
            Performance: >90
            Accessibility: >90

### Lighthouse Performance

The Lighthouse report for index.html and restaurant.html exceeded the targets for Progressive Web App, Performance and Accessibility.  The reports below were obtained using the application deployed [here](https://hp-mws-resto-rev-three.netlify.com/)

**index.html**
![Lighthouse Report for index.html](https://github.com/hirzamitz/mws-restaurant-reviews-app-stage-three-client/blob/master/img/Lighthouse_Index.png)

**restaurant.html**
![Lighthouse Report for restaurant.html](https://github.com/hirzamitz/mws-restaurant-reviews-app-stage-three-client/blob/master/img/Lighthouse_Restaurant.png)

### Troubleshooting Tips

* If the restaurant data is not being displayed after starting up the client server using "python3 -m http.server <port>", make sure that the ports in js/dbhelper.js and serviceworker.js match the server port
    