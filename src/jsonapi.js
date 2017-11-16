//let _ = require('lodash');

/*class dataObj {
    constructor(id) {
    	this.id = id;
      //this.type = "";
      //this.attributes = {};
      this.i18n = [];
      this.resources = [];
      //this.relationships = {};
      //this.links = {};
    }
}


function makeJSONAPI(path, dataList) {
    let result = {
        "data": {}
    };

    let makeData = (orgData) => {    
        let id = orgData.id;
        delete orgData.id;
        let obj = new dataObj(id);

        obj.type = path;
        if(typeof orgData.language === 'string'){
            obj.language = orgData.language;
            delete orgData.language;
        }
        obj.attributes = orgData;

        if(typeof orgData.resources != 'undefined'){
            //obj.resources = _.cloneDeep(orgData.resources);
            for(let resource_id in orgData.resources){
                let resourceData = orgData.resources[resource_id];
                resourceData.id = resource_id;
                obj.resources.push(resourceData);
            }
            delete orgData.resources;
        }
        if(obj.resources.length == 0){
            delete obj.resources;
        }

        if(typeof orgData.i18n != 'undefined'){
            //obj.i18n = _.cloneDeep(orgData.i18n);
            for(let i18n_id in orgData.i18n){
                let i18nData = orgData.i18n[i18n_id];
                i18nData.id = i18n_id;
                obj.i18n.push(i18nData);
            }
            delete orgData.i18n;
        }
        if(obj.i18n.length == 0){
            delete obj.i18n;
        }

        //obj.relationships = {};
        //obj.links.self = "/"+obj.type+"/"+id;
        return obj;
    }

    if(Array.isArray(dataList)) {
        result.data = [];

        for(let i in dataList) {
            let data = dataList[i];
            let obj = makeData(data);
            result.data.push(obj); 
        }
    }
    else {
        result.data = makeData(dataList);
    }

    return result;
}

function parseJSONAPI(orgData) {
    let data = orgData.data;
    let dbData;

    let makeSingleData = (jsonApiData) => {
        let singleData = jsonApiData.attributes;
        if(typeof data.id != 'undefined')
            singleData.id = data.id;
        if(typeof data.language != 'undefined')
            singleData.language = data.language;
        return singleData;
    }

    if(Array.isArray(data)){
        dbData = [];
        for(let i in data){
            dbData.push(makeSingleData(data[i]));
        }
    }
    else{
        dbData = makeSingleData(data);
    }

    return dbData;
}
*/

function setUndefined(orgData){
  for(let i in orgData){
    if(orgData[i] === undefined){
      orgData[i] = "";
    }
    else if(Array.isArray(orgData[i])){
      orgData[i] = orgData[i].map(element => {
        return setUndefined(element);
      });
    }
    else if(typeof orgData[i] === 'object'){
      orgData[i] = setUndefined(orgData[i]);
    }
  }
  return orgData;
}

function makeJSONAPI(path, dataList) {
  let result = {};

  let makeData = (orgData) => {
    delete orgData.i18n;
    delete orgData.resources;
    delete orgData.language;

    return setUndefined(orgData);
  }

  if(Array.isArray(dataList)) {
    result = [];

    for(let i in dataList) {
      let data = dataList[i];
      let obj = makeData(data);
      result.push(obj); 
    }
  }
  else {
    result = makeData(dataList);
  }

  return result;
}


exports.makeJSONAPI = makeJSONAPI;
