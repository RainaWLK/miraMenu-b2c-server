const redis = require('./redis.js');
let moment = require('moment');



async function main() {
  let client = await redis.initRedis();

  let dateStr = `view:${moment().subtract(0, 'days').format("YYYY/MM/DD")}`;
  let dateStr2 = `view:${moment().subtract(1, 'days').format("YYYY/MM/DD")}`;

  console.log(dateStr);
  let dateArray = [];
  dateArray.push(dateStr);
  dateArray.push(dateStr2);
  let result = await client.zunionstore(['view:last_week', dateArray.length].concat(dateArray));
  console.log(result);

  result = await client.zrevrange('view:last_week', 0, 10,'withscores');
  console.log(result);
}

//console.log(moment().subtract(30, 'days').format("YYYY-MM-DD"))

main();