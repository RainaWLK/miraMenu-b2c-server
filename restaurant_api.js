if (!global._babelPolyfill) {
  require('babel-polyfill');
}
let app = require('./src/app.js');
let Restaurant = require('./src/restaurant.js');

export const get = async (event, context, callback) => {
  try {
    let reqData = app.input(event);
 
    let restaurant = new Restaurant.main(reqData);
    let result = await restaurant.get();

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    app.output(null, result, callback);
  }
  catch(err){
    app.output(err.message, null, callback);
  }
};

export const getByID = async (event, context, callback) => {
  try {
    let reqData = app.input(event);
 
    let restaurant = new Restaurant.main(reqData);
    let result = await restaurant.getByID();

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    app.output(null, result, callback);
  }
  catch(err){
    app.output(err, null, callback);
  }
};
