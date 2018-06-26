'use strict';
//import 'babel-polyfill'
//require('./logger.js');
let Rest = require('./rest.js');
let Restaurant_API = require('./apis/restaurant_api');
let Branch_API = require('./apis/branch_api');
//let Table_API = require('./apis/table_api');
let Menu_API = require('./apis/menu_api');
let Item_API = require('./apis/item_api');
let Recommend_API = require('./apis/recommend_api');

let api = new Rest.main();

Restaurant_API.go(api);
Branch_API.go(api);
//Table_API.go(api);
Menu_API.go(api);
Item_API.go(api);
Recommend_API.go(api);

let Restaurant_API_old = require('./apis/restaurant_api_old.js');
let Branch_API_old = require('./apis/branch_api_old.js');
//let Table_API_old = require('./apis/table_api_old.js');
let Menu_API_old = require('./apis/menu_api_old.js');
let Item_API_old = require('./apis/item_api_old.js');
let Recommend_API_old = require('./apis/recommend_api_old.js');
Restaurant_API_old.go(api);
Branch_API_old.go(api);
//Table_API_old.go(api);
Menu_API_old.go(api);
Item_API_old.go(api);
Recommend_API_old.go(api);

//for unittest
//let utils = require('./utils');
//utils.unittest();
//let recommend = require('./recommend');
//recommend.unittest();

//let Recommend = require('./recommend.js');
//Recommend.genRecommendItems();

let es = require('./elasticsearch.js');

module.exports = api.app;
