let Recommend = require('../recommend.js');
let API_VERSION = '/v1';

function go(api){
  api.get(API_VERSION+'/recommend/branches', async (req) => {
    let cmdObj = new Recommend.main(req);
  
    try{
      return await cmdObj.getBranches();
    }
    catch(err){
      throw err;
    }
  });

  api.get(API_VERSION+'/recommend/items', async (req) => {
    let cmdObj = new Recommend.main(req);
  
    try{
      return await cmdObj.getItems();
    }
    catch(err){
      throw err;
    }
  });

  api.get(API_VERSION+'/recommend/restaurants/{restaurant_id}/branches/{branch_id}/items', async (req) => {
    let cmdObj = new Recommend.main(req);
  
    try{
      return await cmdObj.getMenuItems();
    }
    catch(err){
      throw err;
    }
  });

}

exports.go = go;