let Menus = require('../menu.js');
let API_VERSION = '/v1';

function go(api){

//=========== Menu =========
api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.get();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});

//=============

api.get(API_VERSION+'/restaurants/{restaurant_id}/menus/{menu_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/menus/{menu_id}/photos', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

//=============

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}/photos', async (req) => {
  let cmdObj = new Menus.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});
  
}
  
exports.go = go;