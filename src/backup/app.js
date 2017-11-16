let rest = require('./rest.js');

function input(event){
  let reqData = rest.makeReqData(event);
  return reqData;
}

function output(err, result, callback){
  if(err){
    if(typeof err.statusCode !== 'undefined'){
      console.log("output error with status code");
      const response = {
        statusCode: err.statusCode,
        body: err.Error
      }
      callback(null, response);
    }
    else{
      console.log("output error with no status code");
      callback(err);
    }
  }
  else{
    const response = {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  
    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    callback(null, response);
  }
}
exports.input = input;
exports.output = output;