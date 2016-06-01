/**
 *	ChargeOver nodejs library
 *	@author Sandip Nirmal
 */


// Add required depandancies
var https = require('https');
var crypto = require('crypto-js');
var Q = require('q');
var bl = require('bl');

// Username/public_key for chargeover
var user,
    // Password/private_key for ChargeOver
    password,
    // Boolean value for authentication type. (basic_auth / COv1)
    basic_auth,
    // Your company Endpoint Url for accessing ChargeOver
    chargrOver_endpoint;

// Expose methods publicly
module.exports = {
    setOptions: setChargeOverOptions,
    createItem: createItem,
    getItems: listItems
};


/**
 * Set ChargeOver options parameter values
 * @param {string} user - username for chargeOver
 * @param {string} pass - passowrd for chargeOver
 */
function setChargeOverOptions(user, pass, basic_auth, endpoint) {
    'use strict';

    user = user;
    password = pass;
    basic_auth = basic_auth;
    chargrOver_endpoint = endpoint;
}

/**
 * Prepares request object required by chargeOver using passed parameters
 * @param  {String} type - HTTP request type
 * @param  {String} url - request url
 * @param  {Object} data - request data
 * @return {Object}
 * @private
 */
function _prepareChargeOverRequest(type, url, data) {
    'use strict';

    var hostName = chargrOver_endpoint,
        protocol = 'https://';

    return {
        hostname: hostName,
        path: url,
        method: type,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': basic_auth
            							? _buildBasicAuthToken()
            							: _makeAuthSignature(protocol + hostName + url, data)
        }
    };
}

/**
 * Creates HTTP basic authentication token by encrypting username, password
 * combination with base64 encryption.
 * Authentication key : 'Basic base64(username:password)'
 * @return {String} authToken
 * @private
 */
function _buildBasicAuthToken() {
    'use strict';

    var authString = crypto.enc.Utf8.parse(user + ':' + password);
    return 'Basic ' + crypto.enc.Base64.stringify(authString);
}

/**
 * Generate the COv1 authorization key
 * @param {String} url - API URL
 * @param {Object} data
 * @return {string|*} - COv1 authorization key
 * @private
 */
function _makeAuthSignature(url, data) {
    'use strict';

    var requestUrl = url.toLocaleLowerCase(),
        nonce = _randomString(9), // Unique key for request
        time = _getTime(), // Current timestamp
        sep = '||', // Separator (delimator)
        requestData = data,
        msgString = user + sep + requestUrl.toLowerCase() + sep + nonce +
        sep + time + sep,
        signature,
        auth_header;

    // for POST/PUT requests, we need to add request data while generating
    // HMAC signature for request
    if (requestData) {
        msgString += requestData;
    }

    // HMAC SHA265 Signature
    signature = _getHMACSignature(msgString, password);

    auth_header = "ChargeOver co_public_key=\"" +
        user +
        "\" co_nonce=\"" +
        nonce +
        "\" co_timestamp=\"" +
        time +
        "\" co_signature_method=\"HMAC-SHA256\" " +
        "co_version=\"1.0\" co_signature=\"" + signature + "\"";

    return auth_header;
}

/**
 * Generates a nonce of desired length for cryptography
 * @param {Number} length
 * @return {string}
 * @private
 */
function _randomString(length) {
    'use strict';

    var uniqueText = '';
    var text = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
        uniqueText += text.charAt(Math.floor(Math.random() * text.length));
    }
    return uniqueText;
}

/**
 * Generates a message with HMAC key by applying SHA256 encryption
 * @param {String} msg
 * @param {String} privateKey
 * @return {String}
 * @private
 */
function _getHMACSignature(msg, privateKey) {
    'use strict';

    return crypto.enc.Hex.stringify(crypto.HmacSHA256(msg, privateKey));
}

/**
 * Returns current timestamp in seconds
 * @return {Number}
 * @private
 */
