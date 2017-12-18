let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
//let Image = require('./image.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
//let S3 = require('./s3');

const BRANCH_TABLE_NAME = "Branches";
const RESTAURANT_TABLE_NAME = "Restaurants";
const TABLE_NAME = "Menus";

const TYPE_NAME = "items";


class Items {
  constructor(reqData){
      this.reqData = reqData;

      //store restaurant var
      this.restaurantTable = RESTAURANT_TABLE_NAME;

      this.branchQuery = false;
      if(typeof this.reqData.params.branch_id != 'undefined'){
        this.branchQuery = true;
      }

      //parse request
      this.controlName = "restaurantControl";
      this.branch_fullID = this.reqData.params.restaurant_id;
      this.branchTable = RESTAURANT_TABLE_NAME;

      if(this.branchQuery){
          this.branch_fullID = this.reqData.params.restaurant_id + this.reqData.params.branch_id;
          this.branchTable = BRANCH_TABLE_NAME;
          this.controlName = "branchControl";
      }

      //id array
      this.item_fullID = this.branch_fullID;
      if(typeof this.reqData.params.item_id != 'undefined'){
        this.item_fullID += this.reqData.params.item_id;
      }
      this.idArray = Utils.parseID(this.item_fullID);

      //lang
      if(typeof reqData.queryString.lang == 'string'){
        this.lang = reqData.queryString.lang;
      }
  }


  async getMenusData(mix){
    let menusData;
    
    if(mix){
      try {
        let restaurantMenusData = await db.queryById(TABLE_NAME, this.reqData.params.restaurant_id);
        menusData = restaurantMenusData;
      }
      catch(err){
        menusData = {
          "items": {},
          "menus": {}
        };
      }

      if(this.branchQuery){
        try {
          let branchMenusData = await db.queryById(TABLE_NAME, this.branch_fullID);
          //merge
          for(let id in branchMenusData.menus){
            menusData.menus[id] = branchMenusData.menus[id];
          }
          for(let id in branchMenusData.items){
            menusData.items[id] = branchMenusData.items[id];
          }
        }
        catch(err) {
  
        }
      }
    }
    else {
      try {
        menusData = await db.queryById(TABLE_NAME, this.branch_fullID);
      }
      catch(err){
        menusData = {
          "items": {},
          "menus": {}
        };
      }
    }

    return menusData;
  }

  async getItemData(mix){
    try{
      let dbMenusData = await this.getMenusData(mix);
      let itemData = dbMenusData.items[this.item_fullID];

      if(typeof itemData == 'undefined'){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }
      return itemData;
    }
    catch(err){
      throw err;
    }
  }

  output(data, fullID){
    data.id = fullID;
    data.photos = Utils.objToArray(data.photos);
    delete data.itemControl;

    return data;
  }

