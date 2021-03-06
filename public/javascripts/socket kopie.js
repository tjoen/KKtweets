var socket = io.connect()
    , map
    , markersArray = []
    , heatmapArr = []
    , aTweet
    , heatmap
    , focusLocation
    , totalNogeoTweets = 0
    , totalgeoTweets = 0
    , limitTweetsTable = 100
    , limitMarkers = 1000
    , totalTweets = 0;

jQuery(function ($) {

    handleResetUiButton();

    //Map setup
    focusLocation = new google.maps.LatLng(43.73, 7.41); // focus on New York
    var mapOptions = {
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.SATELLITE,
        center: focusLocation,
        disableDefaultUI: false,
        scrollwheel: false,
        draggable: false,
		navigationControl: false,
		mapTypeControl: false,
		scaleControl: false,
		disableDoubleClickZoom: true,
		streetViewControl: false,
        panControlOptions: false,
        zoomControl:false
    };
    map = new google.maps.Map(document.getElementById('map'),mapOptions);

//var heatmap = new google.maps.visualization.HeatmapLayer({
//  data: heatmapArr,
//  radius: 16,
//  dissipate: false,
//  maxIntensity: 8,
//  opacity:0.4,
//  gradient: [
//  	'rgba(0, 0, 0, 0)',
//  	'rgba(255, 255, 255, 255)',
//  	'rgba(241, 200, 200, 200)'
//  ]
//});
//heatmap.setMap(map);

var heatmap = new HeatmapOverlay(map, {
        "radius":10,
        "visible":true, 
        "opacity":85,
         "gradient": { 0.0: "rgb(0,0,0)", 0.2: "rgb(200,200,200)", 1.0: "rgb(255,255,255)" }
    });
    
    google.maps.event.addListenerOnce(map, "idle", function(){
        // this is important, because if you set the data set too early, the latlng/pixel projection doesn't work
        //heatmap.setDataSet(heatmapArr);
    });

    // Socket.io setup
    var tweetsWithoutGeoTable = $("#nogeotweetstable").find('tbody');
    var tweetsWithGeoTable = $("#geotweetstable").find('tbody');

    socket.on('tweets', function (data) {
        updateTotalTweets();
        aTweet = '<tr><td><a href="https://twitter.com/' +data.user+'" target="_blank">' + data.user + '</a>' + '</td><td>' + data.text + '</td></tr>';
        if(data.geo){
            updateTotalTweetsWithGeo();
            // Add a marker to the map
            //addMarker(data.latitude,data.longitude,data.user,data.text);
            //heatmapArr.push(new google.maps.LatLng(data.latitude, data.longitude));

            heatmap.addDataPoint(data.latitude, data.longitude);

            // Check table limit
            if(totalgeoTweets >= limitTweetsTable){ // table limit
                removeTableRow($("#geotweetstable"));
            }
            // add it to the table
            tweetsWithGeoTable.prepend(aTweet);
        } else {
            updateTotalTweetsWithoutGeo();
            // Check Limit
            if(totalNogeoTweets >= limitTweetsTable){
                removeTableRow($("#nogeotweetstable"));
            }
            // add it to the table
            tweetsWithoutGeoTable.prepend(aTweet);
        }
    });
});

/**
 * Updating the global tweet counter
 *
 */
function updateTotalTweets() {
    totalTweets = totalTweets + 1;
    $("span#totaltweet").html(totalTweets);
}

/**
 * Updating geatagged tweets counter
 *
 */
function updateTotalTweetsWithGeo() {
    totalgeoTweets = totalgeoTweets + 1;
    $("span#totaltweetWithGeo").html(totalgeoTweets);
}

/**
 * Updating  tweets counter without geotag
 *
 */
function updateTotalTweetsWithoutGeo() {
    totalNogeoTweets = totalNogeoTweets + 1;
    $("span#totaltweetWithoutGeo").html(totalNogeoTweets);
}


/**
 * Adding a new marker to the map
 *
 * @param latitude
 * @param longitude
 * @param user
 * @param text
 */
function addMarker(latitude,longitude,user,text){
    var infowindow = new google.maps.InfoWindow();
    infowindow.setContent('<a href="https://twitter.com/' +user+'" target="_blank">' + user + '</a> says: '+ '<p>'+ text+'</p>');
    var marker = new google.maps.Marker({
        map:map,
        draggable:false,
        animation: google.maps.Animation.DROP,
        position: new google.maps.LatLng(latitude,longitude)
    });

    if(markersArray.length >= limitMarkers){
        markersArray[0].setMap(null);
        markersArray.shift();
    }
    markersArray.push(marker);
    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
}


/**
 * Remove last table row
 *
 * @param a Table
 */
function removeTableRow(jQtable){
    jQtable.each(function(){
        if($('tbody', this).length > 0){
            $('tbody tr:last', this).remove();
        }else {
            $('tr:last', this).remove();
        }
    });
}

/**
 * Reseting the UI:
 * - Clear map.
 * - Clear tables
 * - Reset tweet counters.
 */
function handleResetUiButton(){
    $("#clearMapButton").click(function (e) {
        e.preventDefault();
        // Clear the map
        if (markersArray) {
            for (i in markersArray) {
                markersArray[i].setMap(null);
            }
            markersArray.length = 0;
            totalNogeoTweets = 0;
            totalgeoTweets = 0;
            totalTweets = 0;
            $("span#totaltweet").html('0');
            $("span#totaltweetWithGeo").html('0');
            $("span#totaltweetWithoutGeo").html('0');
        }
        // Clear the tables
        $('#geotweetstable tbody').empty();
        $('#nogeotweetstable tbody').empty();
    });
}