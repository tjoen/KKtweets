
/**
 * Module dependencies.
 */
var express = require('express')
  , app = express()
  , server = require('http').createServer(app)
  , routes = require('./routes')
  , io = require('socket.io').listen(server)
  , path = require('path')
  , twitter = require('ntwitter')
  , twittertxt = require('twitter-text')
  , geocoder = require('./geo')
  , store = require('ministore')('.')
  , redis = require("redis")
  ,	url = require('url');

var sys = require('util');

/* setup mysql connection */
var mysql = require('mysql');
var client = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'mysql',
});
console.log('Connected to MySQL');

ClientConnectionReady = function(client) {
   client.query('USE KKtweets', function(error, results) {
      if(error) {
         console.log('ClientConnectionReady Error: ' + error.message);
         client.end();
         return;
      }
      // start the stream
      watchKKTwitter();
   });
};
ClientConnectionReady(client);

 
 //Local Redis DB
 //client = redis.createClient();
  
app.configure(function(){
  app.set('port', process.env.PORT || 5000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});


server.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});

app.get('/', routes.index);


/*Setup your Twitter keys here*/
var twit = new twitter({
    consumer_key: 'BgWfBjfcxw76nAq5lmOBsg',
    consumer_secret: 'ygSDB7BmrKxu1FiqdI5uebUYvUU4p7ymLQZTgRsaC3U',
    access_token_key: '1196381113-gKKdXMrgqzTbjWVutszOss4FjG3WXywV5JIyeNp',
    access_token_secret: '85J643ZARPC4adidEZDQdiux9fM6hGVVgHSFCnyuYgA'
});

var roundWithDepth = function(x, depthNum) {
		return Math.round(x * depthNum) / depthNum;
	};

var boundingToCoordinates = function(bounding, /*maximal long*/ max) {
		var deltaLat = bounding[2][1] - bounding[0][1];
		var deltaLng = bounding[2][0] - bounding[0][0];

		if ((deltaLat > max) || (deltaLng > max)) return false;

		var lat = bounding[0][1] + deltaLat * Math.random();
		var lng = bounding[0][0] + deltaLng * Math.random();
		var precision = Math.max(deltaLat, deltaLng);

		var depthNum = 100000;

		return [
		roundWithDepth(lat, depthNum), roundWithDepth(lng, depthNum), roundWithDepth(precision, depthNum) //accuracy
		];
	};


//var criteria = ['-74,40,-73,41']; //<-- filter by location(s) (ex: New York)

var criteria = ['gvd', 'godver', 'lijer', 'godvedomme', 'godverdorie', 'godsamme', 'krijg de kanker', 'krijg de tering', 'krijg de tyfus', 'krijg de pleuris', 'val dood', 'stik erin', 'tief op', 'tyf op', 'kanker op', 'kanker', 'tyfus', 'kenker', 'kk', 'tiefus', 'tiefes', 'tyfes', 'tifus', 'tifes', 'tering', 'mongol', 'mongool', 'debiel', 'bitch']; //<-- filter by term(s) (ex: this OR that)

