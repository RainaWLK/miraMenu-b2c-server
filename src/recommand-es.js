const _ = require('lodash');
const es = require('./elasticsearch.js');
const elasticsearch = require('elasticsearch');
const esClient = new elasticsearch.Client({
  //aws elasticsearch
  //hosts: [ 'https://vpc-miramenu-mbynmdnepcr7oxinykkzoi6qdy.us-west-2.es.amazonaws.com']
  //ECS ALB
  hosts: [ 'http://internal-es-alb-1720960170.us-west-2.elb.amazonaws.com:9200' ]
  //Local
  //hosts: [ 'http://ip-172-31-11-6.us-west-2.compute.internal:9200' ]
});
let Utils = require('./utils.js');



async function getItemsByID(ids) {
  try {
    let body = {
      size: 9999,
      from: 0,
      "query": {
        "terms" : {
          "item_id" : ids
        }
      },
      sort: [
        { "item_id": "desc" },
        "_score"
      ]
    };
    let response = await esClient.search({index: 'items', body: body});

    return response.hits.hits.map(hit => {
      let item = hit._source;
      
      //i18n and photos
      item.i18n = JSON.parse(item.i18n);
      item.photos = JSON.parse(item.photos);
      return item;
    });
  }
  catch(err) {
    console.error(err);
  }
}



async function getItems() {
  try {
    let body = {
      size: 6,
      from: 0,
      query: {
        "function_score": {
           "functions": [
              {
                "random_score": {
                  "seed": 123456
                }
              }
           ]
        }
      }
    };

    let response = await esClient.search({index: 'menuitem', body: body});
    let itemMenu = {};
    response.hits.hits.forEach(hit => {
      let idAdday = Utils.parseID(hit._source.menu_id);
      let idAdday_item = Utils.parseID(hit._source.item_id);
      //merge
      idAdday.i = idAdday_item.i;
      itemMenu[hit._source.item_id] = {
        menu_id: hit._source.menu_id,
        idArray: idAdday
      }
    });
    
    let ids = [];
    for(let item_id in itemMenu) {
      ids.push(item_id);
    }
    console.log(ids);

    let targetItems = await getItemsByID(ids);

    targetItems = targetItems.map(item => {
      let idAdday = itemMenu[item.item_id].idArray;
      item.uri = '/'+Utils.makePath(idAdday);
      return item;
    });
    //console.log(targetItems);
  }
  catch(err) {
    console.error(err);
  }
}

getItems();
/*
{
  "query": {
    "function_score": {
      "filter": {
        "geo_distance": {
          "distance": "5km",
          "location": {
            "lat": $lat,
            "lon": $lng
          }
        }
      },
      "functions": [
        {
          "filter": {
            "term": {
              "features": "wifi"
            }
          },
          "weight": 1
        },
        {
          "filter": {
            "term": {
              "features": "停车位"
            }
          },
          "weight": 2
        },
        {
            "field_value_factor": {
               "field": "score",
               "factor": 1.2
             }
        },
        {
          "random_score": {
            "seed": "$id"
          }
        }
      ],
      "score_mode": "sum",
      "boost_mode": "multiply"
    }
  }
}
*/