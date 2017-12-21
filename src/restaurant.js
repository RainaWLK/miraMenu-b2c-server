
let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
//let Image = require('./image.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
//let S3 = require('./s3');
let filter = require('./filter.js');

const TABLE_NAME = "Restaurants";
const USERINFO_TABLE_NAME = "Users";

const TYPE_NAME = "restaurants";


class Restaurant {
  constructor(reqData){
      this.reqData = reqData;

      //id array
      this.restaurant_fullID = "";
      if(typeof this.reqData.params.restaurant_id === 'string'){
          this.restaurant_fullID = this.reqData.params.restaurant_id;
      }
      this.idArray = Utils.parseID(this.restaurant_fullID);

      //lang
      if(typeof reqData.queryString.lang == 'string'){
          this.lang = reqData.queryString.lang;
      }
  }

  output(data, fullID){
    data.id = fullID;
    data.photos = Utils.objToArray(data.photos);
    delete data.restaurantControl;

    return data;
  }

  outputBrief(data, fullID){
    let outputData = {
      "id": "",
      "name": "",
      "category": "",
      "geolocation": {},
      "address": "",
      "tel": "",
      "availability": "",
      "main_photo_url": {}
    };

    outputData.id = fullID;
    outputData.name = data.name;
    outputData.category = data.category;
    outputData.geolocation.zipcode = data.geolocation.zipcode;
    outputData.address = data.address;
    outputData.tel = data.tel;
    outputData.availability = (data.availability == false)?false:true;

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

  async get() {
    //let identityId = this.reqData.userinfo.cognitoIdentityId;

    try {
      //scan table Restaurant (bug: must merged into dynamodb.js)

      let params = {
        TableName: TABLE_NAME,
        ReturnConsumedCapacity: "TOTAL"
      };

      /*if(typeof this.reqData.queryString.name === 'string'){
        params.FilterExpression = "#a1 = :b";
        params.ExpressionAttributeNames = {
          "#a1": "name"
        };
        params.ExpressionAttributeValues = {
          ":b": this.reqData.queryString.name 
        };
      }*/
      //console.log(params);
      let dataArray = await db.scanDataByFilter(params);

      dataArray = dataArray.map(restaurantData => {
        //translate
        let i18n = new I18n.main(restaurantData, this.idArray);
        restaurantData = i18n.translate(this.lang);

        return this.outputBrief(restaurantData, restaurantData.id);
      }).filter(restaurantData => {
        //console.log(restaurantData);
        let pureQuery = true;
        let found = false;
        if(typeof this.reqData.queryString.name === 'string'){
          pureQuery = false;
          let name = restaurantData.name.toLowerCase();
          if(name.indexOf(this.reqData.queryString.name.toLowerCase()) >= 0){
            found = true;
          }
        }
        if(typeof this.reqData.queryString.keyword === 'string'){
          pureQuery = false;
          let name = restaurantData.name.toLowerCase();
          let category = restaurantData.category.toLowerCase();
          if(name.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
            found = true;
          }
          else if(category.indexOf(this.reqData.queryString.keyword.toLowerCase()) >= 0){
            found = true;
          }
        }
        
        if(pureQuery){
          found = true;
        }
        return found;
      });

      dataArray = filter.sortByFilter(this.reqData.queryString, dataArray);
      dataArray = filter.pageOffset(this.reqData.queryString, dataArray);

      //if empty
      if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }

      return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);   
    }catch(err) {
      console.log("==restaurant get err!!==");
      console.log(err);
      throw err;
    }
  }

  async getByID() {
      try {
          let restaurantData = await db.queryById(TABLE_NAME, this.restaurant_fullID);

          //translate
          let i18n = new I18n.main(restaurantData, this.idArray);
          restaurantData = i18n.translate(this.lang);

          //output
          let output = this.output(restaurantData, this.restaurant_fullID);
          return JSONAPI.makeJSONAPI(TYPE_NAME, output);         
      }catch(err) {
          throw err;
      }
  }

  async getPhotoInfo() {
    let restaurant_id = this.reqData.params.restaurant_id;
    let restaurantData = await db.queryById(TABLE_NAME, restaurant_id);

    //output
    let dataArray = [];

    let makePhotoArray = function(source, dest, restaurant_id){
        for(let photo_id in source.photos){
          let photoData = source.photos[photo_id];
          photoData.id = restaurant_id+photo_id;
          dest.push(photoData);
        }
        return;
    }

    makePhotoArray(restaurantData, dataArray, restaurant_id);

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
      let restaurant_id = this.reqData.params.restaurant_id;
      let restaurantData = await db.queryById(TABLE_NAME, restaurant_id);

      let photo_id = this.reqData.params.photo_id;
      let photoData = restaurantData.photos[photo_id];

      if(typeof photoData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      photoData.id = restaurant_id+photo_id;
    　let output = JSONAPI.makeJSONAPI("photos", photoData);

      return output;
    }catch(err) {
      throw err;
    }
  }

}


exports.main = Restaurant;