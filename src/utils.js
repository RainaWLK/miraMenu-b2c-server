let _ = require('lodash');

function parseID(input){
  let result = {};
  if(_.isEmpty(input)){
    return result;
  }
  let typeArray = input.match(/res|[rstmip]/g);
  //res must be the last type
  let resIndex = typeArray.indexOf('res');
  if(resIndex > 0){
    typeArray.length = resIndex+1;
  }

  let tail = input.length;
  for(let i = 0; i < typeArray.length; i++){
    let type = typeArray[i];
    let start = input.indexOf(type)+type.length;

    let end = tail;
    if(i < typeArray.length-1){
      end = input.indexOf(typeArray[i+1]);
    }

    let id = input.substring(start, end);

    result[type] = id;
  }
  return result;
}

function makeFullID(idArray){

  let id = "";
  if(typeof idArray.r != 'undefined'){
    id += `r${idArray.r}`;
  }
  if(typeof idArray.s != 'undefined'){
    id += `s${idArray.s}`;
  }
  if(typeof idArray.t != 'undefined'){
    id += `t${idArray.t}`;
  }
  if(typeof idArray.m != 'undefined'){
    id += `m${idArray.m}`;
  }  
  if(typeof idArray.i != 'undefined'){
    id += `i${idArray.i}`;
  }
  if(typeof idArray.p != 'undefined'){
    id += `p${idArray.p}`;
  }
  if(typeof idArray.res != 'undefined'){
    id += `res${idArray.res}`;
  }
  console.log(`makeFullID=${id}`);
  return id;
}

function makePath(idArray){

  let path = "";
  if(typeof idArray.r != 'undefined'){
    path += `/restaurants/r${idArray.r}`;
  }
  if(typeof idArray.s != 'undefined'){
    path += `/branches/s${idArray.s}`;
  }
  if(typeof idArray.t != 'undefined'){
    path += `/tables/t${idArray.t}`;
  }
  if(typeof idArray.m != 'undefined'){
    path += `/menus/m${idArray.m}`;
  }  
  if(typeof idArray.i != 'undefined'){
    path += `/items/i${idArray.i}`;
  }
  if(typeof idArray.p != 'undefined'){
    path += `/photos/p${idArray.p}`;
  }
  if(typeof idArray.res != 'undefined'){
    path += `/resources/res${idArray.res}`;
  }
  path = path.slice(1);
  return path;
}

function objToArray(obj){
    let resultArray = [];
    for(let id in obj){
      let element = obj[id];
      element.id = id;
      resultArray.push(element);
    }
    return resultArray;
}

function getURI(URI, idArray){
  let path = URI;
  if(typeof idArray.r != 'undefined'){
    path = path.replace('{restaurant_id}', `r${idArray.r}`);
  }
  if(typeof idArray.s != 'undefined'){
    path = path.replace('{branch_id}', `s${idArray.s}`);
  }
  if(typeof idArray.t != 'undefined'){
    path = path.replace('{table_id}', `t${idArray.t}`);
  }
  if(typeof idArray.m != 'undefined'){
    path = path.replace('{menu_id}', `m${idArray.m}`);
  }  
  if(typeof idArray.i != 'undefined'){
    path = path.replace('{item_id}', `i${idArray.i}`);
  }
  if(typeof idArray.p != 'undefined'){
    path = path.replace('{photo_id}', `p${idArray.p}`);
  }
  if(typeof idArray.res != 'undefined'){
    path = path.replace('{resource_id}', `res${idArray.res}`);
    path = path.replace('{i18n_id}', `res${idArray.res}`);
  }
  console.log("====getURI====");
  console.log(path);
  return path;
}

function unittest(){
  let runTest = (testCase) => {
    console.log("=============================");
    console.log(testCase);
    console.log("=============================");
    let idArray = parseID(testCase);
    console.log(idArray);
    let fullID = makeFullID(idArray);
    console.log(fullID);
    let path = makePath(idArray);
    console.log(path);   
  }

  runTest();
  runTest({});
  runTest([]);
  runTest(0);
  runTest(1);
  runTest('');
  runTest('r201700700');
  runTest('r201700700s1');
  runTest('r201700700i001');
  runTest('r201700700s1i001');
  runTest('r201700700s1i001res-file-1505637455303');
  runTest('r201700700s1res-file-1505637455303');
  runTest('r201700700res-file-1505637455303');
  runTest('{restaurant_id}{branch_id}{item_id}'); //bug
}

exports.parseID = parseID;
exports.makePath = makePath;
exports.makeFullID = makeFullID;
exports.objToArray = objToArray;
exports.getURI = getURI;

exports.unittest = unittest;