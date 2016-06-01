/**
 * Index.js
 */
var chargeOver = require('./src/chargeOver');

// Set initial values required for ChargeOver
chargeOver.setOptions('username', 'password', true, 'somthing.chargeover.com');

chargeOver.getItems();