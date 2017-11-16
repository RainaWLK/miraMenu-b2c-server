let Items = require('../item.js');

function go(api){

//=========== Items =========
api.get('/restaurants/{restaurant_id}/branches/{branch_id}/items', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.get();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/branches/{branch_id}/items/{item_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/items', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.get();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/items/{item_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});

//=========== Photos =========
api.get('/restaurants/{restaurant_id}/items/{item_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/items/{item_id}/photos', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

//=============

api.get('/restaurants/{restaurant_id}/branches/{branch_id}/items/{item_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Items.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/branches/{branch_id}/items/{item_id}/photos', async (req) => {
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