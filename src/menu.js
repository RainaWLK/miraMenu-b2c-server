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

const TYPE_NAME = "menus";


let i18nSchema = {
  "name": "",
  "menu_desc": "",
  "menu_cat": "",
}


class Menus {
  constructor(reqData){
    this.reqData = reqData;

    //store restaurant var
    this.restaurantTable = RESTAURANT_TABLE_NAME;

    this.branchQuery = false;
    if(typeof this.reqData.params.branch_id != 'undefined'){
      this.branchQuery = true;
    }

    //parse request
    //this.controlName = "restaurantControl";
    this.branch_fullID = this.reqData.params.restaurant_id;
    this.branchTable = RESTAURANT_TABLE_NAME;
    
    if(this.branchQuery){
        this.branch_fullID = this.reqData.params.restaurant_id + this.reqData.params.branch_id;
        this.branchTable = BRANCH_TABLE_NAME;
        //this.controlName = "branchControl";
    }
    
    //id array
    this.menu_fullID = this.branch_fullID;
    if(typeof this.reqData.params.menu_id != 'undefined'){
      this.menu_fullID += this.reqData.params.menu_id;
    }
    this.idArray = Utils.parseID(this.menu_fullID);

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

  async getMenuData(mix){
    try{
      let dbMenusData = await this.getMenusData(mix);
      let menuData = dbMenusData.menus[this.menu_fullID];
      let itemsData = dbMenusData.items;      

      if(typeof menuData == 'undefined'){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }

      menuData.sections = this.migrateSections(menuData, itemsData);
      delete menuData.items;

      return menuData;
    }
    catch(err){
      throw err;
    }
  }

  output(data, fullID){
    data.id = fullID;
    data.photos = Utils.objToArray(data.photos);
    delete data.menuControl;

    //calibration
    if(data.category === undefined){
      data.category = data.menu_cat;
      delete data.menu_cat;
    }
    if(data.desc === undefined){
      data.desc = data.menu_desc;
      delete data.menu_desc;
    }
    if(data.availability === undefined){
      data.availability = data.menu_availability;
      delete data.menu_availability;      
    }

    return data;
  }
  
  outputBrief(data, fullID){
    if(data.category === undefined){
      data.category = data.menu_cat;
    }
    if(data.desc === undefined){
      data.desc = data.menu_desc;
    }
    if(data.availability === undefined){
      data.availability = data.menu_availability;
    }

    let outputData = {
      "id": fullID,
      "name": data.name,
      "category": data.category,
      "availability": (data.availability == false)?false:true,
      "menu_hours": data.menu_hours,
      "sections": data.sections,
      "main_photo_url": this.getMainPhotoUrl(data.photos)
    };
     
    return outputData;
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

  migrateSections(menuData, itemsData){
    let sections = [];

    let getItemBrief = (item_id) => {
      let itemData = itemsData[item_id];    
      //translate
      let i18n = new I18n.main(itemData, this.idArray);
      itemData = i18n.translate(this.lang);

      let itemBrief = {
        "id": item_id,
        "name": itemData.name,
        "availability": (itemData.menu_availability == false)?false:true,
        "item_hours": itemData.item_hours,
        "list_price": itemData.list_price,
        "tags": itemData.tags,
        "note": itemData.note,
        "main_photo_url": this.getMainPhotoUrl(itemData.photos)
      };
      return itemBrief;
    };

    if(menuData.sections === undefined){
      if((Array.isArray(menuData.items))&&(menuData.items.length > 0)){
        let item_section = {
          "name": "main menu",
          "items": menuData.items.filter(item_id => itemsData[item_id])
          .map(item_id => getItemBrief(item_id))
        };
        sections.push(item_section);
      }
    }
    else{
      sections = menuData.sections.map(item_section => {
        item_section.items = item_section.items.map(item_id => getItemBrief(item_id));
        return item_section;
      });
    }
    return sections;
  }

  async get() {
    let dbMenusData = await this.getMenusData(true);
    let menusData = dbMenusData.menus;
    let itemsData = dbMenusData.items;

    //output
    let dataArray = [];
    
    for(let menu_id in menusData) {
      let menuData = menusData[menu_id];

      //item brief
      menuData.sections = this.migrateSections(menuData, itemsData);

      //translate
      let i18n = new I18n.main(menuData, this.idArray);
      menuData = i18n.translate(this.lang);

      let output = this.outputBrief(menuData, menu_id);

      dataArray.push(output);
    }
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
        /*let dbMenusData = await this.getMenusData();
        let menuData = dbMenusData.menus;
        let fullID = this.branch_fullID + this.reqData.params.menu_id;

        let data = menuData[fullID];
        if(typeof data == 'undefined'){
            let err = new Error("not found");
            err.statusCode = 404;
            throw err;
        }*/
        let menuData = await this.getMenuData(true);          

        //translate
        let i18n = new I18n.main(menuData, this.idArray);
        menuData = i18n.translate(this.lang);  

        let output = this.output(menuData, this.menu_fullID);
        return JSONAPI.makeJSONAPI(TYPE_NAME, output);
      }catch(err) {
          throw err;
      }
  }

  async getPhotoInfo() {
    /*let dbMenusData = await this.getMenusData();
    let fullID = this.branch_fullID + this.reqData.params.menu_id;
    let menuData = dbMenusData.menus[fullID];

    if(typeof menuData == 'undefined'){
      let err = new Error("not found");
      err.statusCode = 404;
      throw err;
    }*/
    let menuData = await this.getMenuData(true);

    //output
    let dataArray = [];

    let makePhotoArray = function(source, dest, menu_fullID){
        for(let photo_id in source.photos){
          let photoData = source.photos[photo_id];
          photoData.id = menu_fullID+photo_id;
          dest.push(photoData);
        }
        return;
    }

    makePhotoArray(menuData, dataArray, this.menu_fullID);

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
      /*let dbMenusData = await this.getMenusData();
      let fullID = this.branch_fullID + this.reqData.params.menu_id;
      let menuData = dbMenusData.menus[fullID];

      if(typeof menuData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }*/
      let menuData = await this.getMenuData(true);

      let photo_id = this.reqData.params.photo_id;
      let photoData = menuData.photos[photo_id];

      if(typeof photoData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }

      //output
      photoData.id = this.menu_fullID+photo_id;
    　let output = JSONAPI.makeJSONAPI("photos", photoData);

      return output;
    }catch(err) {
      throw err;
    }
  }

  async getI18n() {
    try{
      /*let dbMenusData = await this.getMenusData();
      let fullID = this.branch_fullID + this.reqData.params.menu_id;
      let menuData = dbMenusData.menus[fullID];

      if(typeof menuData == 'undefined'){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }*/
      let menuData = await this.getMenuData(true);

      let i18nUtils = new I18n.main(menuData, this.idArray);
      let output = i18nUtils.getI18n(this.menu_fullID);
      return output;
    }catch(err) {
      throw err;
    }
  }

  async getI18nByID() {
    try {
      /*let dbMenusData = await this.getMenusData();
      let fullID = this.branch_fullID + this.reqData.params.menu_id;
      let menuData = dbMenusData.menus[fullID];

      if(typeof menuData == 'undefined'){
          let err = new Error("not found");
          err.statusCode = 404;
          throw err;
      }*/
      let menuData = await this.getMenuData(true);

      let i18nUtils = new I18n.main(menuData, this.idArray);
      let output = i18nUtils.getI18nByID(this.reqData.params.i18n_id);
      return output;
    }catch(err) {
      throw err;
    }
  }

}

exports.main = Menus;
