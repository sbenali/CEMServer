//an example of how to use the server
//mongo oauth2 clusterable express server  
var server = require('./cemserver.js');
var ping = require('./routes/ping.js');
var oauthping = require('./routes/oauth-ping.js');


//although the oauth backend for this server is using the mongodb model
//you can use others, see https://www.npmjs.com/package/node-oauth2-server
//some of the options are memory, postgresql,
//if you dont have a need for oauth2 then you can simply make null the connection string below 
var mongocn = 'mongodb://localhost:27017/oauth_db',
    port = 3700,
    useCluster = true, //NB: while this is true, in visual studio 2013+ you must use Ctrl+F5
    showdbg = false;

/*parameters are: 
 * blnUseClustering: if true will fork workers for the number of cpu on server
 * port: is the port number for a single instance or multiple instances to listen on
 * oauthMongoConnectionString: an accessible mongodb database connection, you must put the database name
 * blnShowDebugMessages: console.log information
 * cbInfo: passes a text message and number, any number greater than 100 is an error, server is not running
 * cbReady: called when the server is ready, its the place to hook end points
 */
server.Launch(useCluster, port, mongocn, showdbg, function(code,msg) {
    
    if (code != server.CEM.CEM_OK) {
        //error 
        console.log("ERROR: " + msg);
    } else {
        //normal messages, could include warnings
        //cbReady should execute now(ish)
        console.log(msg);        
    }

}, function (app, cluster) {

    //if all is ok then we'll get this callback giving us the cluster, if not used then this is null
    //app is the express app 
    
    //we could pass the cluster or worker to the routes if required, but should be avoided
    var wid = cluster.worker == undefined ? 'SINGLE_INSTANCE' : cluster.worker.id;

    //ping and oauth-ping are examples of how to setup the middleware 
    //an example without oauth security, we pass params to our middleware which needs to be
    //setup as a function that can take any params we need to define
    app.use('/ping', ping(app, wid));
    
    //using oauth, clearly if you do not provide a mongodb connection string
    //then doing this would raise an error see node-oauth2-server docs    
    app.use('/oauthping', app.oauth.authorise(), oauthping(app, wid));



});

