const { RTMClient, WebClient } = require('@slack/client');
const teamId = 'sjs-2018';
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
let axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');

let app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const rtm = new RTMClient(token);
rtm.start();

rtm.on('message', event=> {
  const user = event.user;
  let message = event.text;
  let channel = event.channel;
  console.log(message, channel, user);
  const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
  const sessionId = 'quickstart-session-id';
  const sessionClient = new dialogflow.SessionsClient();
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'en-US',
      },
    },
  };

  if (user !== "UBV5QQP6G"){
    sessionClient
      .detectIntent(request)
      .then(responses => {
        console.log('Detected intent');
        const result = responses[0].queryResult;
        console.log(`  Query: ${result.queryText}`);
        console.log(`  Response: ${result.fulfillmentText}`);
        // console.log(result.parameters);
        // rtm.sendMessage(result.fulfillmentText , channel)
        // console.log(result);
        if (result.intent) {
          console.log(`  Intent: ${result.intent.displayName}`);
        } else {
          console.log(`  No intent matched.`);
        }
      })
    .then(msg =>
      console.log('message sent')
    ).catch(err=> console.log("error", err));
  }
})

app.post('/webhook', function(req, res){
  if (req.body.queryResult.allRequiredParamsPresent){
    res.json(req.body);
  }
  // res.send(req.body.data.challenge);
})

app.get('/', (req,res)=>{
  res.send('here');
})

app.listen(8888);