  outputBrief(data, fullID){
    let outputData = {
      "id": fullID,
      "name": data.name,
      "availability": (data.menu_availability == false)?false:true,
      "item_hours": data.item_hours,
      "list_price": data.list_price,
      "tags": data.tags,
      "note": data.note,
      "main_photo_url": this.getMainPhotoUrl(data.photos)
    };
    
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

  getMainPhotoUrl(photos){
    let main_photo = {};
    for(let i in photos){
      main_photo = photos[i];
      if(photos[i].role == 'main'){
        break;
      }
    }

    if(main_photo.url !== undefined){
      return main_photo.url;
    }
    else{
      return {};
    }
  }
  

  async get() {
    let dbMenusData = await this.getMenusData(true);
    let itemsData = dbMenusData.items;

    //output
    let dataArray = [];
    
    for(let item_id in itemsData) {
        let itemData = itemsData[item_id];

        //translate
        let i18n = new I18n.main(itemData, this.idArray);
        itemData = i18n.translate(this.lang);

        let output = this.outputBrief(itemData, item_id);

        dataArray.push(output);
    }

    dataArray = this.pageOffset(dataArray);

    //if empty
    if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
    }

    return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);
  }

  async getByID() {
      try {
        /*let dbMenusData = await this.getMenusData(true);
        let itemData = dbMenusData.items;
        let fullID = this.branch_fullID + this.reqData.params.item_id;

        let data = itemData[fullID];
        if(typeof data == 'undefined'){
            let err = new Error("not found");
            err.statusCode = 404;
            throw err;
        }*/
        let itemData = await this.getItemData(true);

        //translate
        let i18n = new I18n.main(itemData, this.idArray);
        itemData = i18n.translate(this.lang);

        let output = this.output(itemData, this.item_fullID);
        return JSONAPI.makeJSONAPI(TYPE_NAME, output);
      }catch(err) {
          throw err;
      }
  }

  async getMenuItems() {
    let dbMenusData = await this.getMenusData(true);
    let itemsData = dbMenusData.items;

    let menu_fullID = this.branch_fullID + this.reqData.params.menu_id;
    let menuData = dbMenusData.menus[menu_fullID];

    //output   
    let dataArray = menuData.items.map(item_id => {
      let itemData = itemsData[item_id];

      //translate
      let i18n = new I18n.main(itemData, this.idArray);
      itemData = i18n.translate(this.lang);

      return this.outputBrief(itemData, item_id);
    });

    dataArray = this.pageOffset(dataArray);

    //if empty
    if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
    }

    return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);
  }

  async getPhotoInfo() {
    /*let dbMenusData = await this.getMenusData(true);
    let fullID = this.branch_fullID + this.reqData.params.item_id;
    let itemData = dbMenusData.items[fullID];

    if(typeof itemData == 'undefined'){
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }*/
    let itemData = await this.getItemData(true);

    //output
    let dataArray = [];

    let makePhotoArray = function(source, dest, item_fullID){
        for(let photo_id in source.photos){
          let photoData = source.photos[photo_id];
          photoData.id = item_fullID+photo_id;
          dest.push(photoData);
        }
        return;
    }

    makePhotoArray(itemData, dataArray, this.item_fullID);

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
      /*let dbMenusData = await this.getMenusData(true);
      let fullID = this.branch_fullID + this.reqData.params.item_id;
      let itemData = dbMenusData.items[fullID];

      if(typeof itemData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }*/
      let itemData = await this.getItemData(true);

      let photo_id = this.reqData.params.photo_id;
      let photoData = itemData.photos[photo_id];

      if(typeof photoData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      photoData.id = this.item_fullID+photo_id;
    　let output = JSONAPI.makeJSONAPI("photos", photoData);

      return output;
    }catch(err) {
      throw err;
    }
  }

  async getI18n() {
    try{
      let itemData = await this.getItemData(true);

      let i18nUtils = new I18n.main(itemData, this.idArray);
      let output = i18nUtils.getI18n(this.item_fullID);
      return output;
    }catch(err) {
      throw err;
    }
  }

  async getI18nByID() {
    try {
      let itemData = await this.getItemData(true);

      let i18nUtils = new I18n.main(itemData, this.idArray);
      let output = i18nUtils.getI18nByID(this.reqData.params.i18n_id);
      return output;
    }catch(err) {
      throw err;
    }
  }

  async getResources() {
    /*let dbMenusData = await this.getMenusData(true);
    let fullID = this.branch_fullID + this.reqData.params.item_id;
    let itemData = dbMenusData.items[fullID];

    if(typeof itemData == 'undefined'){
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }*/
    let itemData = await this.getItemData(true);

    //output
    let dataArray = [];

    let makeResourceArray = function(source, dest, item_fullID){
        for(let resource_id in source.resources){
          let resourceData = source.resources[resource_id];
          resourceData.id = item_fullID+resource_id;
          dest.push(resourceData);
        }
        return;
    }

    makeResourceArray(itemData, dataArray, this.item_fullID);

    //if empty
    if(dataArray.length == 0){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
    }

    return JSONAPI.makeJSONAPI("resources", dataArray);
  }

  async getResourceByID() {
    try {
      /*let dbMenusData = await this.getMenusData(true);
      let fullID = this.branch_fullID + this.reqData.params.item_id;
      let itemData = dbMenusData.items[fullID];

      if(typeof itemData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }*/
      let itemData = await this.getItemData(true);

      let resource_id = this.reqData.params.resource_id;
      let resourceData = itemData.resources[resource_id];

      if(typeof resourceData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      resourceData.id = this.item_fullID+resource_id;
    　let output = JSONAPI.makeJSONAPI("resources", resourceData);

      return output;
    }catch(err) {
      throw err;
    }
  }

}



exports.main = Items;
