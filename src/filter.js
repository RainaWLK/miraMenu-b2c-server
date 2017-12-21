
function sortByFilter(queryString, dataArray){
  let page = 0;
  let limit = 0;
  let start = 0;
  let end = null;

  if(typeof queryString.sort === 'string'){
    let sortFunc = null;
    if(queryString.sort === 'rate'){
      sortFunc = (a, b) => {
        let idA = parseInt(a.id.substring(a.id.length-5), 10);
        let idB = parseInt(b.id.substring(b.id.length-5), 10);
        return idB - idA;
      }
    }
    else if(queryString.sort === 'popular') {
      sortFunc = (a, b) => {
        let idA = parseInt(a.id.substring(a.id.length-5), 10);
        let idB = parseInt(b.id.substring(b.id.length-5), 10);
        return idA - idB;
      }
    }
    else if(queryString.sort === 'cost') {
      sortFunc = (a, b) => {
        let idA = parseInt(a.id.substring(a.id.length-2), 10);
        let idB = parseInt(b.id.substring(b.id.length-2), 10);
        return idA - idB;
      }
    }
  
    dataArray = dataArray.sort(sortFunc);
  }

  return dataArray;
}

function pageOffset(queryString, dataArray){
  let page = 0;
  let limit = 0;
  let start = 0;
  let end = null;
  if(typeof queryString.page == 'string'){
    page = parseInt(queryString.page);
  }      
  if(typeof queryString.limit == 'string'){
    limit = parseInt(queryString.limit);
  }
  if(page >= 0 && limit > 0){
    //params.Limit = limit;
    start = page*limit;
    end = (page+1)*limit;
  }

  //page offset
  if((start >= 0) && (end > 0)){
    dataArray = dataArray.slice(start, end);
  }
  
  return dataArray;
}

exports.sortByFilter = sortByFilter;
exports.pageOffset = pageOffset;