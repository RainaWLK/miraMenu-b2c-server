let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
//let Image = require('./image.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
//let S3 = require('./s3');
let filter = require('./filter.js');

const BRANCH_TABLE_NAME = "BranchesB2C";
const TABLE_NAME = "MenusB2C";

const TYPE_NAME = "menus";

class Menus {
  constructor(reqData){
    this.reqData = reqData;

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

  async getMenusData(){
    let menusData = {
      branch: {},
      menus: {},
      items:{}
    };
    //branch
    try {
      let branchDataArray = await db.queryByKey(BRANCH_TABLE_NAME, "branch_id-index", 'branch_id', this.branch_fullID);
      //translate
      let branch_translated = I18n.selectDataByLang(branchDataArray, this.lang);
      menusData.branch = branch_translated[0];
      menusData.branch.id = menusData.branch.branch_id;
    }
    catch(err) {
      console.log(err);
      let errMsg = new Error("not found");
      errMsg.statusCode = 404;
      throw errMsg;
    }
    if(Array.isArray(menusData.branch.menus) === false) {
      return menusData;
    }

    //menu
    //dynamodb issue, so get all items within restaurant, then filter it
    let itemIdArray = [];
    let menusArray = await db.queryByKey('MenusB2C', "restaurant_id-index", 'restaurant_id', menusData.branch.restaurant_id);
    let menus_translated = I18n.selectDataByLang(menusArray, this.lang);
    menusData.branch.menus.forEach(id => {
      let menu = menus_translated.find(e => e.menu_id === id);
      if(menu !== undefined) {
        menusData.menus[id] = menu;

        //item id
        if(Array.isArray(menu.sections)) {
          menu.sections.forEach(section => {
            if(Array.isArray(section.items)) {
              section.items.forEach(item_id => {
                if(itemIdArray.find(e => e===item_id) === undefined) {
                  itemIdArray.push(item_id);
                }
              });
            }
          });
        }
      }
    });

    //item
    let itemArray = await db.queryByKey('ItemsB2C', 'restaurant_id-index', 'restaurant_id', menusData.branch.restaurant_id);
    let item_translated = I18n.selectDataByLang(itemArray, this.lang);
    itemIdArray.forEach(id => {
      let item = item_translated.find(e => e.item_id === id);
      if(item !== undefined) {
        menusData.items[id] = item;
      }
    });

    return menusData;
  }

  async getMenuData(){
    try{
      let dbMenusData = await this.getMenusData();
      let menuData = dbMenusData.menus[this.menu_fullID];
      let itemsData = dbMenusData.items;

      if(this.branchQuery && menuData === undefined) {
        let restaurantMenuId = `r${this.idArray.r}m${this.idArray.m}`;
        menuData = dbMenusData.menus[restaurantMenuId];
        menuData.branch_name = dbMenusData.branch.branch_name;
        menuData.branch_id = dbMenusData.branch.branch_id;
      }

      if(menuData === undefined){
        let err = new Error("not found");
        err.statusCode = 404;
        throw err;
      }

      menuData.sections = this.migrateSections(menuData, itemsData);

      return menuData;
    }
    catch(err){
      throw err;
    }
  }

  output(data){
    data.id = data.menu_id;
    data.photos = Utils.objToArray(data.photos);
    //delete data.menuControl;
    delete data.restaurant_id;
    delete data.branch_id;
    delete data.menu_id;

    return data;
  }
  
  outputBrief(data){
    let outputData = {
      "id": data.menu_id,
      "name": data.name,
      "restaurant_name": data.restaurant_name,
      "branch_name": data.branch_name,
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
        item_section.items = item_section.items
          .filter(item_id => itemsData[item_id])
          .map(item_id => getItemBrief(item_id));
        return item_section;
      });
    }
    return sections;
  }

  async get() {
    try{
      let dbMenusData = await this.getMenusData();
      let menusData = dbMenusData.menus;
      let itemsData = dbMenusData.items;
  
      //output
      let dataArray = [];
      
      for(let menu_id in menusData) {
        let menuData = menusData[menu_id];

        //item brief
        menuData.sections = this.migrateSections(menuData, itemsData);

        let output = this.outputBrief(menuData);
  
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
    catch(err){
      throw err;
    }

  }

  async getByID() {
    try {
      let menuData = await this.getMenuData();

      let output = this.output(menuData);
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
    let menuData = await this.getMenuData();

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
      return "";
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
      let menuData = await this.getMenuData();

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


}

exports.main = Menus;
