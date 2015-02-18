var express = require('express');
var router = express.Router();




function oauthping(app, wid) {
    
    return function (req, res, next) {
        
        var msg = {
            workerId: wid,
            text: 'ok'
        }
        res.json(msg);
        next();
    }
        
}


module.exports = oauthping;