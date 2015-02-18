var cluster = require('cluster'),
    usecluser = true;

exports.CEM = {
    CEM_OK:1,
    CEM_MONGO_CONNECT_ERR:101
};

//launches the server and calls client back passing express app and the cluster if clustering is on
exports.Launch = function (blnUseClustering, port, oauthMongoConnectionString, blnShowDebugMessages,cbInfo, cbReady) {
    
    blnUseClustering = blnUseClustering || false;
    oauthMongoConnectionString = oauthMongoConnectionString || '';
    blnShowDebugMessages = blnShowDebugMessages || false;

    if (blnUseClustering) {
        
        if (cluster.isMaster) {
            
            //get number of cpu on server
            var cpuCount = require('os').cpus().length;
            
            // Create a worker for each CPU
            for (var i = 0; i < cpuCount; i += 1) {
                //fork can take a key/value pairs to set in worker's env
                //fork can only be called in master
                cluster.fork();
            }
            
            //if a worker dies then replace it, workers can commit suicide so we need to cater for that
            cluster.on('exit', function (worker) {
                cbInfo(exports.CEM.CEM_OK, 'Worker id: ' + worker.id + ' has been replace.');
                cluster.fork();
            });



        } else {
            //this will run in the context of a worker process 
            listen();
        }
    } else {
        //debug single core instance
        listen();
    }
    

    function listen() {
        
        var express = require('express');
        var bodyParser = require('body-parser');
        var oauthserver = require('node-oauth2-server');
        
        // Create a new Express application
        var app = express();        
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({
            extended: true
        }));
        
        //if we get passed a mongo connection string then we'll assume
        //its a valid oauth db in mongo
        if (oauthMongoConnectionString.length > 0) {

            var model = require('./model.js');
            model.init(oauthMongoConnectionString, blnShowDebugMessages, function(err) {
                if (err) {

                    cbInfo(exports.CEM.CEM_MONGO_CONNECT_ERR, err);

                } else {

                    
                    app.oauth = oauthserver({
                        model: model, // See below for specification
                        grants: ['password', 'refresh_token'],
                        debug: false
                    });

                    //setup the oauth/token url
                    app.all('/oauth/token', app.oauth.grant());

                    // Allows user to hook up their own endpoints
                    cbReady(app, cluster);
                    
                    // Bind to a port
                    app.listen(port);

                    if (blnUseClustering)
                        cbInfo(exports.CEM.CEM_OK, "Worker " + cluster.worker.id + " running");
                    else
                        cbInfo(exports.CEM.CEM_OK, "Single Instance running");
                }
            });

        } else {
            
            if (blnUseClustering)
                cbInfo(exports.CEM.CEM_OK, "Worker " + cluster.worker.id + " running");
            else
                cbInfo(exports.CEM.CEM_OK, "Single Instance running");

            // Allows user to hook up their own endpoints
            cbReady(app, cluster);
            
            // Bind to a port
            app.listen(port);            
        }
        
    }
   
}

//stores json object in a sqlite3 db file
exports.JSONCache = function () {
    
    var sqlite3 = require('sqlite3').verbose();
    var dbpath = __dirname + '/cache/sqlite3cache.db';
    
    function isInt(value) {
        return !isNaN(value) && 
         parseInt(Number(value)) == value && 
         !isNaN(parseInt(value, 10));
    }
    
    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }
     
    //todo prevent sql injections
    //todo, deleteByQuery, deleteById
    return {
        store: function (jsonObject, expiryStamp, cbSuccess, cbError) {
            
            var db = new sqlite3.Database(dbpath);
            
            //we have to have an expiryStamp either 0 or some date
            if (jsonObject.hasOwnProperty('expiryStamp') == false && expiryStamp!=null)
                jsonObject.expiryStamp = expiryStamp;
            else if (jsonObject.hasOwnProperty('expiryStamp') == false && expiryStamp == null)
                jsonObject.expiryStamp = 0;
            else if (jsonObject.hasOwnProperty('expiryStamp') && expiryStamp != null)
                jsonObject.expiryStamp = expiryStamp;
            else
                jsonObject.expiryStamp = 0;

            db.serialize(function () {
                
                db.run("CREATE TABLE if not exists user_store (data TEXT)");
                
                var statement = "INSERT INTO user_store VALUES (?)";
                var stmt = db.prepare(statement);
                
                stmt.run(JSON.stringify(jsonObject), function (o) {
                    if (o != null) {
                        if (typeof(cbError)=="function")
                            cbError(o);
                    } else {
                        if (typeof(cbSuccess) == "function")
                            cbSuccess(this.lastID);
                    }
                });
                
                stmt.finalize();
        
            });
            
            db.close();
        },
        getById: function (id, cbSuccess, cbNotFound) {
            
            var db = new sqlite3.Database(dbpath);
            var moment = require('moment');
            if (isInt(id)) {
                db.serialize(function () {
                    
                    db.run("CREATE TABLE if not exists user_store (data TEXT)");
                    
                    db.all("SELECT data FROM user_store where rowid=" + id, function (err, rows) {
                        
                        if (err || rows.length == 0) {
                            cbNotFound();
                            return;
                        }
                        
                        var s = JSON.parse(rows[0].data);
                        
                        if (s.expiryStamp != 0) {
                            var now = new Date();
                            var end = moment(s.expiryStamp);
                            var n = moment.duration(end.diff(now)).asMinutes();
                            if (n >= 0) {
                                //found a valid data
                                cbSuccess(s);
                    
                            } else {
                                //delete row, wont delete all 
                                db.exec("DELETE FROM user_store WHERE sid=" + sid);
                                cbNotFound();
                            }

                        } else {
                            cbSuccess(s);
                        }

            
                    });
                    
                    db.close();
       
                });

            } else {
                cbNotFound('Id must be integer.');
            }

        },
        getByQuery: function (q, cb) { //q is a single json keyvalue pair like id:100
            var db = new sqlite3.Database(dbpath);
            
            if (q.indexOf(':') != -1) {
                q = q.replace(':', '%');
                db.serialize(function () {
                    db.run("CREATE TABLE if not exists user_store (data TEXT)");
                    var fq = "SELECT data FROM user_store where data LIKE '%" + q + "%'";
                    db.all(fq, function (err, rows) {
                        cb(err, rows);
                    });
                });
            } else {
                cb('Query not valid, must be a Key/Value pair string,e.g. "id:1" ');
            }
            db.close();
        },
        purgeAll: function () {
            var db = new sqlite3.Database(dbpath);
            db.exec('DELETE FROM user_store');
        }
    }
    


}




