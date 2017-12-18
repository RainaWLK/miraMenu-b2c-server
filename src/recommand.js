let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
let I18n = require('./i18n.js');
let _ = require('lodash');

const TABLE_NAME = "Branches";
const RESTAURANT_TABLE_NAME = "Restaurants";

const B2C_TABLE_NAME = "BranchesB2C";

const TYPE_NAME = "branches";


let i18nSchema = {
    "name": "",
    "desc": "",
    "category": "",
    "details": "",
    "special_event": [""]
}

class Recommand {
  constructor(reqData){
      this.reqData = reqData;

      //id array
      this.branch_fullID = this.reqData.params.restaurant_id;
      if(typeof this.reqData.params.branch_id === 'string'){
          this.branch_fullID += this.reqData.params.branch_id;
      }
      this.idArray = Utils.parseID(this.branch_fullID);

      //lang
      if(typeof reqData.queryString.lang == 'string'){
          this.lang = reqData.queryString.lang;
      }
  }

  output(data, fullID){
    data.id = fullID;
    data.photos = Utils.objToArray(data.photos);
    delete data.branchControl;

    //data.geolocation = {};
    //data.geolocation.zipcode = data.zipcode;
    //data.address = data.location.address;
    //data.tel = data.location.tel;
    //delete data.location;

    return data;
  }
  
  outputBrief(data, fullID){
    let outputData = {
      "id": fullID,
      "restaurant_name": data.restaurant_name,
      "branch_name": data.branch_name,
      "category": data.category,
      "geolocation": {
        "zipcode": data.geolocation.zipcode
      },
      "address": data.address,
      "tel": data.tel,
      "availability": (data.availability == false)?false:true,
      "branch_hours": data.branch_hours,
      "main_photo_url": {}
    };

    let main_photo = {};
    for(let i in data.photos){
      main_photo = data.photos[i];
      if(data.photos[i].role == 'main'){
        break;
      }
    }

    if(main_photo.url !== undefined){
      outputData.main_photo_url = main_photo.url;
    }
      
    return outputData;
  }

  pageOffset(dataArray){
    let page = 0;
    let limit = 0;
    let start = 0;
    let end = null;
    if(typeof this.reqData.queryString.page == 'string'){
      page = parseInt(this.reqData.queryString.page);
    }      
    if(typeof this.reqData.queryString.offset == 'string'){
      limit = parseInt(this.reqData.queryString.offset);
    }
    if(page > 0 && limit > 0){
      //params.Limit = limit;
      start = (page-1)*limit;
      end = page*limit;
    }

    //page offset
    if((start >= 0) && (end > 0)){
      dataArray = dataArray.slice(start, end);
    }
    
    return dataArray;
  }

  async getBranchIDList(){
    try{
      var params = {
        TableName: TABLE_NAME,
        //ProjectionExpression: "#yr, title, info.rating",
        ExpressionAttributeNames: {
          "#id": "id"
        },
        ProjectionExpression: '#id',
        ReturnConsumedCapacity: "TOTAL"
      };
      let dataArray = await db.scanDataByFilter(params);
      let result = dataArray.map(branchData => branchData.id);
      return result;
    }catch(err) {
      console.log("==branch get err!!==");
      console.log(err);
      throw err;
    }
  }

  //quantity, 
  async getBranches() {
    try {
      let idList = await this.getBranchIDList();
      let recommand_idList = [];
      
      let quantity = parseInt(this.reqData.queryString.quantity, 10);
      if((isNaN(quantity))||(quantity < 0)||(quantity > 100)){
        quantity = 10;
      }
      console.log(quantity);


      let params = {
        RequestItems: {}
      };
      params.RequestItems[B2C_TABLE_NAME] = {
        Keys: []
      };
      let keys = params.RequestItems[B2C_TABLE_NAME].Keys;

      let tmp = {};

      for(let i = 0; i < quantity; i++){
        let num = Math.floor(Math.random() * idList.length);
        //check existed
        if(tmp[num] !== undefined){
          console.log("skip:"+num);
          i--;
          continue;
        }
        tmp[num] = 0;

        console.log(num);
        console.log(idList[num]);
        let id = idList[num];

        keys.push({'id': id});
      }
      console.log(keys);
      console.log(params);

      let result = await db.batchGet(params);
      let dataArray = result.Responses[B2C_TABLE_NAME];
      dataArray = dataArray.map(branchData => {
        //translate
        let i18n = new I18n.main(branchData, this.idArray);
        branchData = i18n.translate(this.lang);

        //sync with b2c table
        branchData.branch_name = branchData.name;
        delete branchData.name;

        return this.outputBrief(branchData, branchData.id);
      });

      dataArray = this.pageOffset(dataArray);

      //if empty
      if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }

      return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);       
    }catch(err) {
      console.log("==branch get err!!==");
      console.log(err);
      throw err;
    }
  }

}

async function unittest(){
  let reqData = {
    params: {
      restaurant_id: "r111",
      branch_id: "s111"
    },
    queryString: {

    }
  }
  let start_time = Date.now();

  let recommand = new Recommand(reqData);
  let result = await recommand.getBranchIDList();
  console.log(result);
  console.log("time used: "+ (Date.now() - start_time));
}


exports.main = Recommand;
exports.unittest = unittest;