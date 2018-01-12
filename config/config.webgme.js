// DO NOT EDIT THIS FILE
// This file is automatically generated from the webgme-setup-tool.
'use strict';


var config = require('webgme-engine/config/config.default');

// The paths can be loaded from the webgme-setup.json





config.rest.components['AppRouter'] = {
  src: __dirname + '/../src/routers/AppRouter/AppRouter.js',
  mount: 'p',
  options: {}
};

// Visualizer descriptors

// Add requirejs paths
config.requirejsPaths = {
  'webgme-dss': './src/common'
};


config.mongo.uri = 'mongodb://127.0.0.1:27017/webgme_dss';
module.exports = config;
