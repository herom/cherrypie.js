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
            parsedOutput = {},
            computedProperties = [];

        if (modelDescription.hasOwnProperty('namespace')) {
            preparedOrigin = namespaceExtractor(origin, modelDescription.namespace);
        } else {
            preparedOrigin = origin;
        }

        keys.forEach(function (key) {
            var value = modelDescription[key],
                includeProperty = true,
                parsedValue;

            if (typeof value === 'function') {
                // keep computed properties to evaluate them after the ordinary properties has been evaluated.
                // the evaluated properties will be accessible within the property function
                computedProperties.push(key);

            } else {
                includeProperty = key.indexOf('serializable') < 0 && key.indexOf('namespace') < 0;
                if (includeProperty) {
                    if (preparedOrigin.hasOwnProperty(value)) {
                        parsedValue = preparedOrigin[value];
                    } else {
                        parsedValue = namespaceExtractor(preparedOrigin, value);
                    }
                }
                if (includeProperty) {
                    parsedOutput[key] = parsedValue;
                }
            }
        });

        computedProperties.forEach(function (key) {
            var fn = modelDescription[key];
            parsedOutput[key] = fn.call(preparedOrigin, preparedOrigin, namespaceExtractor);
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

        if (typeof namespace === 'string' && namespace.indexOf('.') > -1) {
            var splittedNamespace = namespace.split('.'),
                nestedOrigin = Object.create(origin);

            splittedNamespace.forEach(function getNamespaceExtractedOrigin(namespaceKey) {
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