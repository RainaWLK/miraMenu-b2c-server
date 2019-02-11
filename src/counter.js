const redis = require('./redis.js');
const _ = require('lodash');
const moment = require('moment');

async function incr(id) {
  let counterId = id + '_counter';
  let client;
  //let d = new Date();
  //let dd = ('0'+ d.getDate()).substr(-2);
  //let mon= ('0'+d.getMonth()+1).substr(-2);
  let dateStr = `view:${moment().format("YYYY/MM/DD")}`;

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

async function getRankList(from, size, period) {
  //today
  try {
    console.log('getRankList');
    let client = await redis.initRedis();

    let dateArray = [];
    for(let i = 0; i < period; i++) {
      dateArray.push(`view:${moment().subtract(i, 'days').format("YYYY/MM/DD")}`);
    }
    console.log(dateArray);
    await client.zunionstore(['view:last_week', dateArray.length].concat(dateArray)); 

    let result = await client.zrevrange('view:last_week', from, size,'withscores');

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