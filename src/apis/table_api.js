let Tables = require('../table.js');
let API_VERSION = '/v1';

function go(api){

//=========== table =========
api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/tables', async (req) => {
  let cmdObj = new Tables.main(req);

  try{
      return await cmdObj.get();
  }
  catch(err){
      throw err;
  }
});

api.get(API_VERSION+'/restaurants/{restaurant_id}/branches/{branch_id}/tables/{table_id}', async (req) => {
  let cmdObj = new Tables.main(req);

  try{
      return await cmdObj.getByID();
  }
  catch(err){
      throw err;
  }
});
  
}
  
exports.go = go;