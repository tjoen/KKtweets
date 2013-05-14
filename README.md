## Description:
TweetMapViewer is a simple Dashboard like web application that tracks and represents geo-tagged tweets on a map in real time.
This is a node.js application that uses twitter public stream api with a filter criteria(In my case the New york state).
Those are the frameworks & technologies used to develop this application:

### Server side:
- Node.js.
- Express framework to create & configure the web server.
- nTwitter to access the Twitter stream API.
- ejs as a templating engine.
- socket.io for the pushing mechanism.

### Client side:
- Twitter Bootstrap.
- JQuery.
- Google map api v3.
- HTML5.
- CSS.

## Screenshot:

<img src="https://raw.github.com/maachou/TweetMapViewer/master/screenshot.png" border="0" />

## Demo:

A demo of the application is accessible via this link :

http://www.twitterook.nl


## Configuration:
If you like to run the app on your machine you have to go through some configuration steps:

1. Checkout the project:
```text
git clone https://github.com/tijevlam/TweetMapViewer.git
```
2. Go to https://dev.twitter.com/apps/new and register an application.
A set of keys will be created for you so you can use them in the next step.

3. In app.js fill in: 
- The Consumer key.
- The Consumer secret.
- The Access token.
- The Access token secret.

```text
var twit = new twitter({
    consumer_key: 'CONSUMER_KEY_HERE',
    consumer_secret: 'CONSUMER_SECRET_HERE',
    access_token_key: 'ACCESS_TOKEN_KEY_HERE',
    access_token_secret: 'ACCESS_TOKEN_SECRET_HERE'
});
``` 

## Running the application:
1. Install the dependencies: 
```
npm install
```
2. Run the application: 
```
node app.js
```






