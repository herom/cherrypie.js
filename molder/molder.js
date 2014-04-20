/**
 * Use the Molder to populate models from an (JSON) origin in an intuitive way.
 *
 * @class Molder
 * @module JSON-Molder
 * @static
 */
var Molder = {
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
            computedProperties = [],
            model = {};

        if (modelDescription.hasOwnProperty('namespace')) {
            preparedOrigin = namespaceExtractor(origin, modelDescription.namespace);
            keys.splice(keys.indexOf('namespace'), 1);
        } else {
            preparedOrigin = origin;
        }

        if (modelDescription.hasOwnProperty('serializable')) {
            keys.splice(keys.indexOf('serializable'), 1);
        }

        keys.forEach(function (key) {
            var value = modelDescription[key],
                parsedValue;

            if (typeof value === 'function') {
                // keep computed properties to evaluate them after the ordinary properties have been evaluated.
                // the evaluated properties will be accessible within the property function.
                computedProperties.push(key);
            } else {
                if (preparedOrigin.hasOwnProperty(value)) {
                    parsedValue = preparedOrigin[value];
                } else {
                    parsedValue = namespaceExtractor(preparedOrigin, value);
                }
                model[key] = parsedValue;
            }
        });

        computedProperties.forEach(function (key) {
            var fn = modelDescription[key];
            model[key] = fn.call(preparedOrigin, preparedOrigin, namespaceExtractor);
        });

        return model;
    },

    /**
     * Takes the given origin (JSON/Object) and namespace and returns
     * the namespaced/reduced object.
     *
     * @param {Object}          origin              The JSON origin.
     * @param {String}          namespace           The model-description namespace.
     * @returns {Object}
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

module.exports = Molder;