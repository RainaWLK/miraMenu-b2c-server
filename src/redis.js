const redis = require("async-redis");
let conn = {
  ready: false
};

// if you'd like to select database 3, instead of 0 (default), call 
// client.select(3, function() { /* ... */ }); 



function initRedis(){
  return new Promise((resolve, reject) => {
    if(conn.ready){
      resolve(conn);
      return;
    }
    conn = redis.createClient({
      //host: 'dbcache.osilv8.0001.usw2.cache.amazonaws.com',
      host: 'redis-nlb-2f8d80dd530ed344.elb.us-west-2.amazonaws.com',
      port: '6379'
    });
    
    conn.on("error", function (err) {
      console.log("Redis Error " + err);
      conn.ready = false;
      reject(err);
    });
    conn.on("connect", () => {
      console.log("Redis connected");
    });
    conn.on("ready", () => {
      console.log("Redis ready");
      resolve(conn);
    });    
  });

}

//client.set("string key", "string val", redis.print);
//client.hset("hash key", "hashtest 1", "some value", redis.print);
//client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
//client.hkeys("hash key", function (err, replies) {
//  console.log(replies.length + " replies:");
//  replies.forEach(function (reply, i) {
//      console.log("    " + i + ": " + reply);
//  });
//  client.quit();
//});
async function redisGet(key) {
  client = await initRedis();
  try {
    result = await client.get(key);
    return JSON.parse(reply);
  }
  catch(err) {
    throw err;
  }
}

async function redisSet(key, str) {
  client = await initRedis();
  try {
    result = await client.set(key, JSON.stringify(str));
    return result;
  }
  catch(err) {
    throw err;
  }

}

async function hmset(key, obj){
  client = await initRedis();
  try {
    result = await client.hmset(key, obj);
    return result;
  }
  catch(err) {
    throw err;
  }

}

async function hgetall(key){
  client = await initRedis();
  try {
    result = await client.hgetall(key);
    return result;
  }
  catch(err) {
    throw err;
  }
}

exports.get = redisGet;
exports.set = redisSet;
exports.hmset = hmset;
exports.hgetall = hgetall;
exports.initRedis = initRedis;
