//let ApiBuilder = require('claudia-api-builder');
//import { makeInfo } from './image.js';
//let authorizer = require('./authorizer');

let DEBUG = 0;
if(process.env.NODE_ENV == 'development'){
  DEBUG = 1;
}

//private functions
class ReqData{
  constructor() {
    this.paths = [];
    this.params = {};
    this.queryString = {};
    this.resource = "";
    this.method = "";
    this.body = {};
    this.type = "json";

    this.userinfo = {
      cognitoAuthenticationProvider: "",
      cognitoAuthenticationType: "",
      cognitoIdentityId: "",
      cognitoIdentityPoolId: ""
      //invokeid: "",
      //awsRequestId: "",
      //invokedFunctionArn: ""
    }
  }
}

function makeReqData(req) {
  let reqData = new ReqData();

  if(DEBUG) {
    reqData.resource = req.url;
    reqData.paths = req.url.split('/');
    reqData.params = req.params;
    reqData.queryString = req.query;

    //fake user info
    reqData.userinfo.cognitoAuthenticationProvider = "jumi.co";
    reqData.userinfo.cognitoAuthenticationType = "authenticated";
    reqData.userinfo.cognitoIdentityId = 'us-east-1:db063670-27cb-42a8-a6da-97fe436af727';
    reqData.userinfo.cognitoIdentityPoolId = 'us-east-1:4ad17068-f8a4-4fed-aaf7-55e7e9a2e7ac';		
  }
  else {
    //reqData.paths = req.path.split('/');
    //reqData.params = (req.pathParameters===null)?{}:req.pathParameters;
    //reqData.queryString = (req.queryStringParameters===null)?{}:req.queryStringParameters;
    console.log(req);
    console.log(req.context);
    reqData.method = req.context.method;
    reqData.resource = req.context.path;
    
    reqData.paths = req.proxyRequest.path.split('/');
    reqData.params = req.pathParams;
    reqData.queryString = req.queryString;

    //userinfo
    reqData.userinfo.cognitoAuthenticationProvider = req.context.cognitoAuthenticationProvider;
    reqData.userinfo.cognitoAuthenticationType = req.context.cognitoAuthenticationType;
    reqData.userinfo.cognitoIdentityId = req.context.cognitoIdentityId;
    reqData.userinfo.cognitoIdentityPoolId = req.context.cognitoIdentityPoolId;
  }
  reqData.body = req.body;
  console.log(`${reqData.method}: ${reqData.resource}`);

  return reqData;
}


//for compatible between express and AWS
function translateURI(orgURI){
  let uri = orgURI;
  if(DEBUG) {
    uri = uri.replace(/{/g, ":");
    uri = uri.replace(/}/g, "");
  }

  return uri;
}

//public
class Rest {
  constructor(){
    this.app = null

    if(DEBUG) {
      let express = require('express');
      let cors = require('cors');
      let bodyParser = require('body-parser');
      let db = require('./dynamodb.js');
      let path = require('path');
        
      this.app = express();
      this.app.use(bodyParser.json({limit: '50mb'}));
      //this.app.use(bodyParser.raw({limit: '50mb'}));
      this.app.use(cors());
      this.app.options("*", cors());
      this.app.use("/", express.static(path.join(__dirname, '../www')));

        let server = this.app.listen(8081, () => {
            let host = server.address().address;
            let port = server.address().port;
       
            console.log("Example app listening at http://%s:%s", host, port);
        });

        //debug API
        this.app.get("/db/:db_name", (req, res) => {
            let tableName = req.params.db_name;
            db.scan(tableName).then(msg => {
                res.send(msg);
            }).catch(err => {
                res.status(404);
                res.end();
            });
        });  
    }
    else {
        this.app = new ApiBuilder();
    }
  }
  
  responseOK(res, msg) {
    console.log('resoponse OK');
    if(DEBUG) {
      if(msg == ""){
        res.status(204);
      }
      res.send(msg);
      res.end();
    }
    else {
      if(msg == ""){
        return new this.app.ApiResponse("", {'Content-Type': 'text/plain'}, '204');
      }
      return msg;
    }
    
  }
  
  responseError(res, err) {
    console.log('resoponse Error');
    if(typeof err == 'undefined'){
      err = {};
    }
    if(typeof err.statusCode == 'undefined'){
      err.statusCode = 403;
    }
    if(typeof err.message == 'undefined'){
      err.message = "";
    }

    if(DEBUG) {
      res.status(err.statusCode);
      res.end(err.message);
    }
    else {
      return new this.app.ApiResponse(err.message, {'Content-Type': 'text/plain'}, err.statusCode);
    }
  }

  async get(orgURI, callback){
    let uri = translateURI(orgURI);
    let self = this;

    let action = async (req, res) => {
      let reqData = makeReqData(req);
      try {
        //await authorizer.permissionCheck(reqData);
        let resultMsg = await callback(reqData);
        return self.responseOK(res, resultMsg);
      }
      catch(errcode) {
        return self.responseError(res, errcode);
      }
      
    };

    if(DEBUG) {
      await this.app.get(uri, action);
    }
    else {
      await this.app.get(uri, action, {
        //authorizationType: 'AWS_IAM',
        //invokeWithCredentials: true,
        success: { code: 200 }
      });
    }
  }

  async post(orgURI, callback){
    let uri = translateURI(orgURI);
    let self = this;
    
    let action = async (req, res) => {
      let reqData = makeReqData(req);
      try {
        //await authorizer.permissionCheck(reqData);
        let resultMsg = await callback(reqData);
        return self.responseOK(res, resultMsg);
      }
      catch(err) {
        return self.responseError(res, err);
      }
      
    };

    if(DEBUG) {
      await this.app.post(uri, action);
    }
    else {
      await this.app.post(uri, action, {
        authorizationType: 'AWS_IAM',
        invokeWithCredentials: true,
        success: { code: 201 }
      });
    }
  }

  async patch(orgURI, callback){
    let uri = translateURI(orgURI);
    let self = this;
    
    let action = async (req, res) => {
      let reqData = makeReqData(req);
      try {
        //await authorizer.permissionCheck(reqData);
        let resultMsg = await callback(reqData);
        return self.responseOK(res, resultMsg);
      }
      catch(errcode) {
        return self.responseError(res, errcode);
      }
      
    };

    if(DEBUG) {
      await this.app.patch(uri, action);
    }
    else {
      await this.app.patch(uri, action, {
        authorizationType: 'AWS_IAM',
        invokeWithCredentials: true,
        success: { code: 200 }
      });
    }
  }

  async delete(orgURI, callback){
    let uri = translateURI(orgURI);
    let self = this;
    
    let action = async (req, res) => {
      let reqData = makeReqData(req);
      try {
        //await authorizer.permissionCheck(reqData);
        await callback(reqData);
        return self.responseOK(res, "");
      }
      catch(errcode) {
        return self.responseError(res, errcode);
      }
      
    };

    if(DEBUG) {
      await this.app.delete(uri, action);
    }
    else {
      await this.app.delete(uri, action, {
        authorizationType: 'AWS_IAM',
        invokeWithCredentials: true,
        success: { code: 204 }
      });
    }
  }

}

exports.main = Rest;