/**
 * Copyright 2013-present NightWorld.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

//SB - I have edited some of the methods here so as to use the mongoose query object
//instead of the find methods on the model objects
//todo: make debug messages optional
var mongoose = require('mongoose'),
  Schema = mongoose.Schema,
  model = module.exports;

model.ShowDebugMessages = false;

model.init=function(connectionString, blnShowDebugMessages, cbDbConnected) {
    // Makes connection asynchronously. Mongoose will queue up database
    // operations and release them when the connection is complete.
    mongoose.connect(connectionString, function (err, res) {
        if (err) {
            cbDbConnected('ERROR connecting to OAuth DB: ' + connectionString + '. ' + err);
            
        } else {
            
            model.connected = true;
            model.ShowDebugMessages = blnShowDebugMessages;
            cbDbConnected(null);

        }
    });

}



//
// Schemas definitions
//
var OAuthAccessTokensSchema = new Schema({
  accessToken: { type: String },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthRefreshTokensSchema = new Schema({
  refreshToken: { type: String },
  clientId: { type: String },
  userId: { type: String },
  expires: { type: Date }
});

var OAuthClientsSchema = new Schema({
  clientId: { type: String },
  clientSecret: { type: String },
  redirectUri: { type: String }
});

var OAuthUsersSchema = new Schema({
  username: { type: String },
  password: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  email: { type: String, default: '' }
});

mongoose.model('OAuthAccessTokens', OAuthAccessTokensSchema);
mongoose.model('OAuthRefreshTokens', OAuthRefreshTokensSchema);
mongoose.model('OAuthClients', OAuthClientsSchema);
mongoose.model('OAuthUsers', OAuthUsersSchema);

var OAuthAccessTokensModel = mongoose.model('OAuthAccessTokens'),
  OAuthRefreshTokensModel = mongoose.model('OAuthRefreshTokens'),
  OAuthClientsModel = mongoose.model('OAuthClients'),
  OAuthUsersModel = mongoose.model('OAuthUsers');

//
// node-oauth2-server callbacks
//
model.getAccessToken = function (bearerToken, callback) {

  if(model.ShowDebugMessages) console.log('in getAccessToken (bearerToken: ' + bearerToken + ')');

  var query = OAuthAccessTokensModel.$where('this.accessToken == "' + bearerToken + '"');

    query.findOne(function(err, res) {
        if (err) callback(err);
        callback(null, res);
    });
};

model.getClient = function (clientId, clientSecret, callback) {

    if (model.ShowDebugMessages) console.log('in getClient (clientId: ' + clientId + ', clientSecret: ' + clientSecret + ')');
    
    if (clientSecret === null) {
    return OAuthClientsModel.findOne({ clientId: clientId }, callback);
    }

    //OAuthClientsModel.all()
    var query = OAuthClientsModel.$where('this.clientId == ' + clientId);
    query.findOne(function(err, res) {
        if (err) callback(err);
        callback(null, res);        
    });
};

// This will very much depend on your setup, I wouldn't advise doing anything exactly like this but
// it gives an example of how to use the method to resrict certain grant types
// sb-we could load clients/allowed grant types from server config or db
var authorizedClientIds = ['101071'];

model.grantTypeAllowed = function (clientId, grantType, callback) {
    
    if (model.ShowDebugMessages) console.log('in grantTypeAllowed (clientId: ' + clientId + ', grantType: ' + grantType + ')');

    if (grantType === 'password') {
        return callback(false, authorizedClientIds.indexOf(clientId) >= 0);
    }

    callback(false, true);
};

model.saveAccessToken = function (token, clientId, expires, userId, callback) {
    if (model.ShowDebugMessages) console.log('in saveAccessToken (token: ' + token + ', clientId: ' + clientId + ', userId: ' + userId + ', expires: ' + expires + ')');

    var accessToken = new OAuthAccessTokensModel({
        accessToken: token,
        clientId: clientId,
        userId: userId,
        expires: expires
    });

    accessToken.save(callback);
};

/*
 * Required to support password grant type
 */
model.getUser = function (username, password, callback) {
    if (model.ShowDebugMessages) console.log('in getUser (username: ' + username + ', password: ' + password + ')');

    OAuthUsersModel.findOne({ username: username, password: password }, callback);
};

/*
 * Required to support refreshToken grant type
 */
model.saveRefreshToken = function (token, clientId, expires, userId, callback) {
    if (model.ShowDebugMessages) console.log('in saveRefreshToken (token: ' + token + ', clientId: ' + clientId +', userId: ' + userId + ', expires: ' + expires + ')');

    var refreshToken = new OAuthRefreshTokensModel({
        refreshToken: token,
        clientId: clientId,
        userId: userId,
        expires: expires
    });

    refreshToken.save(callback);
};

model.getRefreshToken = function (refreshToken, callback) {
    if (model.ShowDebugMessages) console.log('in getRefreshToken (refreshToken: ' + refreshToken + ')');

    OAuthRefreshTokensModel.findOne({ refreshToken: refreshToken }, callback);
};
