const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  //aws elasticsearch
  //hosts: [ 'https://vpc-miramenu-mbynmdnepcr7oxinykkzoi6qdy.us-west-2.es.amazonaws.com']
  //ECS ALB
  hosts: [ 'http://internal-es-alb-1720960170.us-west-2.elb.amazonaws.com:9200' ]
  //Local
  //hosts: [ 'http://ip-172-31-11-6.us-west-2.compute.internal:9200' ]
});

function sleep(wait = 0) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, wait);
  })
};

async function connect() {
  let retry = 5;
  
  while(retry > 0) {
    console.log('retry:' + retry);
    try {
      await checkConnection();
      return;
    }
    catch(err) {
      retry--;
      await sleep(10000);
    }
  }
  return;
}

function checkConnection() {
  let start_time = Date.now();
  
  console.log("check connection...");
  return new Promise((resolve, reject) => {
    esClient.cluster.health({
      waitForStatus: 'yellow'
    }, (err) => {
      if(err) {
        console.error('elasticsearch cluster is down!');
        reject(err);
        return;
      }
      
      console.log(`elasticsearch ready: ${Date.now() - start_time} ms`);
      resolve();
    });
  });

}

async function initIndex(index, type, schema) {
  try {
    await connect();
    console.log("====check existed====");
    let index_existed = await esClient.indices.exists({
      index: index
    });

    if(index_existed) {
      console.log("====purge====");
      let result1 = await esClient.indices.delete({
        index: index
      });
      console.log(result1);
      console.log("====purge done====");
    }

    console.log("====create====");
    let result2 = await esClient.indices.create({
      index: index
    });
    //console.log(result2);
    console.log("====create done====");
    
    console.log("====put mapping====");
    let result = await esClient.indices.putMapping({
      index : index,
      type : type,
      body: schema
    });
    console.log('==== putMapping done ====');
    //console.log(result);

    return;
  }
  catch(err) {
    console.error('elasticsearch error');
    console.error(err);
    throw err;
  }
}

async function bulkIndex(index, type, dataArray) {
  let bulkBody = [];

  dataArray.forEach(data => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: data.id
      }
    });

    bulkBody.push(data);
  });

  try {
    await checkConnection();
    let response = await esClient.bulk({body: bulkBody});
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log('bulkIndex error-->');
        console.log(++errorCount, item.index.error);
        console.log(item);
      }
    });
    console.log(
      `Successfully indexed ${dataArray.length - errorCount}
       out of ${dataArray.length} items`
    );
    
    await indices();
    return;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
};

async function updateIndex(index, type, data) {
  let bulkBody = [];
  console.log('es updateIndex');
  
  const insertBulk = (element) => {
    bulkBody.push({
      index: {
        _index: index,
        _type: type,
        _id: element.id
      }
    });
  
    bulkBody.push(element);
  };
  
  if(Array.isArray(data)) {
    data.forEach(element => insertBulk(element));    
  }
  else {
    insertBulk(data);
  }
  //console.log('bulkBody=');
  //console.log(bulkBody);
  
  try {
    await checkConnection();
    console.log("------- ES bulk -----------");
    let response = await esClient.bulk({body: bulkBody});
    
    let errorCount = 0;
    response.items.forEach(item => {
      if (item.index && item.index.error) {
        console.log('updateIndex error');
        console.log(++errorCount, item.index.error);
        console.log(item);
      }
    });
    console.log("------- ES bulk done -----------");
    console.log(
      `Successfully update ${data.length - errorCount}
       out of ${data.length} items`
    );
    
    await indices();
    return;
  }
  catch(err) {
    console.error(err);
    throw err;
  }
}

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
  await createIndex('branches', []);
  await indices();
  
  return esClient.indices.getMapping({
    index: INDEX,
    type: 'branches'
  }).then(results => {
    console.log(results[INDEX].mappings['branches']);
  });
  
  
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

  /*return esClient.search({index: 'library', body: body})
  .then(results => {
    console.log(`found ${results.hits.total} items in ${results.took}ms`);
    console.log(`returned article titles:`);
    results.hits.hits.forEach(
      (hit, index) => console.log(
        `\t${body.from + ++index} - ${hit._source.id}`
      )
    )
  })
  .catch(err => {
    console.log('err');
    console.error(err);
  });*/
}


exports.initIndex = initIndex;
exports.updateIndex = updateIndex;
exports.test = test;
exports.search = search;


/*
client.indices.putMapping({
    index : 'test',
    type : 'branches',
    body : {
        branches: {
            properties: {
                title: {
                    type: 'string',
                    term_vector: 'with_positions_offsets',
                    analyzer: 'ik_syno',
                    search_analyzer: 'ik_syno',
                },
                content: {
                    type: 'string',
                    term_vector: 'with_positions_offsets',
                    analyzer: 'ik_syno',
                    search_analyzer: 'ik_syno',
                },
                slug: {
                    type: 'string',
                },
                tags: {
                    type: 'string',
                    index : 'not_analyzed',
                },
                update_date: {
                    type : 'date',
                    index : 'not_analyzed',
                }
            }
        }
    }
});

*/