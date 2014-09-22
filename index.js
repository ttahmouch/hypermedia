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
    // Media Type Encoding and Decoding --------------------------------------------------------------------------------

    /**
     * Multipart -- data consisting of multiple entities of independent data types. Four subtypes are initially
     * defined, including the basic "mixed" subtype specifying a generic mixed set of parts, "alternative" for
     * representing the same data in multiple formats, "parallel" for parts intended to be viewed simultaneously,
     * and "digest" for multipart entities in which each part has a default type of "message/rfc822".
     *
     * @see http://tools.ietf.org/html/rfc2046#page-4
     *
     * @return {Multipart}
     * @constructor
     */
    function Multipart() {
        return this;
    }

    /**
     * The only mandatory global parameter for the "multipart" media type is the boundary parameter, which consists of
     * 1 to 70 characters from a set of characters known to be very robust through mail gateways, and NOT ending with
     * white space. (If a boundary delimiter line appears to end with white space, the white space must be presumed to
     * have been added by a gateway, and must be deleted.)
     *
     * Because boundary delimiters must not appear in the body parts being encapsulated, a user agent must exercise
     * care to choose a unique boundary parameter value. A boundary parameter value could be the result of an
     * algorithm designed to produce boundary delimiters with a very low probability of already existing in the data
     * to be encapsulated without having to prescan the data.
     *
     * Every resulting boundary delimiter from this algorithm will be exactly 70 characters and will NOT end in a space.
     *
     * @see http://tools.ietf.org/html/rfc2046#page-22
     *
     * @return {string} representing the boundary delimiter.
     */
    Multipart.boundary = function () {
        /**
         * RFC 2046 "Multipart" Boundary BNF:
         * bcharsnospace = DIGIT / ALPHA / "'" / "(" / ")" / "+" / "_" / "," / "-" / "." / "/" / ":" / "=" / "?"
         * bchars        = bcharsnospace / " "
         * boundary      = 0*69<bchars> bcharsnospace
         */
        for (var bChars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'()+_,-./:=? ",
                 boundary = '',
                 i = 0; i < 69; i += 1) {
            boundary += bChars.charAt(Math.floor(Math.random() * bChars.length));
        }
        return boundary + bChars.charAt(Math.floor(Math.random() * (bChars.length - 1)));
    };

    /**
     * A body part consists of a header area, a blank line, and a body area.
     *
     * NO header fields are actually required in body parts. A body part that starts with a blank line, therefore, is
     * allowed and is a body part for which all default values are to be assumed. In such a case, the absence of a
     * Content-Type header usually indicates that the corresponding body has a
     * Content-Type of "text/plain; charset=US-ASCII".
     *
     * The only header fields that have defined meaning for body parts are those the names of which begin with
     * "Content-".  All other header fields may be ignored in body parts.
     *
     * @see http://tools.ietf.org/html/rfc2046#page-18
     *
     * @param part {Object} representing a body part.
     * @example
     * {
     *     'content-type': 'multipart/parallel',
     *     'body': [
     *              {
     *                 'content-type': 'audio/basic',
     *                 'content-transfer-encoding': 'base64',
     *                 'body': '... base64-encoded audio data goes here ...'
     *              },
     *              {
     *                 'content-type': 'image/jpeg',
     *                 'content-transfer-encoding': 'base64',
     *                 'body': '... base64-encoded image data goes here ...'
     *              }
     *             ]
     * }
     *
     * "Content-" header field names may be provided using any form of capitalization. They will be normalized to
     * lowercase. Expect to access them with lowercase after using Multipart.decode() on an entity body.
     *
     * "Body" currently must be explicitly "Body" or "body". No other variations are supported. Case-sensitivity will
     * hopefully be removed later. Expect to access the body with lowercase after using Multipart.decode() on an entity
     * body.
     *
     * Any header field names may be provided as properties on an object as depicted in the example. They are not
     * limited to "Content-" headers. However, no other header field names have defined semantic meaning within the
     * context of a body part.
     *
     * Any body provided may be pre-encoded as a string, or a nested Multipart body defined as an array. The nesting may
     * be infinite. Both are depicted above.
     *
     * Any nested Multipart body arrays should not define a boundary. It will be provided for them. In the example,
     * 'content-type': 'multipart/parallel' is provided, and not 'content-type': 'multipart/parallel; boundary="gc0pJq'.
     *
     * @return {string} representing the body part.
     */
    Multipart.part = function (part) {
        /**
         * RFC 822 Header Fields BNF / RFC 2046 "Multipart" Body BNF:
         * field-name = 1*<any CHAR, excluding CTLs, SPACE, and ":">
         * field-body = *text [CRLF WSP field-body]
         * field      = field-name ":" [field-body] CRLF
         * body-part  = *field [CRLF *OCTET]
         */
        var body = '';
        if (!!part && typeof part === 'object') {
            var content = part['Body'] || part['body'],
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
     * A body must contain one or more body parts, each preceded by a boundary delimiter line, and the last one
     * followed by a closing boundary delimiter line.
     *
     * @see http://tools.ietf.org/html/rfc2046#page-17
     *
     * @param parts {Array} representing a multipart body.
     * @example
     * [
     *  {
     *     'body': '... Some text appears here ...'
     *  },
     *  {
     *     'content-type': 'multipart/parallel',
     *     'body': [
     *              {
     *                 'content-type': 'audio/basic',
     *                 'content-transfer-encoding': 'base64',
     *                 'body': '... base64-encoded audio data goes here ...'
     *              },
     *              {
     *                 'content-type': 'image/jpeg',
     *                 'content-transfer-encoding': 'base64',
     *                 'body': '... base64-encoded image data goes here ...'
     *              }
     *             ]
     *  }
     * ]
     *
     * All semantics defined in Multipart.part() apply.
     * @see Multipart.part
     *
     * @param boundary {string} representing a boundary delimiter.
     * @see Multipart.boundary
     *
     * @return {string} representing the multipart body.
     */
    Multipart.encode = function (parts, boundary) {
        /**
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
         */
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
     * Decodes a {string} representing a multipart body to an {Array} representing the multipart body.
     *
     * @param body {string} representing a multipart body.
     * @see Multipart.encode
     *
     * @param boundary {string} representing a boundary delimiter.
     * @see Multipart.boundary
     *
     * @return {Array} representing the multipart body.
     * @see Multipart.encode
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
                                    /**
                                     * 1. Skip Boundary.
                                     * 2. Is Closing Boundary? Done Tokenizing.
                                     * 3. Ignore Whitespace Characters.
                                     * 4. Ignore CRLF.
                                     */
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
                                            /**
                                             * Is Header Parameter?
                                             */
                                            if (c === ';') {
                                                var start = i,
                                                    isBchar = false;
                                                /**
                                                 * 1. Ignore Whitespace Characters and ";".
                                                 * 2. Is Boundary Parameter? Ignore '"' and Cut Boundary Parameter.
                                                 * 3. Otherwise, Jump Back to Start.
                                                 */
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
                                            /**
                                             * 1. Is Header Field Body Ending or Unfolding?
                                             * 2. Both Cases, Ignore CRLF.
                                             * 3. Case: Ending, Retain Header Field in Body Part {Object}.
                                             * 4. Case: Unfolding, Retain Whitespace Character in Field Body.
                                             */
                                            if (c === '\r' && body.charAt(i + 1) === '\n') {
                                                c = body.charAt(i += 2);
                                                /**
                                                 * Header Field Body is Ending.
                                                 */
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
                        if (c === '\r' && body.charAt(i + 1) === '\n') {
                            partBodyArea:
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
                            part['body'] = !!partBoundary ? Multipart.decode(partBody, partBoundary) : partBody;
                        }
                        parts.push(part);
                        bodyPartFollows = false;
                    }
                }
        }
        return parts;
    };

    /**
     * JSON Navigation Application Language ("NavAL") is a generic, hypermedia, media type which establishes conventions
     * for expressing hypermedia controls, such as links and forms, with JSON [RFC4627]. Web APIs may expose access to
     * their resources with NavAL. Clients of these APIs can select links and forms by their "relation" and traverse
     * them in order to progress through the application. Clients do not need to know protocol semantics.
     *
     * NavAL focuses only on hypermedia semantics. NavAL Web APIs may expose data with any media type. An accompanying
     * media type, Multipart Nav-Data, must be used with NavAL to allow hypermedia semantics to accompany application
     * data semantics. Multipart Nav-Data will be defined in its own specification.
     *
     * @return {Naval}
     * @constructor
     */
    function Naval() {
        return this;
    }

    /**
     * Encodes a hypermedia {Array} to NavAL.
     *
     * @param hypermedia {Array} representing hypermedia controls.
     * @example
     * [
     *   {
     *    "title": "Get a todo.",
     *    "rel": "getTodo",
     *    "method": "GET",
     *    "uri": "/todos/{id}"
     *   },
     *   {
     *    "title": "Create a todo.",
     *    "rel": "createTodo",
     *    "method": "POST",
     *    "uri": "/todos",
     *    "headers": {
     *     "content-type": "application/json"
     *    },
     *    "body": [
     *     {
     *      "title": "Title of the todo.",
     *      "name": "title",
     *      "value": "",
     *      "type": "text"
     *     },
     *     {
     *      "title": "Due date of the todo.",
     *      "name": "due",
     *      "value": "",
     *      "type": "date"
     *     },
     *     {
     *      "title": "Description of the todo.",
     *      "name": "description",
     *      "value": "",
     *      "type": "text"
     *     }
     *    ]
     *   }
     * ]
     *
     * @return {string} representing NavAL.
     */
    Naval.encode = function (hypermedia) {
        return JSON.stringify(Array.isArray(hypermedia) ? hypermedia : [], null, '    ');
    };

    /**
     * Decodes a NavAL {string} to an {Array} of hypermedia controls.
     *
     * @param naval {string} representing NavAL.
     * @see Naval.encode
     *
     * @return {Array} representing hypermedia controls.
     * @see Naval.encode
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
     * A Uniform Resource Identifier (URI) is a compact sequence of characters that identifies an abstract or physical
     * resource.
     * @example "http://www.google.com:80/search?query=text#result"
     *
     * @see http://tools.ietf.org/html/rfc3986
     *
     * @return {Uri}
     * @constructor
     */
    function Uri() {
        return this;
    }

    /**
     * 5.3.  Component Recomposition
     *
     * Parsed URI components can be recomposed to obtain the corresponding URI reference string.
     * Using pseudocode, this would be:
     *
     * result = ""
     *
     * if defined(scheme) then
     * append scheme to result;
     * append ":" to result;
     * endif;
     *
     * if defined(authority) then
     * append "//" to result;
     * append authority to result;
     * endif;
     *
     * append path to result;
     *
     * if defined(query) then
     * append "?" to result;
     * append query to result;
     * endif;
     *
     * if defined(fragment) then
     * append "#" to result;
     * append fragment to result;
     * endif;
     *
     * return result;
     *
     * Note that we are careful to preserve the distinction between a component that is undefined,
     * meaning that its separator was not present in the reference, and a component that is empty,
     * meaning that the separator was present and was immediately followed by the next component
     * separator or the end of the reference.
     *
     * @see http://tools.ietf.org/html/rfc3986#section-5.3
     *
     * @param uri {Object} representing the Uniform Resource Identifier (URI).
     * @example
     * {
     *   "uri": "http://www.google.com:80/search?query=text#result",
     *   "scheme": "http",
     *   "authority": "www.google.com:80",
     *   "path": "/search",
     *   "query": "query=text",
     *   "fragment": "result"
     * }
     *
     * @return {string} representing the Uniform Resource Identifier (URI).
     * @example "http://www.google.com:80/search?query=text#result"
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
     * Appendix B.  Parsing a URI Reference with a Regular Expression
     *
     * As the "first-match-wins" algorithm is identical to the "greedy" disambiguation method used by POSIX regular
     * expressions, it is natural and commonplace to use a regular expression for parsing the potential five components
     * of a URI reference.
     *
     * The following line is the regular expression for breaking-down a well-formed URI reference into its components.
     *
     * ^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?
     *  12            3  4          5       6  7        8 9
     *
     * The numbers in the second line above are only to assist readability; they indicate the reference points for each
     * subexpression (i.e., each paired parenthesis).  We refer to the value matched for subexpression <n> as $<n>.
     * For example, matching the above expression to
     *
     * http://www.ics.uci.edu/pub/ietf/uri/#Related
     *
     * results in the following subexpression matches:
     *
     * $1 = http:
     * $2 = http
     * $3 = //www.ics.uci.edu
     * $4 = www.ics.uci.edu
     * $5 = /pub/ietf/uri/
     * $6 = <undefined>
     * $7 = <undefined>
     * $8 = #Related
     * $9 = Related
     *
     * where <undefined> indicates that the component is not present, as is the case for the query component in the
     * above example.  Therefore, we can determine the value of the five components as
     *
     * scheme    = $2
     * authority = $4
     * path      = $5
     * query     = $7
     * fragment  = $9
     *
     * Going in the opposite direction, we can recreate a URI reference from its components by using the algorithm of
     * Section 5.3.
     *
     * @see http://tools.ietf.org/html/rfc3986#appendix-B
     *
     * @param uri {string} representing the Uniform Resource Identifier (URI).
     * @see Uri.encode
     *
     * @return {Object} representing the Uniform Resource Identifier (URI).
     * @see Uri.encode
     */
    Uri.decode = function (uri) {
        uri = typeof uri === 'string' ? uri : '';
        uri = /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(uri);
        /**
         * authority = [ userinfo "@" ] host [ ":" port ]
         * userinfo = *( unreserved / pct-encoded / sub-delims / ":" )
         */
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
            /**
             * Compatibility with URLUtils and Node.JS.
             * @see https://developer.mozilla.org/en-US/docs/Web/API/URLUtils
             * @see http://nodejs.org/api/url.html
             */
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

    // Hypermedia API Server and User Agent ----------------------------------------------------------------------------

    /**
     * In a web development context, an API is typically defined as a set of Hypertext Transfer Protocol (HTTP) request
     * messages, along with a definition of the structure of response messages, which is usually in an Extensible Markup
     * Language (XML) or JavaScript Object Notation (JSON) format.
     *
     * While "web API" historically has been virtually synonymous for web service, the recent trend (so-called Web 2.0)
     * has been moving away from Simple Object Access Protocol (SOAP) based web services and service-oriented
     * architecture (SOA) towards more direct representational state transfer (REST) style web resources and
     * resource-oriented architecture (ROA). Part of this trend is related to the Semantic Web movement
     * toward Resource Description Framework (RDF), a concept to promote web-based ontology engineering technologies.
     * Web APIs allow the combination of multiple APIs into new applications known as mashups.
     *
     * @see http://en.wikipedia.org/wiki/Application_programming_interface#Web_APIs
     *
     * @param api {Object} representing a web API.
     * @example
     * {
     *  "cors": ["*"],
     *  "apis": [
     *   {
     *    "id": "requestLog",
     *    "middleware": "request"
     *   },
     *   {
     *    "title": "Get all todos.",
     *    "id": "getTodos",
     *    "method": "GET",
     *    "uri": "/todos"
     *   },
     *   {
     *    "title": "Get a todo.",
     *    "id": "getTodo",
     *    "method": "GET",
     *    "uri": "/todos/{id}"
     *   },
     *   {
     *    "title": "Create a todo.",
     *    "id": "createTodo",
     *    "method": "POST",
     *    "uri": "/todos",
     *    "headers": {
     *     "content-type": "application/json"
     *    },
     *    "body": [
     *     {
     *      "title": "Title of the todo.",
     *      "name": "title",
     *      "value": "",
     *      "type": "text"
     *     },
     *     {
     *      "title": "Due date of the todo.",
     *      "name": "due",
     *      "value": "",
     *      "type": "date"
     *     },
     *     {
     *      "title": "Description of the todo.",
     *      "name": "description",
     *      "value": "",
     *      "type": "text"
     *     }
     *    ]
     *   },
     *   {
     *    "title": "Upsert a todo.",
     *    "id": "upsertTodo",
     *    "method": "PUT",
     *    "uri": "/todos/{id}",
     *    "headers": {
     *     "content-type": "application/json"
     *    },
     *    "body": [
     *     {
     *      "title": "Title of the todo.",
     *      "name": "title",
     *      "value": "",
     *      "type": "text"
     *     },
     *     {
     *      "title": "Due date of the todo.",
     *      "name": "due",
     *      "value": "",
     *      "type": "date"
     *     },
     *     {
     *      "title": "Description of the todo.",
     *      "name": "description",
     *      "value": "",
     *      "type": "text"
     *     }
     *    ]
     *   },
     *   {
     *    "title": "Delete a todo.",
     *    "id": "deleteTodo",
     *    "method": "DELETE",
     *    "uri": "/todos/{id}"
     *   }
     *  ]
     * }
     *
     * @return {Api}
     * @constructor
     */
    function Api(api) {
        var that = this;
        api = !!api && typeof api === 'object' ? api : {};
        /**
         * Node.JS Server.
         */
        that.id = typeof api.id === 'string' ? api.id : '';
        that.port = typeof api.port === 'string' ? api.port : '8080';
        that.hostname = typeof api.hostname === 'string' ? api.hostname : '0.0.0.0';
        that.cors = Array.isArray(api.cors) ? api.cors : [];
        /**
         * Non-IE Browser Client and Node.JS Client and Server.
         */
        that.origin = typeof api.origin === 'string' ? api.origin : '';
        that.protocol = typeof api.protocol === 'string' ? api.protocol : 'http';
        that.mediatype = typeof api.mediatype === 'string' ? api.mediatype : 'multipart/nav-data';
        that.apis = Array.isArray(api.apis) ? api.apis : [];
        that.debug = !!api.debug;
        return that;
    }

    /**
     * Create a new instance of Api.
     *
     * @param api {Object} representing a web API.
     * @see Api
     *
     * @return {Api}
     */
    Api.create = function (api) {
        return new Api(api);
    };

    /**
     * Enter an API at its entry point resource.
     *
     * @param uri {string} representing the Uniform Resource Identifier (URI).
     * @example "http://www.google.com/"
     *
     * @param callback {function} to be invoked when the entry point request succeeds or fails.
     * @example
     * function (error, res) {
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   console.error(error);
     *  } else {
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     *
     * Error may be an instance of {Error}. Response may be an object. If either are an object, the other is null.
     *
     * @param api {Object} representing a web API.
     * @see Api
     *
     * @return {Api}
     */
    Api.enter = function (uri, callback, api) {
        return Api.create(api).enter(uri, callback);
    };

    /**
     * Enumerates each request middleware in the Api.
     *
     * @example
     * {
     *  "id": "requestLog",
     *  "middleware": "request"
     * }
     *
     * Id must be a unique string. Middleware must be "request".
     *
     * @param callback {function} to be invoked when request middleware is encountered.
     * @example
     * function (middleware) {
     *  console.log(JSON.stringify(middleware));
     * }
     *
     * @return {Api}
     */
    Api.prototype.eachReqMiddleware = function (callback) {
        var that = this;
        if (typeof callback === 'function') {
            that.apis.forEach(function (mid) {
                if (!!mid && typeof mid === 'object') {
                    if (typeof mid.id === 'string' && mid.middleware === 'request') {
                        callback(mid);
                    }
                }
            });
        }
        return that;
    };

    /**
     * Enumerates each response middleware in the Api.
     *
     * @example
     * {
     *  "id": "responseLog",
     *  "middleware": "response"
     * }
     *
     * Id must be a unique string. Middleware must be "response".
     *
     * @param callback {function} to be invoked when response middleware is encountered.
     * @example
     * function (middleware) {
     *  console.log(JSON.stringify(middleware));
     * }
     *
     * @return {Api}
     */
    Api.prototype.eachResMiddleware = function (callback) {
        var that = this;
        if (typeof callback === 'function') {
            that.apis.forEach(function (mid) {
                if (!!mid && typeof mid === 'object') {
                    if (typeof mid.id === 'string' && mid.middleware === 'response') {
                        callback(mid);
                    }
                }
            });
        }
        return that;
    };

    /**
     * Enumerates each api route in the Api.
     *
     * @example
     * {
     *  "title": "Get all todos.",
     *  "id": "getTodos",
     *  "method": "GET",
     *  "uri": "/todos"
     * }
     * or
     * {
     *  "title": "Get all todos.",
     *  "rel": "getTodos",
     *  "method": "GET",
     *  "uri": "/todos"
     * }
     *
     * Id, rel, method, and uri must be a string.
     * Id would be used in a server context. Rel would be used in a client context. If one exists, the other does not.
     *
     * @param callback {function} to be invoked when an api route is encountered.
     * @example
     * function (api) {
     *  console.log(JSON.stringify(api));
     * }
     *
     * @return {Api}
     */
    Api.prototype.eachApi = function (callback) {
        var that = this;
        if (typeof callback === 'function') {
            that.apis.forEach(function (api) {
                if (!!api && typeof api === 'object') {
                    if (typeof api.id === 'string' || typeof api.rel === 'string') {
                        if (typeof api.method === 'string' && typeof api.uri === 'string') {
                            callback(api);
                        }
                    }
                }
            });
        }
        return that;
    };

    /**
     * CORS middleware that introspects a Node {IncomingMessage} for CORS semantics.
     *
     * @param req {IncomingMessage} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_http_incomingmessage
     *
     * @param cors {Object} that receives the CORS semantics of the current request.
     * @example
     * {
     *  origin: 'http://www.google.com',
     *  method: '',
     *  headers: '',
     *  preflight: false,
     *  simple: true,
     *  all: true,
     *  one: false,
     *  allow: true
     * }
     *
     * Origin will be the value of the Origin header defined in the request.
     * Method will be the value of the Access-Control-Request-Method header defined in the request.
     * Headers will be the value of the Access-Control-Request-Headers header defined in the request.
     * If Access-Control-Request-Method exists in the request, it is a Preflight request. The method is OPTIONS.
     * If Access-Control-Request-Method does not exist in the request, it is a Simple request. The method remains.
     * If a cors array was defined in the Object representing a web API as ["*"], then all origins are allowed.
     * If a cors array was defined in the Object representing a web API as ["origin"], then one origin is allowed.
     * If a cors array was not defined in the Object representing a web API, then no origins are allowed.
     *
     * @return {Api}
     */
    Api.prototype.incomingMessageCors = function (req, cors) {
        var that = this;
        if (!!req && typeof req === 'object' && !!cors && typeof cors === 'object') {
            if (that.protocol === 'http') {
                /**
                 * 1. Does the request have an Origin header?
                 *    a. No?  Terminate this set of steps.
                 */
                if (req.headers['origin']) {
                    /**
                     * b. Yes?
                     *    2. Get CORS request headers.
                     *       a. Origin
                     *       b. Access-Control-Request-Method
                     *       c. Access-Control-Request-Headers
                     */
                    cors.origin = req.headers['origin'] || '';
                    cors.method = req.headers['access-control-request-method'] || '';
                    cors.headers = req.headers['access-control-request-headers'] || '';
                    /**
                     * 3. Is there an Access-Control-Request-Method header?
                     *    a. No?  Simple CORS request.
                     *    b. Yes? Preflight CORS request.
                     */
                    cors.preflight = !!cors.method;
                    cors.simple = !cors.method;
                    /**
                     * 4. Does the API allow this origin?
                     *    a. No?  Do NOT set any headers and terminate this set of steps.
                     *    b. Yes?
                     */
                    cors.all = that.cors.indexOf('*') !== -1;
                    cors.one = that.cors.indexOf(cors.origin) !== -1;
                    cors.allow = cors.all || cors.one;
                }
            }
        }
        return that;
    };

    /**
     * CORS middleware that sets relevant response headers based on CORS request semantics.
     *
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     *
     * @param cors {Object} that receives the CORS semantics of the current request.
     * @example
     * {
     *  origin: 'http://www.google.com',
     *  method: '',
     *  headers: '',
     *  preflight: false,
     *  simple: true,
     *  all: true,
     *  one: false,
     *  allow: true
     * }
     *
     * @return {Api}
     */
    Api.prototype.serverResponseCors = function (res, cors) {
        var that = this;
        if (!!res && typeof res === 'object' && !!cors && typeof cors === 'object') {
            if (that.protocol === 'http') {
                /**
                 * 4. Does the API allow this origin?
                 *    a. No?  Do NOT set any headers and terminate this set of steps.
                 */
                if (cors.allow) {
                    /**
                     * b. Yes?
                     *    5. Set CORS response headers.
                     *       a. Access-Control-Allow-Origin
                     *       b. Access-Control-Allow-Credentials
                     *       c. Access-Control-Allow-Methods
                     *       d. Access-Control-Allow-Headers
                     *       e. Access-Control-Max-Age
                     *       f. Access-Control-Expose-Headers
                     * 6. Does the API support credentials?
                     *    a. No?  Set response header Access-Control-Allow-Origin to request header Origin or "*".
                     *    b. Yes? Set response header Access-Control-Allow-Origin to request header Origin.
                     *            Set response header Access-Control-Allow-Credentials to "true".
                     */
                    res.headers = res.headers || {};
                    res.headers['access-control-allow-origin'] = cors.all ? '*' : cors.origin;
                    if (cors.credential) {
                        res.headers['access-control-allow-origin'] = cors.origin;
                        res.headers['access-control-allow-credentials'] = 'true';
                    }
                    /**
                     * 7. Simple?
                     *    8. Does the API expose header fields?
                     *       a. Set response header Access-Control-Expose-Headers to the exposed header field names.
                     */
                    if (cors.simple) {
                        cors.expose = cors.expose || Object.keys(res.headers) || [];
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
                            res.headers['access-control-expose-headers'] = cors.expose.join(',');
                        }
                    }
                    /**
                     * 7. Preflight?
                     *    8. Set response header Access-Control-Allow-Methods to a subset of the list of methods.
                     *    9. Set response header Access-Control-Allow-Headers to a subset of the list of headers.
                     *   10. OPTIONAL. Set response header Access-Control-Max-Age to seconds the result may cache.
                     */
                    if (cors.preflight) {
                        res.headers['access-control-allow-methods'] = cors.method;
                        if (cors.headers) {
                            res.headers['access-control-allow-headers'] = cors.headers;
                        }
                        if (cors.age) {
                            res.headers['access-control-max-age'] = cors.age;
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
     * Hypermedia middleware that augments a server response with hypermedia semantics without modifying the original
     * intended encoding of the response. It allows for the introduction of hypermedia semantics to any existing
     * media type regardless of type (text, binary, etc).
     *
     * @param res {ServerResponse} object created by http.Server.
     * @see http://nodejs.org/api/http.html#http_class_http_serverresponse
     *
     * @param selectors {Array} of hypermedia selectors. Use a {string} identifier to select an API endpoint intact.
     * Use an {Object} with an 'id' field to select an API endpoint and modify fields before encoding.
     * @example
     * [
     *  "entry",
     *  {
     *   "title": "Get all todos.",
     *   "rel": 'collection',
     *   "id": "getTodos",
     *   "method": "GET",
     *   "uri": "/todos"
     *  }
     * ]
     *
     * @return {Api}
     */
    Api.prototype.serverResponseNavData = function (res, selectors) {
        var that = this;
        if (!!res && typeof res === 'object' && Array.isArray(selectors)) {
            if (that.protocol === 'http' && that.mediatype === 'multipart/nav-data') {
                var hypermedia = [];
                selectors.forEach(function (selector) {
                    selector = typeof selector === 'string' ? { id: selector } : selector;
                    if (!!selector && typeof selector === 'object' && typeof selector.id === 'string') {
                        that.eachApi(function (api) {
                            if (api.id === selector.id) {
                                hypermedia.push({
                                    title: selector.title || api.title,
                                    rel: selector.rel || api.rel || api.id,
                                    method: selector.method || api.method,
                                    uri: selector.uri || api.uri,
                                    headers: selector.headers || api.headers,
                                    body: selector.body || api.body
                                });
                            }
                        });
                    }
                });
                /**
                 * The only header fields that have defined meaning for body parts are those the names of which begin
                 * with "Content-".
                 *
                 * ... The absence of a Content-Type header usually indicates that the corresponding body
                 * has a content-type of "text/plain; charset=US-ASCII". ... The only header fields that
                 * have defined meaning for body parts are those the names of which begin with "Content-".
                 * @see http://tools.ietf.org/html/rfc2046#section-5.1
                 */
                var boundary = Multipart.boundary(),
                    navdata = [
                        {
                            'content-type': 'application/naval+json',
                            'body': Naval.encode(hypermedia)
                        }
                    ],
                    data = {
                        'content-type': 'text/plain; charset=US-ASCII',
                        'body': res.body || ''
                    };
                res.headers = res.headers || {};
                /**
                 * Representation header fields provide metadata about the representation.
                 * When a message includes a payload body, the representation header fields describe how to interpret
                 * the representation data enclosed in the payload body.
                 *
                 * The following header fields convey representation metadata:
                 * Content-Type, Content-Encoding, Content-Language, Content-Location
                 *
                 * @see http://tools.ietf.org/html/rfc7231#section-3.1
                 *
                 * If a payload body was previously included in the response, transfer it to a multipart body part
                 * along with its respective representation header fields.
                 * If a payload body was not previously included in the response, do not transfer it to a multipart
                 * body part along with its respective representation header fields.
                 * If representation header fields were previously included in the response, regardless if a payload
                 * body previously existed, then they are now considered stale and should be deleted.
                 */
                for (var header in res.headers) {
                    if (/^content-/.test(header.toLowerCase())) {
                        data[header.toLowerCase()] = res.headers[header];
                        delete res.headers[header];
                    }
                }
                if (res.body) {
                    navdata.push(data);
                }
                res.headers['content-type'] = 'multipart/nav-data; boundary="' + boundary + '"';
                res.body = Multipart.encode(navdata, boundary);
            }
        }
        return that;
    };

    /**
     * Transacts protocol requests using any supported request response protocol. Default is HTTP.
     * Normalizes request and response interfaces between Node.JS and XMLHttpRequest runtime environments.
     *
     * @param req {Object} that represents a protocol request.
     * @example
     * {
     *  method: 'GET',
     *  uri: 'http://127.0.0.1:80/',
     *  headers: {},
     *  body: '',
     *  username: null,
     *  password: null,
     *  withCredentials: false
     * }
     *
     * In the depicted example, the HTTP protocol expects particular fields. Every field has reasonable defaults.
     * Method must be a method defined within the protocol. The default is GET.
     * URI must be an absolute Uniform Resource Identifier string. The default is http://127.0.0.1:80/.
     * Headers must be an object of header field name and header field value pairs. The default is {}.
     * Body must be an encoded string body. The default is "".
     * Username must be a username string. The default is null.
     * Password must be a password string. The default is null.
     * WithCredentials must be a boolean. The default is false. WithCredentials is necessary for CORS requests that
     * require authentication.
     *
     * @param callback {function} to be invoked when the request succeeds or fails.
     * @example
     * function (error, res) {
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   console.error(error);
     *  } else {
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     *
     * Error may be an instance of {Error}. Response may be an object. If either are an object, the other is null.
     *
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

            /**
             * Non-IE Browser?
             */
            if (typeof XMLHttpRequest !== 'undefined') {
                try {
                    /**
                     * 1. Create a {XMLHttpRequest} instance.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#constructor
                     *
                     * 2. Include user credentials, if necessary, in all cross-origin requests.
                     *    This has no effect in same-origin request.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#the-withcredentials-attribute
                     *
                     * 3. Listen for a response load progress event. It is dispatched when the request has successfully
                     *    completed.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#event-handlers
                     *
                     * 4. Listen for the error progress event. It is dispatched when the request has failed due to
                     *    network, not application, errors.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#event-handlers
                     *
                     * 5. Sets any HTTP request header field names and values. Duplicate header field names will have
                     *    values merged into one single header.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader()-methodll
                     *
                     * 6. Finish sending the request.
                     * @see http://www.w3.org/TR/XMLHttpRequest/#the-open()-method
                     * @see http://www.w3.org/TR/XMLHttpRequest/#the-send()-method
                     */
                    var request = new XMLHttpRequest();
                    request.withCredentials = req.withCredentials;
                    request.onload = function () {
                        /**
                         * @see http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders()-method
                         */
                        var headersArray = this.getAllResponseHeaders().split('\r\n') || [],
                            headers = {};

                        /**
                         * Normalize response headers to an {Object} like Node.js. Header names are lower-cased.
                         * @see http://nodejs.org/api/http.html#http_message_headers
                         */
                        for (var header in headersArray) {
                            header = headersArray[header];
                            var colon = header.indexOf(': ');
                            if (colon !== -1) {
                                headers[header.substring(0, colon).toLowerCase()] = header.substring(colon + 2);
                            }
                        }

                        if (typeof callback === 'function') {
                            callback.call(that, null, {
                                /**
                                 * Returns 0 or an HTTP status code.
                                 * @see http://www.w3.org/TR/XMLHttpRequest/#the-status-attribute
                                 */
                                status: this.status,
                                headers: headers,
                                /**
                                 * Returns empty {string}, truthy {string}, {null}, or an {Object}.
                                 * @see http://www.w3.org/TR/XMLHttpRequest/#the-response-attribute
                                 */
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
            }
            /**
             * Node.JS?
             */
            else try {
                /**
                 * 1. Parse a URL string into an object.
                 * @see http://nodejs.org/api/url.html#url_url_parse_urlstr_parsequerystring_slashesdenotehost
                 *
                 * 2. Create a {http.ClientRequest} instance. It is a writable stream.
                 * @see http://nodejs.org/api/http.html#http_http_request_options_callback
                 * @see http://nodejs.org/api/http.html#http_class_http_clientrequest
                 *
                 * Defaults:
                 * - URI scheme is HTTP.
                 * - URI hostname is localhost.
                 * - URI port is 80.
                 * - URI path is /.
                 * - HTTP headers is { host: 'localhost' }.
                 * - HTTP headers can include { authorization: 'Basic [RFC2045-MIME variant of Base64]' }.
                 * - HTTP method is GET.
                 * - HTTP entity body is ''.
                 *
                 * 3. Listen for the 'response' event. It is emitted only once.
                 *    The response argument will be an {http.IncomingMessage} instance.
                 * @see http://nodejs.org/api/http.html#http_event_response
                 *
                 * 4. Listen for the 'error' event. It is emitted if there is an error when writing or piping data.
                 * @see http://nodejs.org/api/stream.html#stream_event_error_1
                 *
                 * 5. Finish sending the request.
                 * @see http://nodejs.org/api/http.html#http_request_end_data_encoding
                 */
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
                        /**
                         * You must consume the data from the response object by adding a 'data' handler.
                         * Until the data is consumed, the 'end' event will not fire.
                         * @see http://nodejs.org/api/http.html#http_http_incomingmessage
                         */
                        var body = '';
                        response
                            .on('data', function (data) {
                                /**
                                 * Consider if (body.length > 1e6) { // Too much memory consumption. }
                                 * 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                                 */
                                body += data;
                            })
                            .on('end', function () {
                                if (typeof callback === 'function') {
                                    callback.call(that, null, {
                                        /**
                                         * The 3-digit HTTP response status code. E.G. 404.
                                         * @see http://nodejs.org/api/http.html#http_message_statuscode
                                         */
                                        status: response.statusCode,
                                        /**
                                         * The request/response headers object. Header names are lower-cased.
                                         * @see http://nodejs.org/api/http.html#http_message_headers
                                         */
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
     * Transacts protocol requests using any supported request response protocol. Default is HTTP.
     * Normalizes request and response interfaces between Node.JS and XMLHttpRequest runtime environments.
     *
     * This method wraps the normal request method to assist with the media type multipart/nav-data.
     * It asks the origin server for multipart/nav-data responses with an Accept header.
     * It decodes the response if it was multipart/nav-data, and pulls out the hypermedia semantics from the response
     * and builds a "DOM".
     * This method allows for unwrapping responses that were augmented with hypermedia semantics. This allows the client
     * to have a hypermedia DOM accessible and still retrieve the response as if the media type of the response had
     * still been the intended type defined in their response handler.
     *
     * @param req {Object} that represents a protocol request.
     * @example
     * {
     *  method: 'GET',
     *  uri: 'http://127.0.0.1:80/',
     *  headers: {},
     *  body: '',
     *  username: null,
     *  password: null,
     *  withCredentials: false
     * }
     *
     * @param callback {function} to be invoked when the request succeeds or fails.
     * @example
     * function (error, res) {
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   console.error(error);
     *  } else {
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     *
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
                            /**
                             * ... The absence of a Content-Type header usually indicates that the corresponding body
                             * has a content-type of "text/plain; charset=US-ASCII". ... The only header fields that
                             * have defined meaning for body parts are those the names of which begin with "Content-".
                             * @see http://tools.ietf.org/html/rfc2046#section-5.1
                             */
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
     * Determines if an API route is defined by the Api instance in a server context.
     * Determines if a hypermedia affordance is defined by the Api instance in a client context.
     *
     * @param req {string} id or rel depending on whether the context is a server or client environment.
     * @return {object} representing an API route or hypermedia affordance depending on context; otherwise, null.
     */
    Api.prototype.possible = function (req) {
        var that = this,
            possible = null;
        if (typeof req === 'string') {
            that.eachApi(function (api) {
                if (api.id === req || api.rel === req) {
                    possible = api;
                }
            });
        }
        return possible;
    };

    /**
     * Enter an API at its entry point resource.
     *
     * @param uri {string} representing the Uniform Resource Identifier (URI).
     * @example "http://www.google.com/"
     *
     * @param callback {function} to be invoked when the entry point request succeeds or fails.
     * @example
     * function (error, res) {
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   console.error(error);
     *  } else {
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     *
     * Error may be an instance of {Error}. Response may be an object. If either are an object, the other is null.
     *
     * @return {Api}
     */
    Api.prototype.enter = function (uri, callback) {
        var that = this;
        if (that.protocol === 'http') {
            if (typeof uri === 'string') {
                var req = {
                    uri: uri
                };
                /**
                 * Parse the URI Origin. This will be used for scheme-relative and authority-relative URI references.
                 * @see http://tools.ietf.org/html/rfc3986#section-5.2
                 * @see http://en.wikipedia.org/wiki/Uniform_resource_identifier#URI_reference
                 */
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
     * Follow a hypermedia affordance based on its rel.
     *
     * @param selector {string|object} representing a relation string or object containing a relation field.
     * @example
     * "upsertTodo"
     * or
     * {
     *  rel: 'upsertTodo',
     *  uri: {
     *   id: '0'
     *  },
     *  body: {
     *   title: 'Grocery Shopping.',
     *   due: '2014-08-17',
     *   description: 'Buy stuff, yo.'
     *  }
     * }
     *
     * @param callback {function} to be invoked when the follow request succeeds or fails.
     * @example
     * function (error, res) {
     *  console.log('The agent is ' + JSON.stringify(this, null, ' '));
     *  if (error) {
     *   console.error(error);
     *  } else {
     *   console.log('The response is ' + JSON.stringify(res, null, ' '));
     *  }
     * }
     *
     * Error may be an instance of {Error}. Response may be an object. If either are an object, the other is null.
     *
     * @return {Api}
     */
    Api.prototype.follow = function (selector, callback) {
        var that = this;
        selector = typeof selector === 'string' ? { rel: selector } : selector;
        if (!!selector && typeof selector === 'object' && typeof selector.rel === 'string') {
            if (that.protocol === 'http') {
                var followed = false;
                that.eachApi(function (api) {
                    if (api.rel === selector.rel) {
                        var req = {
                            method: selector.method || api.method,
                            uri: selector.uri || api.uri,
                            headers: {},
                            body: '',
                            username: selector.username,
                            password: selector.password,
                            withCredentials: selector.withCredentials
                        };

                        /**
                         * Expand URI template parameters.
                         * This is NOT RFC 6570 compliant just yet.
                         * @see http://tools.ietf.org/html/rfc6570
                         */
                        if (!!req.uri && typeof req.uri === 'object') {
                            var expand = api.uri;
                            for (var param in req.uri) {
                                expand = expand.replace('{' + param + '}', encodeURIComponent(String(req.uri[param])));
                            }
                            req.uri = expand;
                        }

                        /**
                         * Naively resolve relative URI to absolute before invoking the request.
                         * This is NOT RFC 3986 compliant just yet.
                         * @see http://tools.ietf.org/html/rfc3986#section-5.2
                         */
                        var origin = Uri.decode(that.origin),
                            uri = Uri.decode(req.uri);

                        uri.scheme = uri.scheme || origin.scheme;
                        uri.authority = uri.authority || origin.authority;
                        req.uri = Uri.encode(uri);

                        /**
                         * Merge expected and custom headers. Custom header field values take precedence.
                         * Field names are case-insensitive, and are lower-cased as a normalization technique.
                         * @see http://tools.ietf.org/html/rfc7230#section-3.2
                         */
                        if (!!api.headers && typeof api.headers === 'object') {
                            for (var header in api.headers) {
                                req.headers[header.toLowerCase()] = api.headers[header];
                            }
                        }
                        if (!!selector.headers && typeof selector.headers === 'object') {
                            for (var header in selector.headers) {
                                req.headers[header.toLowerCase()] = selector.headers[header];
                            }
                        }

                        /**
                         * Process form data.
                         * - Step 1: Identify [Successful Controls].
                         * - Step 2: Build [Form Data Set].
                         *   - [Form Data Set] is a set of control-name/current-value pairs using [Successful Controls].
                         * - Step 3: Encode the [Form Data Set].
                         *   - [Form Data Set] is encoded to the content type specified by the [headers].
                         * - Step 4: Submit the encoded [Form Data Set].
                         * - Step 5: Encoded data is sent to the [uri] using the protocol specified.
                         *
                         * Need to support multipart/form-data soon.
                         * @see http://www.w3.org/TR/html401/interact/forms.html#h-17.13
                         */
                        if (Array.isArray(api.body)) {
                            if (typeof selector.body === 'string') {
                                req.body = selector.body;
                            } else {
                                var success = {};
                                api.body.forEach(function (control) {
                                    if (!!control && typeof control === 'object') {
                                        var name = typeof control.name === 'string' ? control.name : '',
                                            value = control.value;
                                        if (name) {
                                            if (!!selector.body && typeof selector.body === 'object') {
                                                if (typeof selector.body[name] !== 'undefined') {
                                                    value = selector.body[name];
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
                                        /**
                                         * Join on '&', and replace all encoded space characters with '+'.
                                         */
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

                        /**
                         * Remove all representation header fields if there is no entity payload body.
                         * It is not possible to give representation metadata for a nonexistent representation.
                         */
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

    // Non-IE Browser and Node.JS Exposed Interfaces -------------------------------------------------------------------
    exports.Api = Api;
    exports.Multipart = Multipart;
    exports.Naval = Naval;
    exports.Uri = Uri;
})(typeof exports === 'undefined' ? this['hypermedia'] = {} : exports);
