const redis = require("redis");
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
      host: 'dbcache.osilv8.0001.usw2.cache.amazonaws.com',
      port: '6379'
    });
    
    conn.on("error", function (err) {
      console.log("Redis Error " + err);
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
function redisGet(key) {
  return new Promise((resolve, reject) => {
    initRedis().then(client => {
      client.get(key, (err, reply) => {
        if(err) {
          console.log(err);
          reject(err);
        }
        else {
          //console.log(reply);
          resolve(JSON.parse(reply));
        }
      });
    }).catch(err => {
      reject(err);
    });
  }) 
}

function redisSet(key, str) {
  return new Promise((resolve, reject) => {
    initRedis().then(client => {
      client.set(key, JSON.stringify(str), (err, res) => {
        if(err) {
          console.log(err);
          reject(err);
        }
        else {
          //console.log(res);
          resolve(res);
        }
      });
    }).catch(err => {
      reject(err);
    });
  }) 
}

function hmset(key, obj){
  return new Promise((resolve, reject) => {
    initRedis().then(client => {
      client.hmset(key, obj, (err, res) => {
        if(err) {
          console.log(err);
          reject(err);
        }
        else {
          //console.log(res);
          resolve(res);
        }
      });
    }).catch(err => {
      reject(err);
    });
  })

}

function hgetall(key){
  return new Promise((resolve, reject) => {
    initRedis().then(client => {
      client.hgetall(key, (err, obj) => {
        if(err) {
          console.log(err);      
          reject(err);
        }
        else {
          //console.log(obj);
          resolve(obj);
        }
      });
    }).catch(err => {
      reject(err);
    });
  });
}

async function getRandomData(key){
  let cacheData = await hgetall(key);
  
  cacheData.expire = parseInt(cacheData.expire) - 1;
  if(cacheData.expire > 0){
    initRedis().then(client => {
      client.hmset(key, 'expire', cacheData.expire.toString());
    });
  }
  cacheData.data = JSON.parse(cacheData.data);
  
  return cacheData;
}

exports.get = redisGet;
exports.set = redisSet;
exports.hmset = hmset;
exports.hgetall = hgetall;

exports.getRandomData = getRandomData;