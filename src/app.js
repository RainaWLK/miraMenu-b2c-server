'use strict';
require("babel-polyfill");

const SRC_PATH = "./build/";
var app = require('./build/app.js');

module.exports.main = (event, context, callback) => {
  console.log(event);
  console.log(context);

  app.onFileUploaded(event, context).then((msg) => {

    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Go Serverless v1.0! Your function executed successfully!',
        input: msg,
      }),
    };

    callback(null, response);
  });



  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
