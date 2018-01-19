let Recommend = require('../recommend.js');

function go(api){
  api.get('/recommend/branches', async (req) => {
    let cmdObj = new Recommend.main(req);
  
    try{
      return await cmdObj.getBranches();
    }
    catch(err){
      throw err;
    }
  });



  api.get('/recommend/restaurants/{restaurant_id}/branches/{branch_id}/items', async (req) => {
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