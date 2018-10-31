let db = require('./dynamodb.js');
let JSONAPI = require('./jsonapi.js');
let Utils = require('./utils.js');
let I18n = require('./i18n.js');
let _ = require('lodash');
let filter = require('./filter.js');
let Branches = require('./branch.js');
let Items = require('./item.js');
let es = require('./elasticsearch.js');

const TABLE_NAME = "Branches";
const RESTAURANT_TABLE_NAME = "Restaurants";
const ITEM_TABLE_NAME = "ItemsB2C";

const B2C_TABLE_NAME = "BranchesB2C";

const TYPE_NAME = "branches";

class Recommend {
  constructor(reqData){
      this.reqData = reqData;
      //default
      this.lang = 'en-US';

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
      "logo_photo_url": this.getMainPhotoUrl(data.photos).logo,
      "main_photo_url": this.getMainPhotoUrl(data.photos).main
    };

    return outputData;
  }

  outputItemBrief(data, fullID){
    let outputData = {
      "id": fullID,
      'uri': data.uri,
      "restaurant_name": data.restaurant_name,
      "branch_name": (data.branch_name==='')?undefined:data.branch_name,
      "name": data.name,
      "availability": (data.availability == false)?false:true,
      "item_hours": data.item_hours,
      "list_price": data.list_price,
      "tags": data.tags,
      "note": data.note,
      "main_photo_url": this.getMainPhotoUrl(data.photos).main
    };
    return outputData;
  }

  getMainPhotoUrl(photos){
    let main_photo_url = {};
    let logo_photo_url = {};

    let logo_photo = {};
    //main photo
    let main_photo = {};
    let got_main = false;
    for(let i in photos){
      if(photos[i].role === 'logo'){
        logo_photo = photos[i];
      }
      else if(photos[i].role === 'main'){
        main_photo = photos[i];
        got_main = true;
      }
      else if(got_main === false){
        main_photo = photos[i];
      }
    }

    if(main_photo.url !== undefined){
      main_photo_url = main_photo.url;
    }
    if(logo_photo.url !== undefined){
      logo_photo_url = logo_photo.url;
    }
    return {
      'main': main_photo_url,
      'logo': logo_photo_url
    }
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

  //quantity, current
  async getBranches() {
    try {
      let idList = await this.getBranchIDList();

      let quantity = parseInt(this.reqData.queryString.quantity, 10);
      if((isNaN(quantity))||(quantity < 0)||(quantity > 100)){
        quantity = 10;
      }

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
          //console.log("skip:"+num);
          i--;
          continue;
        }
        tmp[num] = 0;

        let id = idList[num];

        keys.push({'branch_id': id});
      }

      let result = await db.batchGet(params);
      let dataArray = result.Responses[B2C_TABLE_NAME];
      dataArray = dataArray.map(branchData => {
        //translate
        let i18n = new I18n.main(branchData, this.idArray);
        branchData = i18n.translate(this.lang);

        return this.outputBrief(branchData, branchData.id);
      });

      dataArray = filter.sortByFilter(this.reqData.queryString, dataArray);
      dataArray = filter.pageOffset(this.reqData.queryString, dataArray);

      //if empty
      if(dataArray.length == 0){
        //let err = new Error("not found");
        //err.statusCode = 404;
        //throw err;
        return "";
      }

      return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);       
    }catch(err) {
      console.log("==branch get err!!==");
      console.log(err);
      throw err;
    }
  }

  async getItemsByID(ids) {
    try {
      let body = {
        size: 9999,
        from: 0,
        "query": {
          "terms" : {
            "item_id" : ids
          }
        },
        sort: [
          { "item_id": "desc" },
          "_score"
        ]
      };
      
      let response = await es.simpleSearch('items', body);
      let itemObj = {};
      response.hits.hits.forEach(hit => {
        let item = hit._source;
        //console.log(item);
        
        //i18n and photos
        if(typeof item.i18n === 'string') {
          try {
            item.i18n = JSON.parse(item.i18n);
          }
          catch(err) {
            //do nothing
          }
        }
        if(typeof item.photos === 'string') {
          try {
            item.photos = JSON.parse(item.photos);
          }
          catch(err) {
            item.photos = {}
          }
        }
        
        if(itemObj[item.item_id] === undefined) {
          itemObj[item.item_id] = item;
        } else {
          //console.log('select lang...:' + item.item_id);
          if(item.language.toLowerCase() === this.lang.toLowerCase()) {
            //console.log(`${itemObj[item.item_id].language} ==> ${item.language}`);
            itemObj[item.item_id] = item;
          }
        }
      });
      
      //obj to Array
      let itemArray = [];
      for(let id in itemObj) {
        itemArray.push(itemObj[id]);
      }
      return itemArray;
    }
    catch(err) {
      console.error(err);
    }
  }
  
  
  
  async getItems() {
    try {
      let quantity = parseInt(this.reqData.queryString.quantity, 10);
      if((isNaN(quantity))||(quantity < 0)||(quantity > 100)){
        quantity = 10;
      }
      let page = parseInt(this.reqData.queryString.page, 10);
      if((isNaN(page))||(page < 0)){
        page = 0;
      }
      let from = page * quantity;
      let session = this.reqData.queryString.session ? this.reqData.queryString.session : Date.now();

      let body = {
        size: quantity,
        from: from,
        query: {
          "function_score": {
             "functions": [
                {
                  "random_score": {
                    "seed": session
                  }
                }
             ]
          }
        }
      };
  
      let response = await es.simpleSearch('menuitem_new', body);
      let itemMenu = {};
      let ids = response.hits.hits.map(hit => {
        let item_id = hit._source.item_id;
        
        //menu
        let m_index = Math.floor(Math.random() * hit._source.menu.length);
        let menu = hit._source.menu[m_index];
        
        //branch
        let b_index = Math.floor(Math.random() * menu.branches.length);
        let branch_id = menu.branches[b_index];
        
        let idArray = Utils.parseID(menu.menu_id);
        let idArray_item = Utils.parseID(item_id);
        let idArray_branch = Utils.parseID(branch_id);
        //merge
        idArray.i = idArray_item.i;
        idArray.s = idArray_branch.s;
        
        itemMenu[item_id] = {
          menu_id: menu.menu_id,
          idArray: idArray
        }
        return item_id;
      });

      let targetItems = await this.getItemsByID(ids);
  
      let dataArray = targetItems.map(itemData => {
        let idAdday = itemMenu[itemData.item_id].idArray;
        itemData.uri = '/'+Utils.makePath(idAdday);
        
        return this.outputItemBrief(itemData, itemData.id);
      });

      //if empty
      if(dataArray.length == 0){
        return "";
      }
      return JSONAPI.makeJSONAPI(TYPE_NAME, dataArray);    
    }
    catch(err) {
      console.error(err);
    }
  }

  async getMenuItems() {
    let itemsOp = new Items.main(this.reqData);
    
    try{
      let dataArray = await itemsOp.get();

      let quantity = parseInt(this.reqData.queryString.quantity, 10);
      if((isNaN(quantity))||(quantity < 0)||(quantity > 100)){
        quantity = 10;
      }

      let tmp = {};
      let resultArray = [];
      
      if(dataArray.length > quantity){
        for(let i = 0; i < quantity; i++){
          let num = Math.floor(Math.random() * dataArray.length);
          //check existed
          if(tmp[num] !== undefined){
            //console.log("skip:"+num);
            i--;
            continue;
          }
          tmp[num] = 0;
  
          resultArray.push(dataArray[num]);
        }
      }
      else {
        resultArray = dataArray;
      }
      return resultArray;
    }
    catch(err){
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

  let recommend = new Recommend(reqData);
  let result = await recommend.getBranchIDList();
  console.log(result);
  console.log("time used: "+ (Date.now() - start_time));
}


exports.main = Recommend;
exports.unittest = unittest;
