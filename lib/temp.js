/**
 * Falsy Values: false, 0, "", null, undefined, NaN
 */

var fs = require('fs'),
    path = require('path'),
    affordance = require('./affordance.js'),
    affordances = require('./affordances.js'),
    encoder = require('./encoder.js'),
    input = require('./input.js'),
    naval = require('./naval.js');

Function.prototype.method = function () {
    if (arguments.length > 1) {
        var func = arguments[arguments.length - 1];
        for (var name in arguments) {
            name = arguments[name];
            if (typeof name === 'string' && typeof func === 'function') {
                this.prototype[name] = func;
            }
        }
    }
    return this;
};

function HypermediaApi(id) {
    if (typeof id === 'string') {
        this._id = id;
    }
    this._protocol = 'HTTP/1.1';
    this._mediatype = 'application/naval+json';
    this._path = '';
    this._request = null;
    this._requests = affordances();
    return this;
}

HypermediaApi
    .method('getId', function () {
        return this._id;
    })
    .method('setId', 'id', function (id) {
        this._id = (typeof id === 'string') ? id : this._id;
        return this;
    })
    .method('getProtocol', function () {
        return this._protocol;
    })
    .method('setProtocol', 'protocol', function (protocol) {
        this._protocol = (typeof protocol === 'string') ? protocol : this._protocol;
        return this;
    })
    .method('getMediaType', function () {
        return this._mediatype;
    })
    .method('setMediaType', 'mediatype', function (mediatype) {
        this._mediatype = (typeof mediatype === 'string') ? mediatype : this._mediatype;
        return this;
    })
    .method('getRequestHandlersPath', function () {
        return this._path;
    })
    .method('setRequestHandlersPath', 'path', function (dir) {
        this._path = (typeof dir === 'string') ? dir : this._path;
        return this;
    })
    .method('addMetadata', 'meta', function (meta) {
        var requests = this._requests,
            request = requests.getLastAffordance();
        if (!!request) {
            request.setMetadata(meta);
        } else {
            requests.setMetadata(meta);
        }
        return this;
    })
    .method('addRequest', 'req', function (id, method, uri) {
        var requests = this._requests;
        if (typeof id === 'string' && typeof method === 'string' &&
            typeof uri === 'string' && !requests.hasAffordanceWithId(id)) {
            requests.addAffordance(affordance(id, method, uri));
        }
        return this;
    })
    .method('addInput', 'input', function (control) {
        var requests = this._requests,
            request = requests.getLastAffordance();
        if (affordance.isPrototypeOf(request) && input.canRevive(control)) {
            request.addInput(input.revive(control));
        }
        return this;
    })
    .method('addResponse', 'res', function (res, msg) {
        var requests = this._requests,
            request = requests.getLastAffordance();
        if (affordance.isPrototypeOf(request)) {
            request.addMessage(res, msg);
        }
        return this;
    })
    .method('addRequestHandler', 'use', function (handler) {
        var base = this._path,
            requests = this._requests,
            request = requests.getLastAffordance();
        if (affordance.isPrototypeOf(request)) {
            if (typeof handler === 'string' && typeof base === 'string') {
                handler = path.resolve(base, handler);
                if (fs.existsSync(handler) && fs.statSync(handler).isFile()) {
                    try {
                        handler = require(handler);
                        request.addRequestHandler(handler);
                    } catch (e) {
                        console.log(e);
                    }
                }
            } else if (typeof handler === 'function') {
                request.addRequestHandler(handler);
            }
        }
        return this;
    })
    .method('forEachRequest', function (callback) {
        var requests = this._requests;
        requests.forEachAffordance(callback);
        return this;
    })
    .method('getCurrentRequest', function () {
        return this._request;
    })
    .method('setCurrentRequest', function (request) {
        this._request = affordance.isPrototypeOf(request) ? request : this._request;
        return this;
    })
    .method('handleRequest', function (req, res) {
        var request = this._request;
        if (affordance.isPrototypeOf(request)) {
            request.requestHandler.call(this, req, res);
        }
        delete this._request;
        return this;
    })
    .method('getResponseBody', 'body', function (response) {
        var requests = this._requests,
            request = this._request;

        if (affordance.isPrototypeOf(request)) {
            var message = Array.isArray(response) ? response : request.getMessage(response),
                hypermedia = affordances();
            message.forEach(function (req) {
                if (typeof req === 'string') {
                    hypermedia.addAffordance(requests.copyAffordanceById(req));
                } else if (!!req && typeof req === 'object') {
                    var id = req.id,
                        rel = req.rel,
                        req = requests.copyAffordanceById(id);
                    if (affordance.isPrototypeOf(req)) {
                        hypermedia.addAffordance(req.setRelation(rel));
                    }
                }
            });
            hypermedia = hypermedia.getCount() === 0
                ? hypermedia.addAffordance(requests.copyAffordanceById(request.getId()))
                : hypermedia;
            return encoder(naval).encode(hypermedia);
        }
        return '';
    });

function hapi(id) {
    return new HypermediaApi(id);
}

hapi.isPrototypeOf = function (object) {
    return object instanceof HypermediaApi;
};

module.exports = exports = hapi;
