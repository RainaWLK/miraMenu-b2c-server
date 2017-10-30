const rp = require('request-promise-native');
//const queryString = require('query-string');
let app = require('./src/app.js');

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

export const main = async (event, context, callback) => {
  console.log(event);
  const response = {
    statusCode: 200,
    body: JSON.stringify("orz"),
  };
  callback(null, response);
};
