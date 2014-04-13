/**
 *
 * @class ModelFactory
 * @module
 * @static
 */
var ModelFactory = {
    /**
     * Takes the given model description along with the origin (JSON) object
     * and returns the populated model.
     *
     * @method populate
     * @param {ModelDescription|Object}     modelDescription        The particular model description object.
     * @param {JSON|Object}                 origin                  The particular JSON origin.
     * @returns {Object}
     */
    populate: function (modelDescription, origin) {
        var keys = Object.keys(modelDescription),
            namespaceExtractor = this._extractNamespace,
            preparedOrigin = {},
            parsedOutput = {};

        preparedOrigin = namespaceExtractor(origin, modelDescription.namespace);

        keys.forEach(function (key) {
            var value = modelDescription[key],
                parsedValue;

            if(typeof value === 'function') {
                parsedValue = value(origin, namespaceExtractor);
            } else {
                if(key.indexOf('serializable') < 0) {
                    parsedValue = namespaceExtractor(origin, value);
                }
            }

            parsedOutput[key] = parsedValue;
        });

        return parsedOutput;
    },

    /**
     * Takes the given origin (JSON/Object) and namespace and returns
     * the namespaced/reduced object.
     *
     * @param origin
     * @param namespace
     * @returns {*}
     * @private
     */
    _extractNamespace: function (origin, namespace) {
        var namespacedOrigin = null;

        if(typeof namespace === 'string' && namespace.indexOf('.') > -1) {
           var splittedNamespace =  namespace.split('.'),
               nestedOrigin = Object.create(origin);

            splittedNamespace.forEach(function getNamespaceExtractedOrigin (namespaceKey) {
                nestedOrigin = nestedOrigin[namespaceKey];
            });

            namespacedOrigin = nestedOrigin;
        } else {
            namespacedOrigin = origin[namespace];
        }

        return namespacedOrigin;
    }
};

module.exports = ModelFactory;