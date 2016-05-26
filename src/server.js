/**
 *	ChargeOver nodejs library
 *	@author Sandip Nirmal
 */

// Add required depandancies
var https = require('https');
var crypto = require('crypto-js');
// var Q = require('q');
// var bl = require('bl');


module.exports = function ChargeOver() {
    'use strict';

    // Username/public_key for chargeover
    var user,
        // Password/private_key for ChargeOver
        passwod,
        // Boolean value for authentication type. (basic_auth / COv1)
        basic_auth,
        // Your company Endpoint Url for accessing ChargeOver
        chargrOver_endpoint;

    /**
     * Set ChargeOver options parameter values
     * @param {string} user - username for chargeOver
     * @param {string} pass - passowrd for chargeOver
     */
    function setChargeOverOptions(user, pass, basic_auth, endpoint) {
        'use strict';

        user = user;
        passwod = pass;
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

        var authString = CryptoJS.enc.Utf8.parse(user + ':' + password);
        return 'Basic ' + CryptoJS.enc.Base64.stringify(authString);;
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

        return CryptoJS.enc.Hex.stringify(CryptoJS.HmacSHA256(msg, privateKey));
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

    return {
        setOptions: setChargeOverOptions
    };
}
