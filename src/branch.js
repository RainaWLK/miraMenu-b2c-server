let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
//let Tables = require('./table.js');
//let Image = require('./image.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
//let S3 = require('./s3');

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

class Branches {
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

  async get() {
      try {
          //scan table Restaurant (bug: must merged into dynamodb.js)
          let restaurant_id = this.reqData.params.restaurant_id.toString();
          let restaurantData = await db.queryById(RESTAURANT_TABLE_NAME, restaurant_id);            
          let restaurant_i18n = new I18n.main(restaurantData, null);
          restaurantData = restaurant_i18n.translate(this.lang);

          var params = {
              TableName: TABLE_NAME,
              //ProjectionExpression: "#yr, title, info.rating",
              FilterExpression: "#a1.#a2 = :b",
              ExpressionAttributeNames: {
                  "#a1": "branchControl",
                  "#a2": "restaurant_id"
              },
              ExpressionAttributeValues: {
                    ":b": restaurant_id 
              },
              ReturnConsumedCapacity: "TOTAL"
          };
          let dataArray = await db.scanDataByFilter(params);
          dataArray = dataArray.map(branchData => {
            //table
            //let tableArray = [];
            //for(let table_id in branchData.tables){
            //    tableArray.push(table_id);
            //}
            //branchData.tables = tableArray;

            //translate
            let i18n = new I18n.main(branchData, this.idArray);
            branchData = i18n.translate(this.lang);
            branchData.restaurant_name = restaurantData.name;

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

  async getByID() {
      try {
          let branchData = await db.queryById(TABLE_NAME, this.branch_fullID);

          //table
          let tableArray = [];
          for(let table_id in branchData.tables){
              tableArray.push(table_id);
          }
          branchData.tables = tableArray;

          //translate
          let i18n = new I18n.main(branchData, this.idArray);
          branchData = i18n.translate(this.lang);

          //output
          let output = this.output(branchData, this.branch_fullID);
          return JSONAPI.makeJSONAPI(TYPE_NAME, output);
      }catch(err) {
          throw err;
      }
  }

  async searchBranches() { 
    try {
      let params = {
        TableName: B2C_TABLE_NAME,
        //FilterExpression: "contains(#branchName, :k) or contains(#restaurantName, :k) or contains(#category, :k)",
        //ExpressionAttributeNames:{
        //    "#branchName": "branch_name",
        //    "#restaurantName": "restaurant_name",
        //    "#category": "category"
        //},
        //ExpressionAttributeValues: {
        //    ":k": this.reqData.queryString.keyword
        //},
        ReturnConsumedCapacity: "TOTAL"
      };

      let dataArray = await db.scanDataByFilter(params);
/*      console.log(`got ${dataArray.length} items...`);
      dataArray = dataArray.map(branchData => {
        //translate
        let i18n = new I18n.main(branchData, this.idArray);
        branchData = i18n.translate(this.lang);
        return this.outputBrief(branchData, branchData.id);
      });*/

      dataArray = dataArray.map(branchData => {
        //translate
        let i18n = new I18n.main(branchData, this.idArray);
        branchData = i18n.translate(this.lang);
        return branchData;
      }).filter(branchData => {
        //console.log(branchData);
        let pureQuery = true;
        let found = false;

        //let idArray = Utils.parseID(branchData.id);
        //let restaurant_id = "r"+idArray.r;

        //let restaurantData = RestaurantdataArray.find(element => element.id == restaurant_id);

        //db data error
        //if(restaurantData == undefined){
        //  console.log("db data error, skip");
        //  return false;
        //}
        //let i18n = new I18n.main(restaurantData, null);
        //restaurantData = i18n.translate(this.lang);
        //branchData.restaurant_name = restaurantData.name;

        if(typeof this.reqData.queryString.keyword === 'string'){
          pureQuery = false;
          //console.log(branchData);
          //console.log(branchData.branch_name);
          //console.log(branchData.category);
          //console.log(branchData.restaurant_name);
          let name = branchData.branch_name.toLowerCase();
          let category = branchData.category.toLowerCase();
          let restaurant_name = branchData.restaurant_name.toLowerCase();
  
          if(name.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
            found = true;
          }
          else if(category.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
            found = true;
          }
          else if(restaurant_name.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
            found = true;
          }
          //else if(restaurantData.category.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
          //  found = true;
          //}
        }
        
        if(pureQuery){
          found = true;
        }

        return found;
      })
      .map(branchData => {
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

  async getPhotoInfo() {
    let branch_id = this.reqData.params.restaurant_id+this.reqData.params.branch_id;
    let branchData = await db.queryById(TABLE_NAME, branch_id);

    //output
    let dataArray = [];

    let makePhotoArray = function(source, dest, branch_id){
        for(let photo_id in source.photos){
          let photoData = source.photos[photo_id];
          photoData.id = branch_id+photo_id;
          dest.push(photoData);
        }
        return;
    }

    makePhotoArray(branchData, dataArray, branch_id);

    //if empty
    if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
    }

    return JSONAPI.makeJSONAPI("photos", dataArray);
  }

  async getPhotoInfoByID() {
    try {
      let branch_id = this.reqData.params.restaurant_id+this.reqData.params.branch_id;
      let branchData = await db.queryById(TABLE_NAME, branch_id);

      let photo_id = this.reqData.params.photo_id;
      let photoData = branchData.photos[photo_id];

      if(typeof photoData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      photoData.id = branch_id+photo_id;
    　let output = JSONAPI.makeJSONAPI("photos", photoData);

      return output;
    }catch(err) {
      throw err;
    }
  }
}


exports.main = Branches;