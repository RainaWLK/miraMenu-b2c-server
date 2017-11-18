let Branches = require('../branch.js');

function go(api){

//=========== branch =========
api.get('/restaurants/{restaurant_id}/branches', async (req) => {
  let cmdObj = new Branches.main(req);

  try{
    return await cmdObj.get();
  }
  catch(err){
    throw err;
  }
});

api.get('/restaurants/{restaurant_id}/branches/{branch_id}', async (req) => {
  let cmdObj = new Branches.main(req);

  try{
    return await cmdObj.getByID();
  }
  catch(err){
    throw err;
  }
});

api.get('/branches', async (req) => {
  let cmdObj = new Branches.main(req);

  try{
    return await cmdObj.searchBranches();
  }
  catch(err){
    throw err;
  }
});

//========
api.get('/restaurants/{restaurant_id}/branches/{branch_id}/photos/{photo_id}', async (req) => {
  let cmdObj = new Branches.main(req);

  try{
      return await cmdObj.getPhotoInfoByID();
  }
  catch(err){
      throw err;
  }
});

api.get('/restaurants/{restaurant_id}/branches/{branch_id}/photos', async (req) => {
  let cmdObj = new Branches.main(req);

  try{
      return await cmdObj.getPhotoInfo(req.body);
  }
  catch(err){
      throw err;
  }
});

  
}
  
exports.go = go;