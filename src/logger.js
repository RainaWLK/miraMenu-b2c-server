// https://gist.github.com/spmason/1670196
// spmason/logging.js
'use strict';

var util = require('util'),
    winston = require('winston'),
    logger = new winston.Logger(),
    production = (process.env.NODE_ENV || '').toLowerCase() === 'production';

module.exports = {
    middleware: function(req, res, next){
        console.info(req.method, req.url, res.statusCode);
        next();
    },
    production: production
};

// Override the built-in console methods with winston hooks
switch((process.env.NODE_ENV || '').toLowerCase()){
    case 'production':
        production = true;
        /*logger.add(winston.transports.File, {
            filename: __dirname + '/application.log',
            handleExceptions: true,
            exitOnError: false,
            level: 'warn'
        });*/
        break;
    case 'test':
        // Don't set up the logger overrides
        break;
    default:
        logger.add(winston.transports.Console, {
            colorize: true,
            timestamp: true,
            level: 'info'
        });
        break;
}

console.log = (...args) => logger.info.call(logger, ...args);
console.info = (...args) => logger.info.call(logger, ...args);
console.warn = (...args) => logger.warn.call(logger, ...args);
console.error = (...args) => logger.error.call(logger, ...args);
console.debug = (...args) => logger.debug.call(logger, ...args);