//twit.stream('statuses/filter', {locations: '-180,-90,180,90'}, function(stream) { // possibilities {track: criteria} OR {locations: criteria}
watchKKTwitter = function() {
twit.stream('statuses/filter', {track: criteria}, function(stream) { // possibilities {track: criteria} OR {locations: criteria}

    stream.on('data', function (data) {
        //Check if the tweet contains language-data
        if(data.lang){
        	//Check if the tweet is posted in Dutch (or any other language of your choosing)
        	if(data.lang == "nl"){
		        var ctext = data.text;
		        var rx = new RegExp("\\b"+criteria.join('|')+"\\b","i");
		        var keywordFound = rx.exec(ctext); //returns first found keyword.
		        if(keywordFound){keywordFound = keywordFound.toString()} 
		        //var keywordFound = rx.test(ctext); //just returns true/false on keyword found.
		        //console.log("keyword gevonden "+rx.test(ctext));
		        //if (keywordFound == true) {
			   
			        
				    
			    	tweetid = data.id;
			    	var latitude;
					var longitude;
			    	
			    	var geo=false,latitude,longitude;
					if(data.geo!=null){
					    geo = true;
					    latitude = data.geo.coordinates[0];
					    longitude = data.geo.coordinates[1];
					}
					else if(data.coordinates!=null){ 
						geo = true;  
					     longitude = data.coordinates.coordinates[0];
					     latitude = data.coordinates.coordinates[1];
					}
					else if(data.place && data.place.bounding_box){
					    var boundCoordinates = boundingToCoordinates(data.place.bounding_box.coordinates[0], 2);
					    if (boundCoordinates !== false) {
					    	geo = true;
					    	latitude = boundCoordinates[0]
					    	longitude = boundCoordinates[1];
					    }
					}
			      
					if (geo || !data.user.location) {
						parseTweet(data, geo, latitude, longitude, keywordFound);
		
						io.sockets.volatile.emit('tweets', {
							user: data.user.screen_name,
							text: data.text,
							geo : geo,
							latitude: latitude,
							longitude: longitude,
							keywordFound: keywordFound
						});
					}
					else {
						geocoder.queueRequest(data.user.location, function(lat, lng) {
							
							//geo = true;
							parseTweet(data, geo, lat, lng, keywordFound);
							geo = lat && lng;
							io.sockets.volatile.emit('tweets', {
								user: data.user.screen_name,
								text: data.text,
								geo : geo,
								latitude: lat,
								longitude: lng,
								keywordFound: keywordFound
							});
						});
					}
			}
		}
			//tweetdata = [data.created_at, data.user.screen_name, data.user.name, data.user.lang, data.user.default_profile_image, data.user.followers_count, data.user.following, data.in_reply_to_status_id, data.in_reply_to_user_id, data.entities.urls, data.entities.user_mentions, data.entities.hashtags, data.in_reply_to_screen_name, data.retweeted, data.retweet_count, geo, latitude, longitude, data.text, data.source];
			
			//tweetdata = [data.created_at, data.user.screen_name, geo, latitude, longitude, data.text, data.source];
			
			//writeCache(tweetid, tweetdata);
			//client.set(tweetid, tweetdata);
		    //}

        
        
              
      //var keywordFound = false;

    // use this when tracking phrases with whitespace
    //for ( var i = 0; i < criteria.length; i++ ) {
	    //if ( ctext.toLowerCase().indexOf(criteria[i].toLowerCase()) >= 0 ) {
	    

        	//keywordFound = true;
        //break;
      //}
    //}

   
    });
});
}

parseTweet = function(tweet, geo, latitude, longitude, keywordFound) {
   if(!tweet.text) {
      return;
   }

// store the body of the tweet
   var text = tweet.text;
   var usernames = twittertxt.extractMentions(tweet.text);
   var hashtags = twittertxt.extractHashtags(tweet.text)

// if this fails these checks it does not hold any data I want
   // for now I only work with english tweets.
   /* if(text.match(/bnikeplusb/) && text.match(/bfinishedb/)) {

		  var complete = 0,
		     words = text.split(' '),
		     distance,
		     i = words.length;
		
		  // check for every word if its 'km' / 'mi' followed by 'run'
		  // if it is parse the value (in km) * 100 to int
		  while(--i) {
		     // check for metric system
		     if(words[i] === 'km' && words[i+1] === 'run') {
		
		        // parse the distance
		        var d = words[i-1];
		        d = d.replace(',', '.');
		        d = parseFloat(d).toFixed(2);
		        distance = parseInt(d * 100);
		
		        // else check for english system
		     } else if(words[i] === 'mi' && words[i+1] === 'run') {
		
		        // parse the distance
		        var d = words[i-1];
		        d = d.replace(',', '.');
		        // 1.609344 mile = 1 km
		        d = parseFloat(d).toFixed(2) * 1.609344;
		        distance = parseInt(d * 100);
		     }
		
		  }*/

	  // get everything we want to store
	  var user = tweet.user,
	     t = [ 
	     tweet.user.screen_name, 
	     tweet.user.name,
	     user.id, 
	     tweet.id_str, 
	     tweet.created_at, 
	     text,
	     usernames.toString(),
	     hashtags.toString(),
		 keywordFound,
	     tweet.lang,
	     user.followers_count, 
	     user.statuses_count,
	     user.following,
	     user.in_reply_to_status_id,
	     user.in_reply_to_user_id,
	     user.in_reply_to_screen_name,
	     user.source,
	     user.retweet_count,
	     user.retweeted,
	     user.default_profile_image,
	     user.description,
	     geo,
	     latitude,
	     longitude 
	  ];
	  // add it to the DB
	  insertTweet(t);
	//} 
}

			

insertTweet = function(tweet) {
   // build query and run
   client.query('INSERT INTO tweets SET username = ?, name = ?, userid = ?, tweetID = ?, date = ? , tweet = ?, tusernames = ?, thashtags = ?, keywordFound = ?, lang = ?, userfollowercount = ?, userstatuscount = ?, following = ?, in_reply_to_status_id = ?, in_reply_to_user_id = ?, in_reply_to_screen_name = ?, source = ?, retweet_count = ?, retweeted = ?, default_profile_image = ?, description = ?, geo = ?, latitude = ?, longitude = ?', tweet,
      function(error, results) {
         if(error) {
            console.log("ClientReady Error: " + error.message + 'at: ' + tweet[3]);
         } else {
            console.log('tweet added at: ' + tweet[3]);
         }
      }
   );
}
