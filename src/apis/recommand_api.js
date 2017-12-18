let Recommand = require('../recommand.js');
let Statistic = require('../statistic.js');

function go(api){
  api.get('/recommand/branches', async (req) => {
    let cmdObj = new Recommand.main(req);
  
    try{
      return await cmdObj.getBranches();
    }
    catch(err){
      throw err;
    }
  });



  api.get('/recommand/branches/{branch_id}/items/', async (req) => {
    let cmdObj = new Recommand.main(req);
  
    try{
      return await cmdObj.getBranchItems();
    }
    catch(err){
      throw err;
    }
  });

  //popular, rate, cost
  api.get('/statistic/branches', async (req) => {
    let cmdObj = new Statistic.main(req);
  
    try{
      return await cmdObj.searchBranches();
    }
    catch(err){
      throw err;
    }
  });

  api.get('/statistic/branches/{branch_id}/items', async (req) => {
    let cmdObj = new Statistic.main(req);
  
    try{
      return await cmdObj.searchBranches();
    }
    catch(err){
      throw err;
    }
  });
/*
  api.get('/statistic/menus', async (req) => {
    let cmdObj = new Recommand.main(req);
  
    try{
      return await cmdObj.searchBranches();
    }
    catch(err){
      throw err;
    }
  });

  api.get('/statistic/items', async (req) => {
    let cmdObj = new Recommand.main(req);
  
    try{
      return await cmdObj.searchBranches();
    }
    catch(err){
      throw err;
    }
  });*/


}

exports.go = go;