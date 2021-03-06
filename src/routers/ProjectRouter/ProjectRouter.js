/*globals define*/

/**
 * Generated by RestRouterGenerator 2.2.0 from webgme on Wed Feb 14 2018 10:56:40 GMT-0600 (Central Standard Time).
 * To use in webgme add to gmeConfig.rest.components[ProjectRouter] = {
 *    mount: 'path/subPath',
 *    src: path.join(process.cwd(), './ProjectRouter'),
 *    options: {}
 * }
 * If you put this file in the root of your directory the above will expose the routes at
 * <host>/path/subPath, for example GET <host>/path/subPath/getExample will be routed to the getExample below.
 */

'use strict';

// http://expressjs.com/en/guide/routing.html
const express = require('express'),
    router = express.Router();

/**
 * Called when the server is created but before it starts to listening to incoming requests.
 * N.B. gmeAuth, safeStorage and workerManager are not ready to use until the start function is called.
 * (However inside an incoming request they are all ensured to have been initialized.)
 *
 * @param {object} middlewareOpts - Passed by the webgme server.
 * @param {GmeConfig} middlewareOpts.gmeConfig - GME config parameters.
 * @param {GmeLogger} middlewareOpts.logger - logger
 * @param {function} middlewareOpts.ensureAuthenticated - Ensures the user is authenticated.
 * @param {function} middlewareOpts.getUserId - If authenticated retrieves the userId from the request.
 * @param {object} middlewareOpts.gmeAuth - Authorization module.
 * @param {object} middlewareOpts.safeStorage - Accesses the storage and emits events (PROJECT_CREATED, COMMIT..).
 * @param {object} middlewareOpts.workerManager - Spawns and keeps track of "worker" sub-processes.
 */
function initialize(middlewareOpts) {
    const logger = middlewareOpts.logger.fork('ProjectRouter');

    logger.debug('initializing ...');

    router.get('*', (req, res, next) => {
        let projectId = req.query.project || null;


        if (projectId) {
            projectId = projectId.split('+');
            console.log(projectId);
            res.redirect('/p/' + projectId[0] + '/' + projectId[1]);
        } else {
            next();
        }
        // console.log(projectId);
    });

}

/**
 * Called before the server starts listening.
 * @param {function} callback
 */
function start(callback) {
    callback();
}

/**
 * Called after the server stopped listening.
 * @param {function} callback
 */
function stop(callback) {
    callback();
}


module.exports = {
    initialize: initialize,
    router: router,
    start: start,
    stop: stop
};
