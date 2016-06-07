# ChargeOver_nodejs

This is a Node.js library for the ChargeOver recurring billing platform. ChargeOver is a billing platform geared towards easy, automated, recurring invoicing.

Use ChargeOver to:

painlessly automate your recurring invoicing
allow your customers to log in to a customized portal to view and pay their bills online
automatically follow up on late and missed payments
build developer-friendly billing platforms (use the ChargeOver REST APIs, code libraries, webhooks, etc.)
sync customer, invoice, and payment information to QuickBooks for Windows and QuickBooks Online
ChargeOver developer documentation:

REST API: https://developer.chargeover.com/apidocs/rest/

## How to Use

1. Include chargeOver file

``` 
var chargeOver = require('chargeOver');
```

2. Set chargeOver options for chargeOver customer

```
chargeOver.setOptions('username', 'password', true, 'somthing.chargeover.com');
```

setOptions function parameters are:

```
i. username // Username/public_key for chargeover
ii. password // Password/private_key for ChargeOver
iii. basic_auth  // Boolean value for authentication type. (basic_auth / COv1)
iv. url // chargeOver url
```

3. Call methods

```
chargeOver.getItems();
```

These methods will return a promise object.