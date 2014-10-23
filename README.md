Hypermedia
==========

Hypermedia is a utility library for Coast (https://github.com/coastjs/coast).
Paired with Coast, it enables full-stack, Javascript web API development.
Features:
+ Hypermedia API Client
+ HTTP API Client
+ HTTP API Server Middleware (CORS, Hypermedia)
+ HTTP API DSL
+ RFC 2046 Multipart En/Decoder
+ RFC 3986 URI En/Decoder
+ RFC ???? JSON Navigation Application Language (NavAL) En/Decoder
+ Node.JS/Browser (sans IE) Support

## Install

    npm install hypermedia --save

## Use

Browser

    <script src="path/to/index.js"></script>
    <script>
        var client = hypermedia.Api.enter('http://0.0.0.0:8080/', function (error, res) {});
    </script>

Node.JS

    var hypermedia = require('hypermedia'),
        client = hypermedia.Api.enter('http://0.0.0.0:8080/', function (error, res) {});

## Test

    npm test

## Contribute

Please maintain existing coding style.
