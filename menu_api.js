if (!global._babelPolyfill) {
  require('babel-polyfill');
}
let app = require('./src/app.js');
let Menu = require('./src/menu.js');

export const get = async (event, context, callback) => {
  try {
    let reqData = app.input(event);

    let menu = new Menu.main(reqData);
    let result = await menu.get();

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

    let menu = new Menu.main(reqData);
    let result = await menu.getByID();

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    app.output(null, result, callback);
  }
  catch(err){
    app.output(err, null, callback);
  }
};
