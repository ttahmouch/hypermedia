/**
 * Falsy Values: false, 0, "", null, undefined, NaN
 *
 * - Browser Usage:
 * <script src="hypermedia.js"></script>
 * <script>
 *     var agent = hypermedia.Api.enter('http://0.0.0.0:8080/', function (error, res) {});
 * </script>
 *
 * - Node.JS Usage:
 * var agent = require('hypermedia').Api.enter('http://0.0.0.0:8080/', function (error, res) {});
 *
 * @see http://stackoverflow.com/questions/7327164/common-module-in-node-js-and-browser-javascript
 */
(function (exports) {
    /*******************************************************************************************************************
     * START Media Type Encoding and Decoding
     ******************************************************************************************************************/

    /**
     * Multipurpose Internet Mail Extensions - Multipart Media Type En/Decoder
     * The Multipart Media Type allows for encoding data consisting of multiple entities of independent data types.
     *
     * @see http://tools.ietf.org/html/rfc2046#page-4
     * @return {Multipart}
     * @constructor
     */
    function Multipart() {
        return this;
    }

    /**
     * Multipart Media Type - Boundary Parameter Encoder
     * The Multipart Media Type has a mandatory global parameter, the boundary parameter. Every resulting boundary
     * parameter from this algorithm will be exactly 70 characters and will NOT end in a space.
     *
     * RFC 2046 "Multipart" Boundary BNF:
     * bcharsnospace = DIGIT / ALPHA / "'" / "(" / ")" / "+" / "_" / "," / "-" / "." / "/" / ":" / "=" / "?"
     * bchars        = bcharsnospace / " "
     * boundary      = 0*69<bchars> bcharsnospace
     *
     * @see http://tools.ietf.org/html/rfc2046#page-22
     * @return {String} representing the boundary delimiter.
     */
    Multipart.boundary = function () {
        for (var bChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'()+_,-./:=? ",
                 boundary = '',
                 i = 0; i < 69; i += 1) {
            boundary += bChars.charAt(Math.floor(Math.random() * bChars.length));
        }
        return boundary + bChars.charAt(Math.floor(Math.random() * (bChars.length - 1)));
    };

    /**
     * Multipart Media Type - Body Part Encoder
     * The Multipart Media Type treats multiple independent data types as body parts of a whole body. Every resulting
     * body part from this algorithm will have a header area, a blank line, and a body area. Though a body part may have
     * header and body areas, those areas may not be populated with header fields or a body. A body part that starts
     * with a blank line assumes "content-type:text/plain; charset=US-ASCII". Header field names not starting with
     * "content-" have no defined meaning for body parts.
     *
     * RFC 822 Header Fields BNF / RFC 2046 "Multipart" Body BNF:
     * field-name = 1*<any CHAR, excluding CTLs, SPACE, and ":">
     * field-body = *text [CRLF WSP field-body]
     * field      = field-name ":" [field-body] CRLF
     * body-part  = *field [CRLF *OCTET]
     *
     * @see http://tools.ietf.org/html/rfc2046#page-18
     * @param part {Object} representing a body part.
     * @example {}
     * @example { 'body': 'something' }
     * @example { 'content-type': 'text/plain', 'body': 'something' } // fields excluding "body" are header fields.
     * @example { 'content-type': 'multipart/parallel', 'body': [] }  // field names will be normalized to lowercase.
     * @example { 'content-type': 'multipart/parallel', 'body': [     // body parts may also be multipart.
     *  { 'content-type': 'audio/basic', 'body': 'base64-encoded' }   // nested body parts are delimited automatically.
     * ] }
     * @return {String} representing the body part.
     */
    Multipart.part = function (part) {
        var body = '';
        if (!!part && typeof part === 'object') {
            var content = part['body'],
                multipart = Array.isArray(content),
                boundary = multipart ? Multipart.boundary() : '',
                parameter = multipart ? '; boundary="' + boundary + '"' : '';

            for (var field in part) {
                var lower = field.toLowerCase();
                if (part.hasOwnProperty(field) && lower !== 'body') {
                    body += lower + ':' + part[field] + (lower === 'content-type' ? parameter : '') + '\r\n';
                }
            }

            if (!!content) {
                body += '\r\n' + (multipart ? Multipart.encode(content, boundary) : content);
            }
        }
        return body;
    };

    /**
     * Multipart Media Type - Body Encoder
     * The Multipart Media Type treats multiple independent data types as body parts of a whole body. Every resulting
     * body from this algorithm will have one or more body parts, each preceded by a boundary delimiter line, and the
     * last one followed by a closing boundary delimiter line.
     *
     * RFC 2046 "Multipart" Body BNF:
     * multipart-body = [*(*text CRLF) *text CRLF]                ; Optional Preamble
     *                  "--" boundary *WSP CRLF                   ; --F6Rxhi'v4e)(fn
     *                  body-part                                 ; Content-Type: application/json
     *                                                            ;
     *                                                            ; {"cool":"stuff"}
     *                  *(CRLF "--" boundary *WSP CRLF body-part) ; --F6Rxhi'v4e)(fn
     *                                                            ; Content-Type: application/json
     *                                                            ;
     *                                                            ; {"cool":"other stuff"}
     *                  CRLF "--" boundary "--" *WSP              ; --F6Rxhi'v4e)(fn--
     *                  [CRLF *(*text CRLF) *text]                ; Optional Epilogue
     *
     * @see http://tools.ietf.org/html/rfc2046#page-17
     * @param parts {Array} representing a multipart body.
     * @example []
     * @example [ {}, { 'body': 'something' }, { 'content-type': 'text/plain', 'body': 'something' } ]
     * @example [ {}, { 'body': 'something' }, { 'content-type': 'multipart/parallel', 'body': [
     *  { 'content-type': 'audio/basic', 'content-transfer-encoding': 'base64', 'body': 'base64-encoded' }
     * ] } ]
     * @param boundary {String} representing a boundary delimiter.
     * @example "EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)"
     * @return {String} representing the multipart body.
     */
    Multipart.encode = function (parts, boundary) {
        var body = '';
        if (Array.isArray(parts)) {
            for (var part in parts) {
                if (parts.hasOwnProperty(part)) {
                    body += Multipart.part(parts[part]);
                    if (parts.length > 1 && part < parts.length - 1) {
                        body += '\r\n' + '--' + boundary + '\r\n';
                    }
                }
            }
        }
        return '--' + boundary + '\r\n' + body + '\r\n' + '--' + boundary + '--';
    };

    /**
     * Multipart Media Type - Body Decoder
     * Decodes a multipart body string to a multipart body array. Reverses Multipart.encode.
     *
     * @param body {String} representing a multipart body.
     * @example
     * "--EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)
     *
     *  --EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)
     *
     *  something
     *  --EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)
     *  content-type:multipart/parallel; boundary="sjB"
     *
     *  --sjB
     *  content-type:audio/basic
     *  content-transfer-encoding:base64
     *
     *  base64-encoded
     *  --sjB--
     *  --EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)--"
     * @param boundary {String} representing a boundary delimiter.
     * @example "EGDEo'shQUPgkOk8Mxi/-9?'I+:ETX2P1q6 DCJDmJ=vEi'PMKO?b'4M-'Q'//C :(i7/)"
     * @return {Array} representing the multipart body.
     */
    Multipart.decode = function (body, boundary) {
        var parts = [],
            bChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'()+_,-./:=? ",
            bodyPartFollows = false;
        if (typeof body === 'string' && typeof boundary === 'string') {
            tokenize:
                for (var i = 0, c = ''; c = body.charAt(i); i += 1) {
                    if (c === '-' && body.charAt(i + 1) === '-') {
                        boundaryArea:
                            for (var j = 0; body.charAt(i + 2 + j) === boundary.charAt(j); j += 1) {
                                if (j === boundary.length - 1) {
                                    i += 1 + boundary.length;
                                    if (body.charAt(i + 1) === '-' && body.charAt(i + 2) === '-') {
                                        break tokenize;
                                    }
                                    while (body.charAt(i + 1) === ' ' || body.charAt(i + 1) === '\t') {
                                        i += 1;
                                    }
                                    if (body.charAt(i + 1) === '\r' && body.charAt(i + 2) === '\n') {
                                        i += 2;
                                    }
                                    bodyPartFollows = true;
                                    break boundaryArea;
                                }
                            }
                    } else if (bodyPartFollows) {
                        var fieldName = '',
                            fieldBody = '',
                            partBody = '',
                            partBoundary = '',
                            part = {};
                        fieldNameArea:
                            while ((c > ' ' && c < ':') || (c > ':' && c <= '~')) {
                                fieldName += c;
                                c = body.charAt(i += 1);
                                if (c === ':') {
                                    c = body.charAt(i += 1);
                                    fieldBodyArea:
                                        while (c.charCodeAt(0) < 128) {
                                            if (c === ';') {
                                                var start = i,
                                                    isBchar = false;
                                                do {
                                                    c = body.charAt(i += 1);
                                                } while (c === ' ' || c === '\t');
                                                if (body.substr(i, 9) === 'boundary=') {
                                                    partBoundaryArea:
                                                        for (c = body.charAt(i += 9);
                                                             (isBchar = bChars.lastIndexOf(c) !== -1) || c === '"';
                                                             c = body.charAt(i += 1)) {
                                                            if (isBchar) {
                                                                partBoundary += c;
                                                            }
                                                        }
                                                }
                                                if (!partBoundary) {
                                                    c = body.charAt(i = start);
                                                }
                                            }
                                            if (c === '\r' && body.charAt(i + 1) === '\n') {
                                                c = body.charAt(i += 2);
                                                if (c !== ' ' && c !== '\t') {
                                                    part[fieldName] = fieldBody;
                                                    fieldName = fieldBody = '';
                                                    break fieldBodyArea;
                                                }
                                            }
                                            fieldBody += c;
                                            c = body.charAt(i += 1);
                                        }
                                }
                            }
                        partBodyArea:
                            if (c === '\r' && body.charAt(i + 1) === '\n') {
                                if (body.charAt(i + 2) === '-' && body.charAt(i + 3) === '-') {
                                    for (var j = 0; body.charAt(i + 4 + j) === boundary.charAt(j); j += 1) {
                                        if (j === boundary.length - 1) {
                                            break partBodyArea;
                                        }
                                    }
                                }
                                for (i += 2; c = body.charAt(i); partBody += c, i += 1) {
                                    if (c === '\r' && body.charAt(i + 1) === '\n') {
                                        if (body.charAt(i + 2) === '-' && body.charAt(i + 3) === '-') {
                                            for (var j = 0; body.charAt(i + 4 + j) === boundary.charAt(j); j += 1) {
                                                if (j === boundary.length - 1) {
                                                    break partBodyArea;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        part['body'] = !!partBoundary ? Multipart.decode(partBody, partBoundary) : partBody;
                        parts.push(part);
                        bodyPartFollows = false;
                    }
                }
        }
        return parts;
    };

    /**
     * JSON Navigation Application Language (NavAL) Media Type En/Decoder
     *
     * @return {Naval}
     * @constructor
     */
    function Naval() {
        return this;
    }

    /**
     * NavAL Media Type Encoder
     * Encodes a hypermedia array to a NavAL string.
     *
     * @param hypermedia {Array} representing hypermedia controls.
     * @example [ { "rel": "getTodo", "method": "GET", "uri": "/todos/{id}" } ]
     * @return {String} representing NavAL.
     */
    Naval.encode = function (hypermedia) {
        return JSON.stringify(Array.isArray(hypermedia) ? hypermedia : []);
    };

    /**
     * NavAL Media Type Decoder
     * Decodes a NavAL string to a hypermedia array.
     *
     * @param naval {String} representing NavAL.
     * @example '[{"rel":"getTodo","method":"GET","uri":"/todos/{id}"}]'
     * @return {Array} representing hypermedia controls.
     */
    Naval.decode = function (naval) {
        try {
            naval = JSON.parse(naval);
        } catch (error) {
            console.error(new Date().toUTCString() + ' caughtException:', error.message);
        }
        return Array.isArray(naval) ? naval : [];
    };

    /**
     * Uniform Resource Identifier (URI) En/Decoder
     *
     * @example "http://www.google.com:80/search?query=text#result"
     * @see http://tools.ietf.org/html/rfc3986
     * @return {Uri}
     * @constructor
     */
    function Uri() {
        return this;
    }

    /**
     * URI Encoder
     *
     * @see http://tools.ietf.org/html/rfc3986#section-5.3
     * @param uri {Object} representing the Uniform Resource Identifier (URI).
     * @example { scheme: 'http',authority: 'www.google.com:80',path: '/search',query: 'query=text',fragment: 'result' }
     * @return {String} representing the Uniform Resource Identifier (URI).
     */
    Uri.encode = function (uri) {
        uri = !!uri && typeof uri === 'object' ? uri : {};
        var scheme = uri.scheme || '',
            authority = uri.authority || '',
            path = uri.path || '',
            query = uri.query || '',
            fragment = uri.fragment || '',
            result = '';
        if (scheme) {
            result += scheme + ':';
        }
        if (authority) {
            result += '//' + authority;
        }
        result += path;
        if (query) {
            result += '?' + query;
        }
        if (fragment) {
            result += '#' + fragment;
        }
        return result;
    };

    /**
     * URI Decoder
     *
     * Mimics most of URLUtils and Node.JS URL Object interface.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/URLUtils
     * @see http://nodejs.org/api/url.html
     * @see http://tools.ietf.org/html/rfc3986#appendix-B
     * @param uri {String} representing the Uniform Resource Identifier (URI).
     * @example "http://www.google.com:80/search?query=text#result"
     * @return {Object} representing the Uniform Resource Identifier (URI).
     */
    Uri.decode = function (uri) {
        uri = typeof uri === 'string' ? uri : '';
        uri = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(uri);
        var authority = /^(([^@]+)@)?(([^:]*)(:(.*))?)/.exec(uri[4] || ''),
            userinfo = /^([^:]*)(:(.*))?/.exec(authority[2] || '');
        return {
            uri: uri[0] || '',
            scheme: uri[2] || '',
            authority: uri[4] || '',
            path: uri[5] || '',
            query: uri[7] || '',
            fragment: uri[9] || '',
            userinfo: authority[2] || '',
            href: uri[0] || '',
            protocol: uri[1] || '',
            pathname: uri[5] || '',
            search: uri[6] || '',
            hash: uri[8] || '',
            auth: authority[2] || '',
            host: authority[3] || '',
            hostname: authority[4] || '',
            port: authority[6] || '',
            username: userinfo[1] || '',
            password: userinfo[3] || '',
            origin: uri[2] && authority[3] ? uri[2] + '://' + authority[3] : ''
        };
    };

    /*******************************************************************************************************************
     * FINISH Media Type Encoding and Decoding
     * START API Server
     ******************************************************************************************************************/

    /**
     * Application Programming Interface (API) - Client Request / Server Middleware Framework
     *
     * @see http://en.wikipedia.org/wiki/Application_programming_interface#Web_APIs
     * @param api {Object} representing a web API.
     * @example
     {
      "id": "Simple Stupid Hypermedia API",  // OPTIONAL. Identifies the web API. Default: ''
      "title": "Short text saving service.", // OPTIONAL. Describes the web API. Default: ''
      "debug": true,                         // OPTIONAL. Selects debug mode. Default: false
      "protocol": "http",                    // OPTIONAL. Selects the supported protocol. Default: 'http'
      "hostname": "0.0.0.0",                 // OPTIONAL. Describes the server hostname. Default: '0.0.0.0'
      "port": "80",                          // OPTIONAL. Describes the server port. Default: '8080'
      "cors": ["*", "scheme://host"],        // OPTIONAL. Describes the Origin white list. "*" means all. Default: []
      "apis": [                              // OPTIONAL. Describes APIs and middleware. Default: []
       {
        "id": "logRequest",        // REQUIRED. Identifies the middleware. Default: undefined
        "title": "Log a Request."  // OPTIONAL. Describes the middleware. Default: undefined
       },
       {
        "id": "createNote",        // REQUIRED. Identifies the API. Default: undefined
        "title": "Create a Note.", // OPTIONAL. Describes the API. Default: undefined
        "method": "PUT",           // REQUIRED. Describes the required protocol method. Default: undefined
        "uri": "/notes/:note",     // REQUIRED. Describes the required route with optional params. Default: undefined
        "headers": {               // OPTIONAL. Describes the required protocol headers. Default: undefined
         "content-type": "application/json"
        },
        "body": [                  // OPTIONAL. Describes the required and optional input fields. Default: undefined
         {
          "name": "title",               // REQUIRED. Names the input field. Default: undefined
          "title": "Title of the Note.", // OPTIONAL. Describes the input field. Default: undefined
          "value": "Buy bread.",         // OPTIONAL. Supplies a default value. Default: undefined
          "type": "text"                 // OPTIONAL. Describes the input field type. Default: undefined
         }
        ]
       }
      ]
     }
     * @return {Api}
     * @constructor
     */
    function Api(api) {
        var that = this;
        api = !!api && typeof api === 'object' ? api : {};
        that.id = typeof api.id === 'string' ? api.id : '';
        that.title = typeof api.title === 'string' ? api.title : '';
        that.port = typeof api.port === 'string' ? api.port : '8080';
        that.hostname = typeof api.hostname === 'string' ? api.hostname : '0.0.0.0';
        that.cors = Array.isArray(api.cors) ? api.cors : [];
        that.origin = typeof api.origin === 'string' ? api.origin : '';
        that.protocol = typeof api.protocol === 'string' ? api.protocol : 'http';
        that.mediatype = typeof api.mediatype === 'string' ? api.mediatype : 'multipart/nav-data';
        that.apis = Array.isArray(api.apis) ? api.apis : [];
        that.api = null;
        that.debug = !!api.debug;
        return that;
    }

    /**
     * Create an Api.
     *
     * @param api {Object} representing a web API.
     * @return {Api}
     */
    Api.create = function (api) {
        return new Api(api);
    };

    /**
     * Create an Api from a JSON file.
     *
     * @param file {String} path to JSON file that will become an {Object} representing a web API.
     * @example "/api.json"
     * @return {Api}
     */
    Api.createFromFile = function (file) {
        var api = null;
        try {
            api = require(file);
        } catch (error) {
            api = {};
        }
        return new Api(api);
    };

    /**
     * Enumerates each api and middleware in the Api.
     *
     * @param callback {Function} to be invoked when a routine is encountered.
     * @example
     * function (routine, type) {
     *  // Server Context (Middleware and Routes):
     *  @example type === 'mid', routine === { "id": "requestLog" }
     *  @example type === 'api', routine === { "id": "getTodos", "method": "GET", "uri": "/todos" }
     *  // Client Context (Hypermedia):
     *  @example type === 'api', routine === { "rel": "getTodos", "method": "GET", "uri": "/todos" }
     * }
     * @return {Api}
     */
    Api.prototype.each = function (callback) {
        var that = this;
        if (typeof callback === 'function') {
            that.apis.forEach(function (routine) {
                if (!!routine && typeof routine === 'object') {
                    if (typeof routine.id === 'string' || typeof routine.rel === 'string') {
                        if (typeof routine.method === 'undefined' && typeof routine.uri === 'undefined') {
                            callback(routine, 'mid');
                        } else if (typeof routine.method === 'string' && typeof routine.uri === 'string') {
                            callback(routine, 'api');
                        }
                    }
                }
            });
        }
        return that;
    };

    /**
     * Enumerates each api in the Api.
     *
     * @param callback {Function} to be invoked when an api is encountered.
     * @example
     * function (api) {
     *  // Server Context (Routes):
     *  @example api === { "id": "getTodos", "method": "GET", "uri": "/todos" }
     *  // Client Context (Hypermedia):
     *  @example api === { "rel": "getTodos", "method": "GET", "uri": "/todos" }
     * }
     * @return {Api}
     */
    Api.prototype.eachApi = function (callback) {
        var that = this;
        if (typeof callback === 'function') {
            that.each(function (routine, type) {
                if (type === 'api') {
                    callback(routine);
                }
            });
        }
        return that;
    };

    /*******************************************************************************************************************
     * START API Middleware
     ******************************************************************************************************************/

    /**
     * Middleware that gets CORS request semantics into req.cors.
     *
     * @see http://www.w3.org/TR/cors
     * @see http://www.html5rocks.com/static/images/cors_server_flowchart.png
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     * @example req.cors = {
     *  origin: 'http://www.google.com', // "Origin" header field value.
     *  method: '',                      // "Access-Control-Request-Method" header field value.
     *  headers: '',                     // "Access-Control-Request-Headers" header field value.
     *  preflight: false,                // OPTIONS request with "Access-Control-Request-Method".
     *  simple: true,                    // GET, HEAD, or POST request without "Access-Control-Request-Method".
     *  all: true,                       // All origins are allowed.
     *  one: false,                      // This origin is allowed.
     *  allow: true                      // This origin is allowed, or all origins are allowed.
     * }
     * @return {Api}
     */
    Api.prototype.incomingMessageCors = function (req, res) {
        var that = this,
            cors = req.cors = {};
        if (that.protocol === 'http') {
            if (req.headers['origin']) {
                cors.origin = req.headers['origin'] || '';
                cors.method = req.headers['access-control-request-method'] || '';
                cors.headers = req.headers['access-control-request-headers'] || '';
                cors.preflight = !!cors.method;
                cors.simple = !cors.method;
                cors.all = that.cors.indexOf('*') !== -1;
                cors.one = that.cors.indexOf(cors.origin) !== -1;
                cors.allow = cors.all || cors.one;
            }
        }
        return that;
    };

    /**
     * Middleware that sets CORS response semantics based on req.cors.
     *
     * @see http://www.w3.org/TR/cors
     * @see http://www.html5rocks.com/static/images/cors_server_flowchart.png
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     * @return {Api}
     */
    Api.prototype.outgoingMessageCors = function (req, res) {
        var that = this,
            cors = req.cors;
        if (!!cors && typeof cors === 'object') {
            if (that.protocol === 'http') {
                if (cors.allow) {
                    res.setHeader('access-control-allow-origin', cors.all ? '*' : cors.origin);
                    if (cors.credential) {
                        res.setHeader('access-control-allow-origin', cors.origin);
                        res.setHeader('access-control-allow-credentials', 'true');
                    }
                    if (cors.simple) {
                        cors.expose = cors.expose || Object.keys(res._headers || {}) || [];
                        cors.expose = cors.expose.filter(function (header) {
                            switch (header.toLowerCase()) {
                                case 'cache-control':
                                case 'content-language':
                                case 'content-type':
                                case 'expires':
                                case 'last-modified':
                                case 'pragma':
                                    return false;
                                default:
                                    return true;
                            }
                        });
                        if (cors.expose.length > 0) {
                            res.setHeader('access-control-expose-headers', cors.expose.join(','));
                        }
                    }
                    if (cors.preflight) {
                        res.setHeader('access-control-allow-methods', cors.method);
                        if (cors.headers) {
                            res.setHeader('access-control-allow-headers', cors.headers);
                        }
                        if (cors.age) {
                            res.setHeader('access-control-max-age', cors.age);
                        }
                        res.statusCode = 200;
                        res.body = '';
                    }
                }
            }
        }
        return that;
    };

    /**
     * Middleware that transforms res.body to string.
     *
     * @see https://github.com/joyent/node/blob/master/lib/_http_outgoing.js#L496
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     * @example res.body = false, 1337, { some: 'json' } // Modified to JSON string.
     * @example res.body = function(){}, null, undefined // Modified to empty string.
     * @example res.body = new Buffer('wahoo')           // Modified to string.
     * @example res.body = 'some string'                 // Unmodified.
     * @return {Api}
     */
    Api.prototype.outgoingMessageBody = function (req, res) {
        var that = this,
            body = res.body,
            type = Buffer.isBuffer(body) ? 'buffer' : body === null ? 'null' : typeof body;
        switch (type) {
            case 'function':
            case 'null':
            case 'undefined':
                if (typeof body !== 'string') {
                    body = res.body = '';
                }
            case 'boolean':
            case 'number':
            case 'object':
                if (typeof body !== 'string') {
                    body = res.body = JSON.stringify(body);
                    if (!res.getHeader('content-type')) {
                        res.setHeader('content-type', 'application/json; charset=utf-8');
                    }
                }
            case 'buffer':
                if (typeof body !== 'string') {
                    body = res.body = body.toString('utf8');
                    if (!res.getHeader('content-type')) {
                        res.setHeader('content-type', 'application/octet-stream; charset=utf-8');
                    }
                }
            case 'string':
            default:
                res.setHeader('content-length', Buffer.byteLength(body));
                break;
        }
        return that;
    };

    /**
     * Middleware that adds hypermedia semantics to any response based on res.hype.
     *
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     * @example res.hype = [ "createNote" ] // createNote is treated as { id: 'createNote' }
     * @example res.hype = [ {
     *  "id": "createNote",                 // The ID must exist in {Api}.apis[].
     *  "rel": "createNote",                // rel may be specified. Otherwise, rel === id.
     *  "method": "POST", "uri": "/notes"   // title, method, uri, headers, body may be modified.
     * } ]
     * @return {Api}
     */
    Api.prototype.outgoingMessageHypermedia = function (req, res) {
        var that = this,
            picks = res.hype;
        if (Array.isArray(picks)) {
            if (that.protocol === 'http' && that.mediatype === 'multipart/nav-data') {
                var hypermedia = [];
                picks.forEach(function (pick) {
                    pick = typeof pick === 'string' ? { id: pick } : pick;
                    if (!!pick && typeof pick === 'object' && typeof pick.id === 'string') {
                        that.eachApi(function (api) {
                            if (api.id === pick.id) {
                                hypermedia.push({
                                    title: pick.title || api.title,
                                    rel: pick.rel || api.rel || api.id,
                                    method: pick.method || api.method,
                                    uri: pick.uri || api.uri,
                                    headers: pick.headers || api.headers,
                                    body: pick.body || api.body
                                });
                            }
                        });
                    }
                });
                var boundary = Multipart.boundary(),
                    navdata = [
                        {
                            'content-type': 'application/naval+json',
                            'body': Naval.encode(hypermedia)
                        }
                    ],
                    data = {
                        'content-type': 'text/plain; charset=us-ascii',
                        'body': res.body || ''
                    };
                for (var header in res._headers) {
                    if (/^content-/.test(header.toLowerCase())) {
                        data[header.toLowerCase()] = res._headers[header];
                        delete res._headers[header];
                    }
                }
                if (res.body) {
                    navdata.push(data);
                }
                res.setHeader('content-type', 'multipart/nav-data; boundary="' + boundary + '"');
                res.body = Multipart.encode(navdata, boundary);
            }
        }
        return that;
    };

    /**
     * Middleware that responds to an HTTP request with res.body, and 404 if a status code is not already set.
     *
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     * @return {Api}
     */
    Api.prototype.outgoingMessageFinal = function (req, res) {
        var that = this;
        res.statusCode = res.hasOwnProperty('statusCode') ? res.statusCode : 404;
        res.end(res.body);
        return that;
    };

    /*******************************************************************************************************************
     * FINISH API Middleware
     * FINISH API Server
     * START API Client
     ******************************************************************************************************************/

    /**
     * API Client (Supported Protocols: HTTP)
     * Works with Node.JS and XMLHttpRequest.
     *
     * @param req {Object} that represents a protocol request.
     * @example {
     *  method: 'GET',               // OPTIONAL. Protocol method. Default: 'GET'
     *  uri: 'http://127.0.0.1:80/', // OPTIONAL. Absolute URI. Default: 'http://127.0.0.1:80/'
     *  headers: {},                 // OPTIONAL. Request headers. Default: {}
     *  body: '',                    // OPTIONAL. Request body. Default: ''
     *  username: null,              // OPTIONAL. Username string. Default: null
     *  password: null,              // OPTIONAL. Password string. Default: null
     *  withCredentials: false       // OPTIONAL. Include credentials (e.g. cookies) in CORS request. Default: false
     * }
     * @param callback {Function} to be invoked when the request succeeds or fails.
     * @example
     * function (error, res) {
     *  @example this === {Api}
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   @example error === {Error}, res === null
     *   console.error(error);
     *  } else {
     *   @example error === null, res === { status: 404, headers: {}, body: '' }
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     * @return {Api}
     */
    Api.prototype.request = function (req, callback) {
        var that = this;
        req = !!req && typeof req === 'object' ? req : {};
        if (that.protocol === 'http') {
            req.method = req.method || 'GET';
            req.uri = req.uri || 'http://127.0.0.1:80/';
            req.headers = req.headers || {};
            req.body = req.body || '';
            req.username = req.username || null;
            req.password = req.password || null;
            req.withCredentials = req.withCredentials || false;

            if (that.debug) {
                console.log('The request is ' + JSON.stringify(req, null, '    '));
            }

            if (typeof XMLHttpRequest !== 'undefined') {
                try {
                    var request = new XMLHttpRequest();
                    request.withCredentials = req.withCredentials;
                    request.onload = function () {
                        var headersArray = this.getAllResponseHeaders().split('\r\n') || [],
                            headers = {};
                        for (var header in headersArray) {
                            header = headersArray[header];
                            var colon = header.indexOf(': ');
                            if (colon !== -1) {
                                headers[header.substring(0, colon).toLowerCase()] = header.substring(colon + 2);
                            }
                        }
                        if (typeof callback === 'function') {
                            callback.call(that, null, {
                                status: this.status,
                                headers: headers,
                                body: this.response
                            });
                        }
                    };
                    request.onerror = function () {
                        if (typeof callback === 'function') {
                            callback.call(that, new Error('A network error occurred.'), null);
                        }
                    };
                    request.open(req.method, req.uri, true, req.username, req.password);
                    for (var header in req.headers) {
                        request.setRequestHeader(header, req.headers[header]);
                    }
                    request.send(req.body);
                } catch (error) {
                    if (typeof callback === 'function') {
                        callback.call(that, error, null);
                    }
                }
            } else try {
                var url = require('url').parse(req.uri);
                require('http')
                    .request({
                        hostname: url.hostname,
                        port: url.port,
                        path: url.path,
                        method: req.method,
                        headers: req.headers,
                        auth: req.username && req.password ? req.username + ':' + req.password : ''
                    })
                    .on('response', function (response) {
                        var body = '';
                        response
                            .on('data', function (data) {
                                body += data;
                            })
                            .on('end', function () {
                                if (typeof callback === 'function') {
                                    callback.call(that, null, {
                                        status: response.statusCode,
                                        headers: response.headers || {},
                                        body: body
                                    });
                                }
                            });
                    })
                    .on('error', function (error) {
                        if (typeof callback === 'function') {
                            callback.call(that, error, null);
                        }
                    })
                    .end(req.body);
            } catch (error) {
                if (typeof callback === 'function') {
                    callback.call(that, error, null);
                }
            }
        }
        return that;
    };

    /**
     * API Client (Supported Protocols: HTTP)
     * Works with Node.JS and XMLHttpRequest.
     *
     * @param req {Object} that represents a protocol request.
     * @param callback {Function} to be invoked when the request succeeds or fails.
     * @param api {Object} representing a web API.
     * @example { debug: true }
     * @example true // true is treated as { debug: true }
     * @return {Api}
     */
    Api.request = function (req, callback, api) {
        api = typeof api === 'boolean' ? { debug: api } : api;
        return Api.create(api).request(req, callback);
    };

    /**
     * API Client (Supported Protocols: HTTP)
     * Works with Node.JS and XMLHttpRequest.
     * Adds accept:multipart/nav-data.
     * Decodes multipart/nav-data responses.
     * Returns the intended response from the data body part.
     * Builds a hypermedia DOM from the navigation body part.
     *
     * @param req {Object} that represents a protocol request.
     * @param callback {Function} to be invoked when the request succeeds or fails.
     * @return {Api}
     */
    Api.prototype.requestNavData = function (req, callback) {
        var that = this;
        req = !!req && typeof req === 'object' ? req : {};
        if (that.protocol === 'http' && that.mediatype === 'multipart/nav-data') {
            req.headers = req.headers || {};
            req.headers['accept'] = 'multipart/nav-data';
            that.request(req, function (error, res) {
                if (error) {
                    console.error(new Date().toUTCString() + ' caughtException:', error.message);
                } else if (res.headers['content-type']) {
                    var template = /^multipart\/nav-data;\s*boundary="?([^"]+)"?/,
                        boundary = template.exec(res.headers['content-type'] || '');
                    if (boundary) {
                        Multipart.decode(res.body, boundary[1]).forEach(function (part) {
                            if (part['content-type'] === 'application/naval+json') {
                                that.apis = Naval.decode(part['body'] || '') || [];
                            } else {
                                res.headers['content-type'] = 'text/plain; charset=US-ASCII';
                                for (var header in part) {
                                    if (/^content-/.test(header.toLowerCase())) {
                                        res.headers[header.toLowerCase()] = part[header];
                                    }
                                }
                                res.body = part['body'] || '';
                            }
                        });
                    }
                }
                if (typeof callback === 'function') {
                    callback.call(that, error, res);
                }
            });
        }
        return that;
    };

    /**
     * Enter an API at its entry point resource.
     *
     * @param uri {String} that represents the absolute URI.
     * @example "http://www.google.com/" // "http://www.google.com/" is treated as { uri: "http://www.google.com/" }.
     * @param callback {Function} to be invoked when the entry point request succeeds or fails.
     * @return {Api}
     */
    Api.prototype.enter = function (uri, callback) {
        var that = this;
        if (that.protocol === 'http') {
            if (typeof uri === 'string') {
                var req = {
                    uri: uri
                };
                that.origin = Uri.decode(uri).origin;
                if (that.mediatype === 'multipart/nav-data') {
                    that.requestNavData(req, callback);
                } else {
                    that.request(req, callback);
                }
            } else if (typeof callback === 'function') {
                callback.call(that, new Error('The uri should look like: "http://host/resource".'), null);
            }
        } else if (typeof callback === 'function') {
            callback.call(that, new Error('The transfer protocol is not supported.'), null);
        }
        return that;
    };

    /**
     * Enter an API at its entry point resource.
     *
     * @param uri {String} that represents the absolute URI.
     * @param callback {Function} to be invoked when the entry point request succeeds or fails.
     * @param api {Object} representing a web API.
     * @example { debug: true }
     * @example true // true is treated as { debug: true }
     * @return {Api}
     */
    Api.enter = function (uri, callback, api) {
        api = typeof api === 'boolean' ? { debug: api } : api;
        return Api.create(api).enter(uri, callback);
    };

    /**
     * Checks if a route exists in a server, or if a hypermedia affordance exists in a client.
     * If it exists, a reference is kept at {Api}.api.
     *
     * @param req {String} id (server), or rel (client).
     * @example "createNote"
     * @return {Api}
     */
    Api.prototype.can = function (req) {
        var that = this;
        that.api = null;
        if (typeof req === 'string') {
            that.eachApi(function (api) {
                if (api.id === req || api.rel === req) {
                    that.api = api;
                }
            });
        }
        return that;
    };

    /**
     * Picks and follows a hypermedia affordance if it exists.
     *
     * @param pick {Object} picks a hypermedia affordance by relation.
     * @example { rel: 'createNote', uri: { id: '0' }, body: { title: 'Grocery Shopping.', due: '2014-08-17' } }
     * @example 'createNote'            // 'createNote' is treated as { rel: "createNote" }
     * @example function(error, res) {} // Allowed if {Api}.can('rel').do(function(error, res){})
     * @example { rel: undefined }      // Allowed if {Api}.can('rel').do({ rel: undefined }, function(error, res){})
     * @param callback {Function} to be invoked when the follow request succeeds or fails.
     * @return {Api}
     */
    Api.prototype.do = function (pick, callback) {
        var that = this;
        if (typeof pick === 'string') {
            pick = { rel: pick };
        } else if (that.api) {
            if (typeof pick === 'function') {
                callback = pick;
                pick = { rel: that.api.rel };
            } else if (typeof pick === 'object' && pick && typeof pick.rel !== 'string') {
                pick.rel = that.api.rel;
            }
        }
        if (typeof pick === 'object' && pick && typeof pick.rel === 'string') {
            if (that.protocol === 'http') {
                var followed = false;
                that.eachApi(function (api) {
                    if (api.rel === pick.rel) {
                        var req = {
                            method: pick.method || api.method,
                            uri: pick.uri || api.uri,
                            headers: {},
                            body: '',
                            username: pick.username,
                            password: pick.password,
                            withCredentials: pick.withCredentials
                        };

                        if (!!req.uri && typeof req.uri === 'object') {
                            var expand = api.uri;
                            for (var param in req.uri) {
                                expand = expand
                                    .replace('{' + param + '}', encodeURIComponent(String(req.uri[param])))
                                    .replace(':' + param, encodeURIComponent(String(req.uri[param])));
                            }
                            req.uri = expand;
                        }

                        var origin = Uri.decode(that.origin),
                            uri = Uri.decode(req.uri);

                        uri.scheme = uri.scheme || origin.scheme;
                        uri.authority = uri.authority || origin.authority;
                        req.uri = Uri.encode(uri);

                        if (!!api.headers && typeof api.headers === 'object') {
                            for (var header in api.headers) {
                                req.headers[header.toLowerCase()] = api.headers[header];
                            }
                        }

                        if (!!pick.headers && typeof pick.headers === 'object') {
                            for (var header in pick.headers) {
                                req.headers[header.toLowerCase()] = pick.headers[header];
                            }
                        }

                        if (Array.isArray(api.body)) {
                            if (typeof pick.body === 'string') {
                                req.body = pick.body;
                            } else {
                                var success = {};
                                api.body.forEach(function (control) {
                                    if (!!control && typeof control === 'object') {
                                        var name = typeof control.name === 'string' ? control.name : '',
                                            value = control.value;
                                        if (name) {
                                            if (!!pick.body && typeof pick.body === 'object') {
                                                if (typeof pick.body[name] !== 'undefined') {
                                                    value = pick.body[name];
                                                }
                                            }
                                            if (typeof value !== 'undefined') {
                                                success[name] = value;
                                            }
                                        }
                                    }
                                });
                                switch (req.headers['content-type']) {
                                    case 'application/json':
                                        req.body = JSON.stringify(success, null, '    ');
                                        break;
                                    case 'application/x-www-form-urlencoded':
                                    default :
                                        var urlencoded = [];
                                        for (var name in success) {
                                            var value = encodeURIComponent(String(success[name]));
                                            name = encodeURIComponent(name);
                                            urlencoded.push(name + '=' + value);
                                        }
                                        urlencoded = urlencoded.join('&').replace(/%20/g, '+');
                                        if (req.method === 'GET') {
                                            req.uri += '?' + urlencoded;
                                        } else {
                                            req.headers['content-type'] = 'application/x-www-form-urlencoded';
                                            req.body = urlencoded;
                                        }
                                        break;
                                }
                                if (req.body) {
                                    req.headers['content-length'] = req.body.length;
                                }
                            }
                        }

                        if (!req.body) {
                            for (var header in req.headers) {
                                if (/^content-/.test(header.toLowerCase())) {
                                    delete req.headers[header];
                                }
                            }
                        }

                        if (that.mediatype === 'multipart/nav-data') {
                            that.requestNavData(req, callback);
                        } else {
                            that.request(req, callback);
                        }

                        followed = true;
                    }
                });
                if (!followed && typeof callback === 'function') {
                    callback.call(that, new Error('An action possibility could not be found with this rel.'), null);
                }
            } else if (typeof callback === 'function') {
                callback.call(that, new Error('The transfer protocol is not supported.'), null);
            }
        } else if (typeof callback === 'function') {
            callback.call(that, new Error('The selector should look like: "rel" or { rel:"rel" }.'), null);
        }
        return that;
    };

    /*******************************************************************************************************************
     * FINISH API Client
     * START Exposed Interfaces (Browser and Node.JS Compatible)
     ******************************************************************************************************************/
    exports.Api = Api;
    exports.Multipart = Multipart;
    exports.Naval = Naval;
    exports.Uri = Uri;
})(typeof exports === 'undefined' ? this['hypermedia'] = {} : exports);
