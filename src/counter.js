const redis = require('./redis.js');
const _ = require('lodash');

async function incr(id) {
  let counterId = id + '_counter';
  let client;
  let d = new Date();
  let dd = ('0'+ d.getDate()).substr(-2);
  let mon= ('0'+d.getMonth()+1).substr(-2);
  let dateStr = `view:${d.getFullYear()}/${mon}/${dd}`;

  try {
    client = await redis.initRedis();
    //sorted set by day
    await client.zincrby(dateStr, 1, id);
    console.log('zincrby done');
    //total counter by item
    result = await client.incr(counterId);
    return result;
  }
  catch(err) {
    console.error(err);
    return;
  }
}

async function getCounter(id) {
  let counterId = id + '_counter';

  try {
    let client = await redis.initRedis();
    result = await client.get(counterId);
    return result;
  }
  catch(err) {
    console.error(err);
    return 0;
  }
}

async function getRankList(from, size) {
  //today
  try {
    console.log('getRankList');
    let client = await redis.initRedis();

    let d = new Date();
    let dd = ('0'+ d.getDate()).substr(-2);
    let mon= ('0'+d.getMonth()+1).substr(-2);
    let dateStr = `view:${d.getFullYear()}/${mon}/${dd}`;
  
    result = await client.zrevrange(dateStr, from, size,'withscores');

    list = _.chunk(result, 2);
    console.log(list);

    return list;
  }
  catch(err) {
    console.error(err);
    return 0;
  }
}

exports.incr = incr;
exports.get = getCounter;

exports.getRankList = getRankList;