/*globals define*/
/*eslint-env node, browser*/

/**
 * Generated by PluginGenerator 2.16.0 from webgme on Thu Feb 01 2018 16:33:12 GMT-0600 (Central Standard Time).
 * A plugin that inherits from the PluginBase. To see source code documentation about available
 * properties and methods visit %host%/docs/source/PluginBase.html.
 */

define([
    'plugin/PluginConfig',
    'text!./metadata.json',
    'plugin/PluginBase'
], function (PluginConfig,
             pluginMetadata,
             PluginBase) {
    'use strict';

    pluginMetadata = JSON.parse(pluginMetadata);

    /**
     * Initializes a new instance of ModelicaCodeGenerator.
     * @class
     * @augments {PluginBase}
     * @classdesc This class represents the plugin ModelicaCodeGenerator.
     * @constructor
     */
    function ModelicaCodeGenerator() {
        // Call base class' constructor.
        PluginBase.call(this);
        this.pluginMetadata = pluginMetadata;
    }

    /**
     * Metadata associated with the plugin. Contains id, name, version, description, icon, configStructue etc.
     * This is also available at the instance at this.pluginMetadata.
     * @type {object}
     */
    ModelicaCodeGenerator.metadata = pluginMetadata;

    // Prototypical inheritance from PluginBase.
    ModelicaCodeGenerator.prototype = Object.create(PluginBase.prototype);
    ModelicaCodeGenerator.prototype.constructor = ModelicaCodeGenerator;

    /**
     * Main function for the plugin to execute. This will perform the execution.
     * Notes:
     * - Always log with the provided logger.[error,warning,info,debug].
     * - Do NOT put any user interaction logic UI, etc. inside this method.
     * - callback always has to be called even if error happened.
     *
     * @param {function(string, plugin.PluginResult)} callback - the result callback
     */
    ModelicaCodeGenerator.prototype.main = function (callback) {
        let self = this,
            activeNode = this.activeNode,
            core = this.core,
            logger = this.logger,
            modelJson = {
                name: '',
                components: [],
                connections: []
            };

        function atComponent(nodes, node) {
            let componentData = {
                URI: '',
                name: '',
                parameters: {}
            };

            // 5) Extract the data we need from the components.
            componentData.URI = core.getAttribute(node, 'ModelicaURI');
            componentData.name = core.getAttribute(node, 'name');
            // 6) Push the data to the components array.
            modelJson.components.push(componentData);
        }

        function atConnection(nodes, node) {
            let connData = {
                src: '',
                dst: ''
            };

            // 7) Extract the data we need from connections.
            let srcPath = core.getPointerPath(node, 'src');
            let dstPath = core.getPointerPath(node, 'dst');

            // 8) Only if both src and dst exist will the connection be accounted for
            if (srcPath && dstPath) {
                modelJson.connections.push(connData); // (since connData is a referenced data-type we can push here and modify below)
                let srcNode = nodes[srcPath];
                let dstNode = nodes[dstPath];

                // 9) Since the ports are contained in components we extract the parents in
                //    order to get the full modelica path to the port-instance.
                let srcParent = core.getParent(srcNode);
                let dstParent = core.getParent(dstNode);

                connData.src = core.getAttribute(srcParent, 'name') + '.' + core.getAttribute(srcNode, 'name');
                connData.dst = core.getAttribute(dstParent, 'name') + '.' + core.getAttribute(dstNode, 'name');
            }
        }

        function getMoFileContent() {
            let moFile = 'model ' + modelJson.name;
            // 11) Using the modelJson data that we built up we extract the data for the modelica
            //     code and build up the code.

            modelJson.components.forEach(function (data) {
                moFile += '\n  ' + data.URI + ' ' + data.name + ';';
            });

            moFile += '\nequation';

            modelJson.connections.forEach(function (data) {
                moFile += '\n  connect(' + data.src + ', ' + data.dst + ');';
            });

            moFile += '\nend ' + modelJson.name + ';';

            logger.debug(moFile);

            return moFile;
        }

        // 1) Retrieve an object will all nodes in the subtree of activeNode
        this.loadNodeMap(activeNode)
            .then(function (nodes) {
                for (let path in nodes) {
                    logger.debug(core.getAttribute(nodes[path], 'name'));
                }

                modelJson.name = core.getAttribute(activeNode, 'name');

                // 2) Get all the children paths of the active node
                //    (these are the immediated children)
                let childrenPaths = core.getChildrenPaths(activeNode);
                logger.debug('Paths', childrenPaths);
                let childNode;

                // 3) Iterate of the paths and retrieve the node using the node
                //    map from 1)
                for (let i = 0; i < childrenPaths.length; i += 1) {
                    childNode = nodes[childrenPaths[i]];
                    // 4) Check the meta-type of the child-node and take action based on type.
                    if (self.isMetaTypeOf(childNode, self.META.ComponentBase)) {
                        logger.debug('Component:', core.getAttribute(childNode, 'name'));
                        atComponent(nodes, childNode);
                    } else if (self.isMetaTypeOf(childNode, self.META.ConnectionBase)) {
                        logger.debug('Connection:', core.getAttribute(childNode, 'name'));
                        atConnection(nodes, childNode);
                    }
                }

                // 10) We turn the data-structure into a string (indentation 2) and log it
                logger.debug('modelJson', JSON.stringify(modelJson, null, 2));

                // 12) Add the modelic file content as a file on the blobstorage.
                return self.blobClient.putFile(modelJson.name + '.mo', getMoFileContent());
            })
            .then(function (metadataHash) {
                logger.info(metadataHash);
                // 13) Link the uploaded file (using the hash) from the plugin result.
                self.result.addArtifact(metadataHash);
                self.result.setSuccess(true);
                callback(null, self.result);
            })
            .catch(function (err) {
                logger.error(err);
                callback(err);
            });
    };

    return ModelicaCodeGenerator;
});