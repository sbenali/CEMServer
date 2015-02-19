# NodeJS Cluster enabled Express Server with OAuth2
---
#### A simple express server with some useful features
1. Easily enable clustering for all your Express end points
2. Easily cache JSON data and retrieve, uses sqlite3
3. Easily enable OAuth2 Authentication on any end point


### Very basic usage
	..See the file (CEMServer/app.js) which is also available in (npm/sample.js) for a full example of the basic usage

## Using the express server
```javascript
	var server=require('./CEMServer.js');
	server.Launch(true,'mongodb://localhost/db1',function(code, info){
		//access informational messages or error messages
	},function(app,cluster){
		//here you can app.use and access the cluster object
		//app has an object from node-oauth2-server called oauth
		//which can be used to authenticate any end point..see app.js
	});
```	


### Installing
	> Using npm
		You can install this module with the following
		`npm install cemserver` or `npm install cemserver@0.0.1`

	> Cloning this repo
		once you have cloned the repository you can simply type
		`npm install` at the root in order to install the required
		node modules
---
### Dependencies
	1. Latest version of ExpressJS ("^4.11.2")
		**body-parser ("^1.12.0")
	2. Latest version of jasmine-node ("^1.14.5")
    3. Latest version of moment ("^2.9.0")
    4. mongoose specific version "3.8.23"
    5. Latest version of node-oauth2-server ("^2.2.2")
    6. Latest version of sqlite3 ("^3.0.5")
---
### Platform
	Although this has only been tested on Windows 7, with node v0.10.28, I have
	been careful in choosing cross-platform modules and in theory this code
	should function on Linux