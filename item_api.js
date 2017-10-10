if (!global._babelPolyfill) {
  require('babel-polyfill');
}
let app = require('./src/app.js');
let Item = require('./src/item.js');

export const get = async (event, context, callback) => {
  try {
    let reqData = app.input(event);

    let item = new Item.main(reqData);
    let result = await item.get();

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    app.output(null, result, callback);
  }
  catch(err){
    app.output(err, null, callback);
  }
};

export const getByID = async (event, context, callback) => {
  try {
    let reqData = app.input(event);

    let item = new Item.main(reqData);
    let result = await item.getByID();

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    app.output(null, result, callback);
  }
  catch(err){
    app.output(err, null, callback);
  }
};
