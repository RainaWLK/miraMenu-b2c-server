const rp = require('request-promise-native');
//const queryString = require('query-string');
let app = require('./src/app.js');

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

export const main = async (event, context, callback) => {
  console.log(event);

  const code = event.queryStringParameters.code;

  let params = {
    'client_id': '167755153886-o7qrcglr58l7vakh8sr0iqn2ua9gg52a.apps.googleusercontent.com',
    'client_secret': 'oET6EHvVOi9txio9IOanlPP8',
    'redirect_uri': 'https://mtehiov913.execute-api.us-east-1.amazonaws.com/dev/oauth2callback',
    'grant_type': 'authorization_code',
    'code': code
  };

  //const stringified = queryString.stringify(params);
  let stringified = "";
  for(let i in params){
    stringified += `${i}=${params[i]}&`;
  }
  stringified = stringified.substr(0, stringified.length-1);

  var options = {
    method: 'POST',
    uri: 'https://www.googleapis.com/oauth2/v4/token',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: stringified
  };

console.log(options);
  try {
    let parsedBody = await rp(options);
    console.log(parsedBody);
    const response = {
      statusCode: 200,
      body: JSON.stringify(parsedBody),
    };
    callback(null, response);
  }
  catch(err){
    console.log(err);
    app.output(err, null, callback);
  }

};
