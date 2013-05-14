/*
 * Google Geocoder (built on wyattdanger's geocoder module)
 *
 * Features: 
 * - Cache geocode to disk to reduce the number of Google requests.
 * - Throttle Google requests to avoid exceeding rate limit.
 * - Queue Google requests to prevent simultaneous requests from exceeding rate limit.
 * 
 * Note: Google, in addition to placing a 2,500 per day quota on requests, limits
 * the request rate to about 10 per second.  Google does not publish the rate limit, and
 * the value changes unpredictably depending on usage.
 *
 * Jonas Geduldig
 * Version 0.1 - 10.march.2013
 */
 
var geocoder = require('geocoder')
  , store = require('ministore')('.')

module.exports = geocoder;


geocoder.THROTTLE_INCR = 100; // milliseconds
geocoder.throttleWait = geocoder.THROTTLE_INCR;
geocoder.exceededQuota = false;
geocoder.retryCount = 0;
geocoder.lastRequestTime = 0;
geocoder.queue = [];
geocoder.cache = store('geo.cache');


geocoder.readCache = function(location) {
	return geocoder.cache.get(location);
};


geocoder.writeCache = function(location, geocode) {
	geocoder.cache.set(location, geocode);
};


geocoder.throttle = function(cbf) {
	// MUST THROTTLE EACH REQUEST TO PREVENT EXCEEDING THE RATE LIMIT

	if (geocoder.retryCount == 1) { 
		// increase throttle for the 2nd try
		geocoder.retryCount = 2;
		geocoder.throttleWait += geocoder.THROTTLE_INCR;
	}
	else if (geocoder.retryCount == 2) { 
		// reset since 2nd try worked
		geocoder.retryCount = 0;
	}
	var now = new Date();
	var delta = Math.max(0, geocoder.throttleWait - (now - geocoder.lastRequestTime));
	setTimeout(cbf , delta);
};


geocoder.retryOnce = function(cbf) {
	// MUST HALT REQUESTS WHEN DAILY QUOTA IS EXCEEDED

	if (geocoder.retryCount == 0) {
		// wait and retry once to see if we exceeded the rate limit 
		geocoder.retryCount = 1;
		setTimeout(cbf, 2000);
	}
	else {
		// the second attempt failed means we exceeded the 24-hour quota,
		// so continue processing the queue using only cached geocode
		geocoder.retryCount = 0;
		geocoder.exceededQuota = true;
		console.log('EXCEEDED GOOGLE 24-HOUR GEOCODE QUOTA');
		cbf(); 
	}
};


geocoder.geocodeWithThrottle = function(location, cbf) {
	// FIRST CHECK OUR CACHED GEOCODE, THEN THROTTLE BEFORE A NEW REQUEST

	var geocode = geocoder.readCache(location);
	if (geocode) {
		cbf(geocode.lat, geocode.lng);
		geocoder.doNextRequest();
	}
	else if (!geocoder.exceededQuota) {
		geocoder.throttle(function() {
			geocoder.retryCount += 1;
			geocoder.geocode(location, function (err, data) {
				geocoder.lastRequestTime = new Date();
				if (err) {
					console.dir(err);
					cbf(null, null);
					geocoder.doNextRequest();
				}
				else if (data.status == 'OVER_QUERY_LIMIT') {
					// We are either over rate limit or the daily quota.
					// If the next retry fails, it is the latter. 
					geocoder.retryOnce(function() {
						geocoder.geocodeWithThrottle(location, cbf);
					});
				}
				else {
					var lat, lng;
					if (data.status == 'OK' && data.results.length > 0) {
						geocode = data.results[0].geometry.location;
						lat = geocode.lat;
						lng = geocode.lng;
						geocoder.writeCache(location, geocode);
					}
					cbf(lat, lng);
					geocoder.doNextRequest();
				}
			});
		});
	}
	else
		geocoder.doNextRequest();
};


geocoder.queueRequest = function(location, cbf) {
	// MUST QUEUE REQUESTS SO THEY DO NOT OVERLAP AND DEFEAT THROTTLING

	geocoder.queue.push([location, cbf]);
	if (geocoder.queue.length == 1)
		geocoder.geocodeWithThrottle(location, cbf);
};


geocoder.doNextRequest = function() {
	// first, remove the last request since it has completed
	geocoder.queue.shift();

	// now the first request in the queue will be the active request
	if (geocoder.queue.length > 0) {
		var next = geocoder.queue[0];
		geocoder.geocodeWithThrottle(next[0], next[1]);
	}
};