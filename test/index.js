/**
 * Unit Tests.
 */
(function () {
    var hypermedia = require('../index'),
        assert = require('assert'),
        http = require('http'),
        boundary = hypermedia.Multipart.boundary(),
        encoding = hypermedia.Multipart.encode(
            [
                {},
                {
                    'content-type': 'text/plain',
                    'body': 'something'
                }
            ],
            boundary
        ),
        expected = [
            "--" + boundary,
            "\r\n\r\n",
            "--" + boundary,
            "\r\n",
            "content-type:text/plain",
            "\r\n\r\n",
            "something",
            "\r\n",
            "--" + boundary + "--"
        ].join(''),
        decoding = hypermedia.Multipart.decode(encoding, boundary);

    assert.ok(boundary.length < 71, 'Boundary parameter length is not less than or equal to 70.');
    assert.ok(boundary[69] !== ' ', 'Boundary parameters must not end with a space.');
    assert.ok(encoding === expected, 'Multipart body did not encode properly.');
    assert.ok(decoding.length === 2, 'Multipart body did not decode properly.');
    assert.ok(Object.keys(decoding[0]).length === 1, 'Multipart body did not decode properly.');
    assert.ok(Object.keys(decoding[1]).length === 2, 'Multipart body did not decode properly.');
    assert.ok(decoding[0]['body'] === '', 'Multipart body did not decode properly.');
    assert.ok(decoding[1]['content-type'] === 'text/plain', 'Multipart body did not decode properly.');
    assert.ok(decoding[1]['body'] === 'something', 'Multipart body did not decode properly.');

    encoding = hypermedia.Naval.encode([
        { "rel": "getTodo", "method": "GET", "uri": "/todos/{id}" }
    ]);
    expected = '[{"rel":"getTodo","method":"GET","uri":"/todos/{id}"}]';
    decoding = hypermedia.Naval.decode(encoding);

    assert.ok(encoding === expected, 'Naval did not encode properly.');
    assert.ok(decoding.length === 1, 'Naval did not decode properly.');
    assert.ok(Object.keys(decoding[0]).length === 3, 'Naval did not decode properly.');
    assert.ok(decoding[0]['rel'] === 'getTodo', 'Naval did not decode properly.');
    assert.ok(decoding[0]['method'] === 'GET', 'Naval did not decode properly.');
    assert.ok(decoding[0]['uri'] === '/todos/{id}', 'Naval did not decode properly.');

    encoding = hypermedia.Uri.encode({
        scheme: 'http',
        authority: 'www.google.com:80',
        path: '/search',
        query: 'query=text',
        fragment: 'result'
    });
    expected = 'http://www.google.com:80/search?query=text#result';
    decoding = hypermedia.Uri.decode(encoding);

    assert.ok(encoding === expected, 'Uri did not encode properly.');
    assert.ok(decoding['scheme'] === 'http', 'Uri did not decode properly.');
    assert.ok(decoding['authority'] === 'www.google.com:80', 'Uri did not decode properly.');
    assert.ok(decoding['path'] === '/search', 'Uri did not decode properly.');
    assert.ok(decoding['query'] === 'query=text', 'Uri did not decode properly.');
    assert.ok(decoding['fragment'] === 'result', 'Uri did not decode properly.');

    var api = hypermedia.Api.create({
        "id": "Simple Stupid Hypermedia API",  // OPTIONAL. Identifies the web API. Default: ''
        "title": "Short text saving service.", // OPTIONAL. Describes the web API. Default: ''
        "debug": true,                         // OPTIONAL. Selects debug mode. Default: false
        "protocol": "http",                    // OPTIONAL. Selects the supported protocol. Default: 'http'
        "hostname": "0.0.0.0",                 // OPTIONAL. Describes the server hostname. Default: '0.0.0.0'
        "port": "80",                          // OPTIONAL. Describes the server port. Default: '8080'
        "cors": ["*"],                         // OPTIONAL. Describes Origin white list. "*" means all. Default: []
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
    });

    assert.ok(api instanceof hypermedia.Api, 'Api was not created properly.');
    assert.ok(api.id === 'Simple Stupid Hypermedia API', 'Api.id was not set properly.');
    assert.ok(api.title === 'Short text saving service.', 'Api.title was not set properly.');
    assert.ok(api.debug === true, 'Api.debug was not set properly.');
    assert.ok(api.protocol === 'http', 'Api.protocol was not set properly.');
    assert.ok(api.hostname === '0.0.0.0', 'Api.hostname was not set properly.');
    assert.ok(api.port === '80', 'Api.port was not set properly.');
    assert.ok(Array.isArray(api.cors) && api.cors.length === 1, 'Api.cors was not set properly.');
    assert.ok(Array.isArray(api.apis) && api.apis.length === 2, 'Api.apis was not set properly.');

    api = hypermedia.Api.createFromFile(require.resolve('./api.json'));

    assert.ok(api instanceof hypermedia.Api, 'Api was not created properly.');
    assert.ok(api.id === 'Simple Stupid Hypermedia API', 'Api.id was not set properly.');
    assert.ok(api.title === 'Short text saving service.', 'Api.title was not set properly.');
    assert.ok(api.debug === true, 'Api.debug was not set properly.');
    assert.ok(api.protocol === 'http', 'Api.protocol was not set properly.');
    assert.ok(api.hostname === '0.0.0.0', 'Api.hostname was not set properly.');
    assert.ok(api.port === '80', 'Api.port was not set properly.');
    assert.ok(Array.isArray(api.cors) && api.cors.length === 1, 'Api.cors was not set properly.');
    assert.ok(Array.isArray(api.apis) && api.apis.length === 2, 'Api.apis was not set properly.');

    api.each(function (routine, type) {
        assert.ok(type === 'mid' || type === 'api', 'Apis should only contain apis and middleware.');
        if (type === 'mid') {
            assert.ok(routine.id === 'logRequest', 'Api middleware was not defined properly.');
        }
        if (type === 'api') {
            assert.ok(routine.id === 'createNote', 'Api api was not defined properly.');
            assert.ok(routine.method === 'PUT', 'Api api was not defined properly.');
            assert.ok(routine.uri === '/notes/:note', 'Api api was not defined properly.');
        }
    });

    api.eachApi(function (api) {
        assert.ok(api.id === 'createNote', 'Api api was not defined properly.');
        assert.ok(api.method === 'PUT', 'Api api was not defined properly.');
        assert.ok(api.uri === '/notes/:note', 'Api api was not defined properly.');
    });

    api = hypermedia.Api.create({});

    /**
     * API allows all origins.
     * Normal request with no origin.
     */
    api.cors = ['*'];
    var req = new http.IncomingMessage(),
        res = new http.ServerResponse(req);
    api.incomingMessageCors(req, res);
    api.outgoingMessageCors(req, res);

    assert.ok(typeof req.cors === 'object' && req.cors, 'Req.cors was not created properly.');
    assert.ok(res.getHeader('access-control-allow-origin') === undefined, 'Res._headers was modified improperly.');

    /**
     * API allows all origins.
     * Simple CORS request with an origin.
     * Expose specific response headers. (Custom Route Logic)
     */
    api.cors = ['*'];
    req = new http.IncomingMessage();
    res = new http.ServerResponse(req);
    req.headers['origin'] = 'http://foo.example';
    api.incomingMessageCors(req, res);
    req.cors.expose = ['content-length'];
    api.outgoingMessageCors(req, res);

    assert.ok(req.cors.origin === 'http://foo.example', 'Req.cors.origin was not set properly.');
    assert.ok(req.cors.method === '', 'Req.cors.method was not set properly.');
    assert.ok(req.cors.headers === '', 'Req.cors.headers was not set properly.');
    assert.ok(req.cors.preflight === false, 'Req.cors.preflight was not set properly.');
    assert.ok(req.cors.simple === true, 'Req.cors.simple was not set properly.');
    assert.ok(req.cors.all === true, 'Req.cors.all was not set properly.');
    assert.ok(req.cors.one === false, 'Req.cors.one was not set properly.');
    assert.ok(req.cors.allow === true, 'Req.cors.allow was not set properly.');
    assert.ok(res.getHeader('access-control-allow-origin') === '*', 'Res._headers was modified improperly.');
    assert.ok(res.getHeader('access-control-expose-headers') === 'content-length', 'Res._headers was modified improperly.');

    /**
     * API allows all origins.
     * Preflight CORS request with an origin.
     * Limit response cache age. (Custom Route Logic)
     * Preflight responses automagically allow any method/header with 200 OK.
     */
    api.cors = ['*'];
    req = new http.IncomingMessage();
    res = new http.ServerResponse(req);
    req.headers['origin'] = 'http://foo.example';
    req.headers['access-control-request-method'] = 'POST';
    req.headers['access-control-request-headers'] = 'X-PINGOTHER';
    api.incomingMessageCors(req, res);
    req.cors.age = '0';
    api.outgoingMessageCors(req, res);

    assert.ok(req.cors.origin === 'http://foo.example', 'Req.cors.origin was not set properly.');
    assert.ok(req.cors.method === 'POST', 'Req.cors.method was not set properly.');
    assert.ok(req.cors.headers === 'X-PINGOTHER', 'Req.cors.headers was not set properly.');
    assert.ok(req.cors.preflight === true, 'Req.cors.preflight was not set properly.');
    assert.ok(req.cors.simple === false, 'Req.cors.simple was not set properly.');
    assert.ok(req.cors.all === true, 'Req.cors.all was not set properly.');
    assert.ok(req.cors.one === false, 'Req.cors.one was not set properly.');
    assert.ok(req.cors.allow === true, 'Req.cors.allow was not set properly.');
    assert.ok(res.getHeader('access-control-allow-origin') === '*', 'Res._headers was modified improperly.');
    assert.ok(res.getHeader('access-control-allow-methods') === 'POST', 'Res._headers was modified improperly.');
    assert.ok(res.getHeader('access-control-allow-headers') === 'X-PINGOTHER', 'Res._headers was modified improperly.');
    assert.ok(res.getHeader('access-control-max-age') === '0', 'Res._headers was modified improperly.');
    assert.ok(res.statusCode === 200, 'Res.statusCode was modified improperly.');
    assert.ok(res.body === '', 'Res.body was modified improperly.');

    /**
     * API allows no origins.
     * Preflight CORS request with an origin.
     * Access-Control-Allow-Origin is not sent.
     */
    api.cors = [];
    req = new http.IncomingMessage();
    res = new http.ServerResponse(req);
    req.headers['origin'] = 'http://foo.example';
    req.headers['access-control-request-method'] = 'POST';
    req.headers['access-control-request-headers'] = 'X-PINGOTHER';
    api.incomingMessageCors(req, res);
    api.outgoingMessageCors(req, res);

    assert.ok(req.cors.all === false, 'Req.cors.all was not set properly.');
    assert.ok(req.cors.one === false, 'Req.cors.one was not set properly.');
    assert.ok(req.cors.allow === false, 'Req.cors.allow was not set properly.');
    assert.ok(res.getHeader('access-control-allow-origin') === undefined, 'Res._headers was modified improperly.');

    /**
     * API allows one origin.
     * Preflight CORS request with an origin.
     * Access-Control-Allow-Origin is sent with http://foo.example.
     */
    api.cors = ['http://foo.example'];
    req = new http.IncomingMessage();
    res = new http.ServerResponse(req);
    req.headers['origin'] = 'http://foo.example';
    req.headers['access-control-request-method'] = 'POST';
    req.headers['access-control-request-headers'] = 'X-PINGOTHER';
    api.incomingMessageCors(req, res);
    api.outgoingMessageCors(req, res);

    assert.ok(req.cors.all === false, 'Req.cors.all was not set properly.');
    assert.ok(req.cors.one === true, 'Req.cors.one was not set properly.');
    assert.ok(req.cors.allow === true, 'Req.cors.allow was not set properly.');
    assert.ok(res.getHeader('access-control-allow-origin') === 'http://foo.example', 'Res._headers was modified improperly.');

    /**
     * API allows all origins.
     * Preflight CORS request with an origin.
     * Allow credentials in follow-up request. (Custom Route Logic)
     * Access-Control-Allow-Origin is sent with http://foo.example instead of *.
     */
    api.cors = ['*'];
    req = new http.IncomingMessage();
    res = new http.ServerResponse(req);
    req.headers['origin'] = 'http://foo.example';
    req.headers['access-control-request-method'] = 'POST';
    req.headers['access-control-request-headers'] = 'X-PINGOTHER';
    api.incomingMessageCors(req, res);
    req.cors.credential = true;
    api.outgoingMessageCors(req, res);

    assert.ok(res.getHeader('access-control-allow-origin') === 'http://foo.example', 'Res._headers was modified improperly.');
    assert.ok(res.getHeader('access-control-allow-credentials') === 'true', 'Res._headers was modified improperly.');

    /**
     * Just keep swimming...
     */
    console.log('Just keep swimming. Nothing to see here.');

})();
