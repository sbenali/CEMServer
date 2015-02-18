var express = require('express');
var router = express.Router();
var cache = require('../CEMServer.js').JSONCache();



function ping(app, wid) {
    
    return function (req, res, next) {

        //example of to save using the jsoncache
        cache.store({ msg: '1', workerid: wid });

        res.json({ msg: '1', workerid: wid });
        next();        
    }
        
}


module.exports = ping;