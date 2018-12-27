const redis = require('./redis.js');

async function incr(id) {
  let counterId = id + '_counter';
  let client;

  try {
    client = await redis.initRedis();
  }
  catch(err) {
    console.error(err);
    return;
  }
  return new Promise((resolve, reject) => {
    client.incr(counterId, (err, reply) => {
      if(err) {
        console.error(err);
        resolve(0);
      }
      resolve(reply);
    });
  });
}

async function getCounter(id) {
  let counterId = id + '_counter';

  try {
    let client = await redis.initRedis();
    return new Promise((resolve, reject) => {
      client.get(counterId, (err, reply) => {
        resolve(reply);
      });
    })
  }
  catch(err) {
    console.error(err);
    return 0;
  }
}

exports.incr = incr;
exports.get = getCounter;

