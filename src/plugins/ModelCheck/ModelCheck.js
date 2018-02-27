/* eslint-disable */
/*jshint node:true, browser:true*/

/**
 * Generated by PluginGenerator 1.7.0 from webgme on Fri Feb 02 2018 10:57:08 GMT-0600 (CST).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define([
            'plugin/PluginConfig',
            '!text/.metadata.json',
            'plugin/PluginBase',
            'q',
        ], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(
            require('webgme-engine/src/plugin/PluginConfig'),
            require('./metadata.json'),
            require('webgme-engine/src/plugin/PluginBase'),
            require('q'),
        );
    }
}(function (PluginConfig,
            pluginMetadata,
            PluginBase,
            Q) {
    'use strict';

    pluginMetadata = typeof pluginMetadata === 'string' ? JSON.parse(pluginMetadata) : pluginMetadata;

    /**
     * Initializes a new instance of ModelCheck.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ModelCheck.
     * @constructor
     */
    var ModelCheck = function () {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    };

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ModelCheck.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ModelCheck.prototype = Object.create(PluginBase.prototype);
    ModelCheck.prototype.constructor = ModelCheck;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    ModelCheck.prototype.main = function (callback) {
        // Use self to access core, project, result, logger etc from PluginBase.
        // These are all instantiated at this point.
        var self = this;

        self.result.setSuccess(true);

        self.UniqueNames(self.activeNode)
            .then(function () {
                callback(null, self.result);
            })
            .catch(function (err) {
                callback(err, self.result);
            });
    };

    ModelCheck.prototype.UniqueNames = function (parent) {
        var deferred = Q.defer(),
            self = this;

        self.core.loadChildren(parent)
            .then(function (children) {
                var names = [];

                children.forEach(function (child) {
                    var name = self.core.getAttribute(child, 'name');

                    if (self.core.isConnection(child))
                        return;

                    if (names.indexOf(name) === -1) {
                        names.push(name);
                    } else {
                        self.createMessage(child, 'The child name \'' + name + '\' is not unique!' +
                            'Please make sure all nodes can be uniquely identified by its name in the model.', 'error');
                        self.result.setSuccess(false);
                    }
                });
                deferred.resolve();
            })
            .catch(deferred.reject);
        return deferred.promise;
    };

    return ModelCheck;
}));