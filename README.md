﻿# Cluster enabled Express Server with OAuth2
---
#### A simple express server with some useful features
1. Easily enable clustering for all your Express end points
2. Easily cache JSON data and retrieve, uses sqlite3
3. Easily enable OAuth2 Authentication on any end point


### Very basic usage
	..see the file app.js for a full example of the basic usage

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
	once you have cloned the repository you can simply type
	`npm install` at the root in order to install the required
	node modules