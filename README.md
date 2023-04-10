# TGTG-JS

This package is an unofficial client for the TooGoodToGo API. It allows you to interact with the API to fetch
information about available products, manage orders, and more.

## Installation

```
npm install tgtg-js
```

## Usage

Here is an example of using this client to log in and fetch available items near a given geographical position:

```javascript
const TgtgClient = require('<package_name>');

const client = new TgtgClient({
    email: 'your_email@example.com',
});

client.login()
    .then(() => {
        return client.get_items(48.8566, 2.3522, 10);
    })
    .then(items => {
        console.log(items);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
```

## Available Methods

### login()

Authenticates the client with the API using the email address provided during initialization. This method must be called
before using other methods of the class. If an access_token and refresh_token are provided during initialization, this
method will attempt to refresh the access_token if needed.

### refresh_access_token()

Refreshes the access_token using the current refresh_token. This method is automatically called by the login() method if
needed.

### get_items(latitude, longitude, radius)

Fetches available items near a given geographical position.
<ul>
    <li><strong>latitude</strong> (Number): Latitude of the geographical position.</li>
    <li><strong>longitude</strong> (Number): Longitude of the geographical position.</li>
    <li><strong>radius</strong> (Number): Search radius in kilometers.</li>
</ul>

Returns a promise that resolves an array of objects representing the available items.

## Configuration Options
During the initialization of the client, you can provide an options object to configure the behavior of the client. The available options are as follows:
<ul>
    <li><strong>email</strong> (String): The email address to use for authentication.</li>
    <li><strong>access_token</strong> (String): An existing access_token (optional).</li>
    <li><strong>refresh_token</strong> (String): An existing refresh_token (optional).</li>
    <li><strong>user_id</strong> (String): An existing user_id (optional).</li>
    <li><strong>cookie</strong> (String): An existing cookie (optional).</li>
    <li><strong>access_token_lifetime</strong> (Number): Lifetime of the access_token in seconds (default: 4 hours).</li>
    <li><strong>device_type</strong> (String): Device type to use for authentication (default: 'ANDROID').</li>
    <li><strong>user_agent</strong> (String): User-Agent to use for requests (default: randomly generated from a predefined list).</li>
    <li><strong>language</strong> (String): Language to use for requests (default: 'en-UK').</li>
    <li><strong>proxies</strong> (Array): List of proxies to use (optional).</li>
    <li><strong>timeout</strong> (Number): Maximum timeout for requests in milliseconds (optional).</li>
</ul>
