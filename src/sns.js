let AWS = require('aws-sdk');
var sns = new AWS.SNS({
  apiVersion: '2010-03-31',
  region: 'us-west-2'
});

const topicArn = 'arn:aws:sns:us-west-2:780139254791:DBUpdate';

async function sendSNS(msg, attr, subject){
  var params = {
    Message: JSON.stringify(msg),
    MessageAttributes: {},
    //MessageStructure: 'STRING_VALUE',
    //PhoneNumber: 'STRING_VALUE',
    Subject: subject,
    //TargetArn: 'STRING_VALUE',
    TopicArn: topicArn
  };

  let messageAttrs = {};
  for(let i in attr){
    if(typeof attr[i] === 'string'){
      messageAttrs[i] = {
        DataType: 'String',
        StringValue: attr[i]
      };
    }
  }
  params.MessageAttributes = messageAttrs;
  console.log(`====send SNS:${topicArn}====`);
  console.log(params);

  try{
    let result = await sns.publish(params).promise();
    console.log(result);
    return result;
  }
  catch(err){
    console.log(err, err.stack);
    throw err;
  }
}

exports.sendSNS = sendSNS;