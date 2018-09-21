let Items = require('../item.js');
let API_VERSION = '/v1';

function go(api){

//=========== Items =========
api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}/items/{item_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}/items', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getMenuItems();
  }
  catch(err){
      throw err;
  }
});

//=========== User comment ========
let postComment = async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.postComment(req.body);
  }
  catch(err){
      throw err;
  }
}
api.post(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/menus/{menu_id}/items/{item_id}/comment', postComment);

//=========== Photos =========
api.get(API_VERSION+'/restaurants/{restaurant_id}/items/{item_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/items/{item_id}/photos', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

//=============

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/items/{item_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/items/{item_id}/photos', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

}

exports.go = go;