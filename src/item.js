let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
//let Image = require('./image.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
//let S3 = require('./s3');
let filter = require('./filter.js');

const BRANCH_TABLE_NAME = "Branches";
const RESTAURANT_TABLE_NAME = "Restaurants";
const MENU_TABLE_NAME = "Menus";
//const TABLE_NAME = "Menus";
const TABLE_NAME = "ItemsB2C";
const COMMENT_TABLE_NAME = "UserComment";

const TYPE_NAME = "items";


class Items {
  constructor(reqData){
      this.reqData = reqData;
      console.log(this.reqData.userinfo);

      this.branchQuery = false;
      if(typeof this.reqData.params.branch_id != 'undefined'){
        this.branchQuery = true;
      }

      //parse request
      this.branch_fullID = this.reqData.params.restaurant_id;

      if(this.branchQuery){
          this.branch_fullID = this.reqData.params.restaurant_id + this.reqData.params.branch_id;
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


  async getItemsData(){
    let itemsData = {};

    try {
      let restaurantItemsData = await db.queryByKey(TABLE_NAME, "branch_id-index", 'branch_id', this.reqData.params.restaurant_id);

      let items_translated = I18n.selectDataByLang(restaurantItemsData, this.lang);
      //let restaurantMenusData = await db.queryById(TABLE_NAME, this.reqData.params.restaurant_id);
      items_translated.forEach(element => {
        element.id = element.item_id;
        itemsData[element.id] = element;
      });
    }
    catch(err){}

    if(this.branchQuery){
      try {
        let branchItemsData = await db.queryByKey(TABLE_NAME, "branch_id-index", 'branch_id', this.branch_fullID);

        let branchItems_translated = I18n.selectDataByLang(branchItemsData, this.lang);
        branchItems_translated.forEach(element => {
          element.id = element.item_id;
          itemsData[element.id] = element;
        });
      }
      catch(err) {}
    }
  
    return itemsData;
  }

  async getItemData(){
    try{
      let dbItemsData = await this.getItemsData();
      let itemData = dbItemsData[this.item_fullID];

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
    return {
      "id": fullID,
      "name": data.name,
      "restaurant_id": data.restaurant_id,
      "branch_id": data.branch_id,
      "menu_id": data.menu_id,
      "restaurant_name": data.restaurant_name,
      "branch_name": data.branch_name,
      "menu_name": data.menu_name,
      "availability": (data.menu_availability == false)?false:true,
      "item_hours": data.item_hours,
      "list_price": data.list_price,
      "tags": data.tags,
      "note": data.note,
      "main_photo_url": this.getMainPhotoUrl(data.photos)
    };
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
    let itemsData = await this.getItemsData();
    
    //output
    let dataArray = [];
    
    for(let item_id in itemsData) {
        let itemData = itemsData[item_id];

        let output = this.outputBrief(itemData, item_id);

        dataArray.push(output);
    }

    dataArray = filter.sortByFilter(this.reqData.queryString, dataArray);
    dataArray = filter.pageOffset(this.reqData.queryString, dataArray);

    //if empty
    if(dataArray.length == 0){
      return "";
    }

    return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);
  }

  async getByID() {
      try {
        let itemData = await this.getItemData();

        let output = this.output(itemData, this.item_fullID);
        return JSONAPI.makeJSONAPI(TYPE_NAME, output);
      }catch(err) {
          throw err;
      }
  }

  async getMenuItems() {
    let menusData = await db.queryById(MENU_TABLE_NAME, this.branch_fullID);

    let menu_fullID = this.branch_fullID + this.reqData.params.menu_id;
    let menuData = menusData.menus[menu_fullID];
    
    if(menuData === undefined){
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }
    
    let item_ids = {};  //id:section_name
    if(menuData.sections === undefined) { //workaround
      if((Array.isArray(menuData.items))&&(menuData.items.length > 0)) {
        menuData.items.forEach(id => {
          item_ids[id] = 'main';
        });
      }
    }
    else {
      for(let i in menuData.sections){
        let item_section = menuData.sections[i];

        item_section.items.forEach(id => {
          item_ids[id] = item_section.name;
        });
      };
    }
    if(_.isEmpty(item_ids)) {
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }

    let itemsData = [];
    let itemArray = await db.queryByKey('ItemsB2C', 'restaurant_id-index', 'restaurant_id', this.reqData.params.restaurant_id);
    let item_translated = I18n.selectDataByLang(itemArray, this.lang);
    for(let id in item_ids) {
      let item = item_translated.find(e => e.item_id === id);
      if(item !== undefined) {
        itemsData.push(item);
      }
    }

    //output
    let dataArray = itemsData.map(itemData => {
      itemData.restaurant_id = this.reqData.params.restaurant_id;
      itemData.branch_id = this.branch_fullID;
      itemData.menu_id = this.reqData.params.menu_id;

      let output = this.outputBrief(itemData, itemData.id);
      return output;
    });

    dataArray = filter.sortByFilter(this.reqData.queryString, dataArray);
    dataArray = filter.pageOffset(this.reqData.queryString, dataArray);

    //if empty
    if(dataArray.length == 0){
      return "";
    }

    return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);
  }

  async postComment(payload) {
    let inputData = payload;

    try{
      let itemData = await this.getItemData();
      console.log(itemData);

      let timestamp = Date.now();
      let id = this.item_fullID + '_' + timestamp;

      let itemCommentData = {
        id: id,
        object_id: this.item_fullID,
        identityId: this.reqData.userinfo.cognitoIdentityId,
        data: payload.data,
        date: timestamp
      }
      console.log(itemCommentData);
      let msg = await db.post(COMMENT_TABLE_NAME, itemCommentData);

      //output
      let output = {
        message: "OK"
      };
      return JSONAPI.makeJSONAPI(TYPE_NAME, output);
    }
    catch(err) {
      console.log(err);
      throw err;
    }
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
    let itemData = await this.getItemData();

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
      //let err = new Error("not found");
      //err.statusCode = 404;
      //throw err;
      return "";
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
      let itemData = await this.getItemData();

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


}



exports.main = Items;
