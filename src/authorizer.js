let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
import { cloneDeep } from 'lodash';
import { sprintf } from 'sprintf-js';

const USERINFO_TABLE_NAME = "Users";

let DEBUG = 0;
if(process.env.NODE_ENV == 'development'){
	DEBUG = 1;
}

function makePathList(pathArray){
    let path = {};
    let i = 1;

    let blockNum = Math.ceil((pathArray.length-1)/2);
    for(let i = 0; i < blockNum; i++){
        let p = 1 + 2*i;
        if(p < pathArray.length-1){
            path[pathArray[p]] = pathArray[p+1];
        }
        else{
            path[pathArray[p]] = null;
        }
    }

    return path;
}



async function permissionCheck(reqData){
    let path = makePathList(reqData.paths);
    console.log("permission check");

    if((DEBUG)||(path.restaurants == null)){
        console.log("skip");
        return;
    }

    let userData;
    let identityId = reqData.userinfo.cognitoIdentityId;
    try {
        userData = await db.queryById(USERINFO_TABLE_NAME, identityId);
 
        //check restaurant
        let hit = false;
        for(let i in userData.restaurants){
            let rid = userData.restaurants[i];

            if(rid == path.restaurants){
                hit = true;
                break;
            }
        }

        if(!hit){
            throw null;
        }
    }
    catch(err){ //new user
        /*userData = {
            id: identityId,
            restaurants: []
        }*/
        console.log("permission check......drop");
        throw {statusCode: 403};
    }
}

exports.permissionCheck = permissionCheck;