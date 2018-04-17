const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  hosts: [ 'http://ip-172-31-11-6.us-west-2.compute.internal:9200']
});
let connected = false;

function checkConnection() {
  return new Promise((resolve, reject) => {
    if(connected){
      resolve();
    }
    else {
      esClient.ping({
        requestTimeout: 30000,
      }, (error) => {
        if (error) {
           console.error('elasticsearch cluster is down!');
           reject();
        } else {
           console.log('Everything is ok');
           resolve();
        }
      });
    }
  });

}



async function bulkIndex(index, type, data) {
  let bulkBody = [];

  data.forEach(item => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: item.id
      }
    });

    bulkBody.push(item);
  });

  try {
    await checkConnection();
    let response = await esClient.bulk({body: bulkBody});
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log(++errorCount, item.index.error);
      }
    });
    console.log(
      `Successfully indexed ${data.length - errorCount}
       out of ${data.length} items`
    );
    return;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
};

function indices() {
  return esClient.cat.indices({v: true})
  .then(console.log)
  .catch(err => console.error(`Error connecting to the es client: ${err}`));
};

async function search(index, body) {
  try {
    await checkConnection();
    console.log(`keyword: ${body.query.multi_match.query}`);
    let response = await esClient.search({index: index, body: body});
    console.log(`found ${response.hits.total} items in ${response.took}ms`);
    console.log(`returned article titles:`);
    let result = response.hits.hits.filter((hit, index) => {
      console.log(`${body.from + ++index} ` + 
        `- ${hit._source.id} ` +
        `- ${hit._source.restaurant_name} : ${hit._source.branch_name} ` + 
        `- ${hit._score}`);
      return hit._score > 0;
    }).map(hit => {
        return {
          id: hit._source.id,
          score: hit._score
        }
    });
    
    //sort
    return result.sort((a,b) => {
      return a.score - b.score
    }).map(a => a.id);
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

async function test(){
  let INDEX = 'library';
  await indices();
  
  let body = {
    size: 20,
    from: 0,
    query: {
      multi_match: {
        query: 'deer',
        fields: ['restaurant_name', 'branch_name',  'category'],
        fuzziness: 2
      }
    }
  };

  return esClient.search({index: 'library', body: body})
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    console.log(`returned article titles:`);
    results.hits.hits.forEach(
      (hit, index) => {
        //console.log(`\t${body.from + ++index} - ${hit._source.id}`);
        console.log(hit);
      }
    )
  })
  .catch(err => {
    console.log('err');
    console.error(err);
  });
}

exports.test = test;
exports.search = search;