function _getTime() {
    'use strict';
    return Math.floor((new Date().getTime()) / 1000);
}

/**
 * Create new item, product or discount. It will return item_id with newly
 * created item.
 * @param  {Object}
 * @return {Promise}
 */
function createItem(args) {
    'use strict';

    var deferred = Q.defer();
    // Post data for item creation, replace following values form function
    // arguments
    var postData = {
        "name": "My Test Item 832", // Item name
        "type": "service", // Item type
        "pricemodel": {
            "base": 295.95, // Base price for item
            "paycycle": "mon", // Pay cycle
            "pricemodel": "fla" // pricing model
        }
    };

    var createItemRequest = _prepareChargeOverRequest('POST',
    																							'/api/v3/item', postData);

    var httpReq = https.request(options, function(res) {
    	'use strict';

    	res.pipe(bl(function(err, body) {
        if (!err) {
          var bodyObj = JSON.parse(body);

          if ((bodyObj.status).toLowerCase() === 'error') {
            deferred.reject({'statusCode': bodyObj.code,
              'res': { 'status': bodyObj.message}});
          } else {
          	args.itemId = bodyObj.response.item_id;
            deferred.resolve(args);
          }
        } else {
          console.log('error occurred while creating new item', err);
          deferred.reject({'statusCode': 500,
            'res': { 'status': 'Internal Server Error!'}});
        }
      }));
    });

    httpReq.write(JSON.stringify(postData));
    httpReq.end();

    httpReq.on('error', function(err) {
        console.log('Error occurred while creating new item', err);
    });

    return deferred.promise;
}

/**
 * Returns list of all items available on ChargeOver
 * @return {Object | Promise}
 */
function listItems() {
    'use strict';

    var deferred = Q.defer();
    var options = _prepareChargeOverRequest('GET', '/api/v3/item', null);

    var httpReq = https.request(options, function(res) {
    	'use strict';

        res.pipe(bl(function(err, body) {
            if (!err) {
                var bodyObj = JSON.parse(body);
                if ((bodyObj.status).toLowerCase() === 'error') {
                    deferred.reject({
                        'statusCode': 400,
                        'res': { 'status': bodyObj.message }
                    });
                } else {
                    deferred.resolve(bodyObj.response);
                }
            } else {
                deferred.reject({
                    'statusCode': 500,
                    'res': { 'status': 'Internal Server Error!' }
                });
            }
        }));
    });

    httpReq.end();

    httpReq.on('error', function(err) {
        console.log('Error fetching items from ChargeOver ' + err);
    });
    return deferred.promise;
}

/**
 * Creates new customer on ChargeOver
 * @return {Object | promise}
 */
function createCustomer() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Returns customer details from ChargeOver
 * @return {Object | promise}
 */
function getCustomer() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Updates customer details on ChargeOver
 * @return {Object | promise}
 */
function updateCustomer() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Creates new recurring subscription for customer on ChargeOver
 * @return {Object | promise}
 */
function createSubscription() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Returns subscription detailsfrom ChargeOver
 * @return {Object | promise}
 */
function getSubscription() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Cancels recurring subscription from ChargeOver
 * @return {Object | promise}
 */
function cancelSusbscription() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Create new invoice for subscription
 * @return {Object | promise}
 */
function createInvoice() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Returns invoice details from ChargeOver
 * @return {Object | promise}
 */
function getInvoice() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Mark Invoice void
 * @return {Object | promise}
 */
function voidInvoice() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Create new transaction on ChargeOver for recurring subscription
 * @return {Object | promise}
 */
function createNewTranasaction() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Returns transaction details from ChargeOver
 * @return {Object | promise}
 */
function getTransaction() {
    'use strict';

    console.log('Methot not imeplementated');
}

/**
 * Issue refund for transaction
 * @return {Object | promise}
 */
function refundTransaction() {
    'use strict';

    console.log('Methot not imeplementated');
}

