/**
 * Falsy Values: false, 0, "", null, undefined, NaN
 */

/**
 * Exports an instance of Plugin capable of bridging a HypermediaApi to an HTTP server using Argo as a request router.
 */
module.exports = exports = (function () {
    /**
     * Module Dependencies.
     */
    var plugin = require('./plugin.js'),
        http = require('http'),
        argo = require('argo'),
        router = require('argo-url-router'),
        partly = require('partly'),
        mp = partly.multipart,
        bp = partly.bodypart;

    return plugin().setShouldBridgeDelegate(function (api, port, host) {
        console.log(JSON.stringify(api, null, '    '));
        try {
            var protocol = api.getProtocol();

            if (protocol === 'HTTP/1.0' || protocol === 'HTTP/1.1') {
                var pipeline = argo();

                pipeline.use(router);

                /**
                 * TODO: Introduce RFC 6570 middleware that can work in Argo and Express.
                 * Introduce custom, pre-route, request middleware here.
                 */
                pipeline.use(function (handle) {
                    handle('request', function (env, next) {
                        console.log('------------------------------');
                        console.log('Affordance:');
                        console.log(env.request.method + ' ' + env.request.url);
                        console.log('Metadata:');
                        console.log(env.request.headers);
                        console.log('Payload:');
                        env.request
                            .on('data', function (chunk) {
                                if (!!chunk) {
                                    console.log(chunk.toString());
                                }
                            })
                            .on('end', function (chunk) {
                                if (!!chunk) {
                                    console.log(chunk.toString());
                                }
                                console.log('------------------------------');
                                next(env);
                            });
                    });
                });

                api.forEachRequest(function (request) {
                    pipeline.route(request.getUri(), {'methods': [ request.getMethod() ]}, function (handle) {
                        handle('request', function (env, next) {
                            api
                                .setCurrentRequest(request)
                                .handleRequest(env.request, env.response);
                            next(env);
                        });

                        handle('response', function (env, next) {
//                            api
//                                .setCurrentRequest(request)
//                                .handleResponse(env.request, env.response);
                            var body = mp('nav-data'),
                                headers = env.response.headers;

                            env.response.headers = !!headers ? headers : {};

                            if (!!env.response.body) {
                                body
                                    .addBodyPart(
                                        bp()
                                            .setType(env.response.headers['Content-Type'])
                                            .setPayload(env.response.body)
                                    )
                            }
                            body
                                .addBodyPart(
                                    bp()
                                        .setType(api.getMediaType())
                                        .setPayload(
                                            /**
                                             * Current Request reference needs deletion.
                                             * Make a Decorator Pattern for passing custom Hypermedia from request handlers.
                                             */
                                            api
                                                .setCurrentRequest(request)
                                                .getResponseBody(env.response.statusCode)
                                        )
                                );
                            env.response.headers['Content-Type'] = 'multipart/nav-data; boundary=' + body.getBoundary();
                            env.response.body = body.toString();
                            next(env);
                        });
                    });
                });

                /**
                 * Introduce custom, post-route, response middleware here.
                 */
                pipeline.use(function (handle) {
                    handle('response', function (env, next) {
                        console.log('------------------------------');
                        console.log('Status:');
                        console.log(env.response.statusCode);
                        console.log('Metadata:');
                        console.log(env.response.headers);
                        console.log('Payload:');
                        console.log(env.response.body);
                        console.log('------------------------------');
                        next(env);
                    });
                });

                var server = http.createServer(pipeline.build().run);
                server
                    .on('listening', function () {
                        console.log(JSON.stringify(server.address(), null, '    '));
                    })
                    .on('error', function (e) {
                        console.log(e);
                        if (e.code == 'EADDRINUSE') {
                            server.listen(0, host);
                        }
                    })
                    .listen(port, host);
            }
        } catch (e) {
            console.log(e);
        }
    });
})();
