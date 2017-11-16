let Restaurant = require('../restaurant.js');

function go(api){

  
api.get('/restaurants/{restaurant_id}', async (req) => {
  let cmdObj = new Restaurant.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants', async (req) => {
  let cmdObj = new Restaurant.main(req);

  try{
      return await cmdObj.get();
  }
  catch(err){
      throw err;
  }
});

//========
api.get('/restaurants/{restaurant_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Restaurant.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});


api.get('/restaurants/{restaurant_id}/photos', async (req) => {
  let cmdObj = new Restaurant.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

}
  
exports.go = go;