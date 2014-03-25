/**
 * Falsy Values: false, 0, "", null, undefined, NaN
 */

/**
 * Augments the Function type object's prototype with a method called "method."
 * This method allows any Constructor Function, that prototypally inherits from
 * Function.prototype (so all Constructor Functions), to easily add methods to
 * their own prototype objects.
 *
 * @param name is the name of the method passed as a String object argument.
 * @param func is the first-class function object passed in as an argument.
 * @return {*} a reference to your respective Constructor Function.
 */
Function.prototype.method = function (name, func) {
    this.prototype[name] = func;
    return this;
};

/**
 * Plugins can be treated as delegates to decide on how to encode certain hypermedia semantics into a particular
 * syntax (media type), or to decide on how to decode a particular syntax (media type) back into hypermedia semantics.
 *
 * Plugins can be treated as delegates to decide on how to bridge a HypermediaApi (HAPI) instance to a live HTTP
 * server.
 *
 * The encoder extended by this plugin will invoke onShouldEncode with either an instance of
 * Affordance or Affordances. The expectation is that the method invoked will encode the object to string, and return
 * the string immediately to the encoder.
 *
 * The decoder extended by this plugin will invoke onShouldDecode with a string instance representative of a
 * hypermedia-aware syntax. The expectation is that the method will decode the string to object
 * (Affordance or Affordances), and return the object to the decoder.
 *
 * The Hypermediator extended by this plugin will invoke Plugin.bridge() with an instance of HypermediaApi, a port,
 * and a host. The expectation is that the method invoked will use the data residing in the HypermediaApi to create an
 * HTTP server that will begin accepting connections over that port and host.
 *
 * @return {*}
 * @constructor
 */
function Plugin() {
    this._onShouldBridge = null;
    this._onShouldEncode = null;
    this._onShouldDecode = null;
    return this;
}

/**
 * Accessor method to allow the setting of the bridge delegate function.
 *
 * @param delegate should be a delegate function that accepts one {HypermediaApi} argument, one {string} port argument,
 * and one {string} host argument, and attempts to start an HTTP server from the {HypermediaApi}.
 * @return {*} for chaining.
 */
Plugin.method('setShouldBridgeDelegate', function (delegate) {
    this._onShouldBridge = (typeof delegate === 'function') ? delegate : this._onShouldBridge;
    return this;
});

/**
 * Accessor method to allow the setting of the encoder delegate function.
 *
 * @param delegate should be a delegate function that accepts one argument {Affordance} or {Affordances} and returns
 * the encoded string.
 * @return {*} for chaining.
 */
Plugin.method('setShouldEncodeDelegate', function (delegate) {
    this._onShouldEncode = (typeof delegate === 'function') ? delegate : this._onShouldEncode;
    return this;
});

/**
 * Accessor method to allow the setting of the decoder delegate function.
 *
 * @param delegate should be a delegate function that accepts one argument {String} and returns
 * the decoded {Affordance} or {Affordances}.
 * @return {*} for chaining.
 */
Plugin.method('setShouldDecodeDelegate', function (delegate) {
    this._onShouldDecode = (typeof delegate === 'function') ? delegate : this._onShouldDecode;
    return this;
});

/**
 * An introspective function that checks if a Plugin instance is capable of bridging from an instance of HypermediaApi
 * to a spawned, live HTTP server, and invokes the bridge delegate function if it's available. The bridge delegate
 * should expect an instance of HypermediaApi, a port string, and a host string, and should attempt to create an
 * HTTP server.
 *
 * @param api should be an instance of {HypermediaApi}.
 * @param port should be a {string}.
 * Examples: '80', '443'
 * @param host should be a {string}.
 * Example: '127.0.0.1'
 * @return {*} for chaining.
 */
Plugin.method('bridge', function (api, port, host) {
    /**
     * The delegate reference may be a {function} or null.
     */
    var delegate = this._onShouldBridge;
    /**
     * If delegate is a {function},
     * Then it should be capable of spawning a live HTTP server given a {HypermediaApi}, {string} port, and
     * {string} host.
     */
    if (typeof delegate === 'function') {
        delegate(api, port, host);
    }
    return this;
});

/**
 * An introspective function to decide if a Plugin instance is capable of encoding a set of Affordances or Affordance.
 *
 * @return true if the Plugin has an encoder function; false, otherwise.
 */
Plugin.method('canEncode', function () {
    return typeof this._onShouldEncode === 'function';
});

/**
 * An introspective function to decide if a Plugin instance is capable of decoding a String.
 *
 * @return true if the Plugin has a decoder function; false, otherwise.
 */
Plugin.method('canDecode', function () {
    return typeof this._onShouldDecode === 'function';
});

/**
 * Convenience method to enforce safe method invocations without the use of the new operator.
 *
 * @return {Plugin}
 */
function plugin() {
    return new Plugin();
}

/**
 * Convenience method to allow for type checking outside of the scope of this module.
 * @param object is a reference to an object you would like to test the prototypal inheritance chain on.
 * @return {Boolean}
 */
plugin.isPrototypeOf = function (object) {
    return object instanceof Plugin;
};

module.exports = exports = plugin;
