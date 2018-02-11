const redis = require("redis");
const client = redis.createClient({
  host: 'dbcache.osilv8.0001.usw2.cache.amazonaws.com',
  port: '6379'
});

// if you'd like to select database 3, instead of 0 (default), call 
// client.select(3, function() { /* ... */ }); 

client.on("error", function (err) {
  console.log("Redis Error " + err);
});
client.on("ready", function (err) {
  console.log("Redis ready " + err);
});
client.on("connect", function (err) {
  console.log("Redis connect " + err);
});

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


function hmset(key, obj){
  return new Promise((resolve, reject) => {
    client.hmset(key, obj, (err, res) => {
      if(err) {
        console.log(err);
        reject(err);
      }
      else {
        console.log(res);
        resolve(res);
      }
    });
  })

}

function hgetall(key){
  return new Promise((resolve, reject) => {
    console.log('redis get all');
    client.hgetall(key, (err, obj) => {
      if(err) {
        console.log(err);
        reject(err);
      }
      else {
        console.log(obj);
        resolve(obj);
      }
    });
  });
}

exports.hmset = hmset;
exports.hgetall = hgetall;
