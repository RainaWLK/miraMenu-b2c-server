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
        reqData.paths = req.path.split('/');
        reqData.params = (req.pathParameters===null)?{}:req.pathParameters;
		reqData.queryString = (req.queryStringParameters===null)?{}:req.queryStringParameters;
		reqData.method = req.httpMethod;
		reqData.resource = req.resource;

		//userinfo
		reqData.userinfo.cognitoAuthenticationProvider = req.requestContext.identity.cognitoAuthenticationProvider;
		reqData.userinfo.cognitoAuthenticationType = req.requestContext.identity.cognitoAuthenticationType;
		reqData.userinfo.cognitoIdentityId = req.requestContext.identity.cognitoIdentityId;
		reqData.userinfo.cognitoIdentityPoolId = req.requestContext.identity.cognitoIdentityPoolId;
    }
    reqData.body = req.body;

    return reqData;
}


exports.makeReqData = makeReqData;
