const { RTMClient, WebClient } = require('@slack/client');
const teamId = 'sjs-2018';
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
let axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');

const scheduleBotChannel = 'DBWNA5TCN';


let app = express();


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const rtm = new RTMClient(process.env.TOKEN);
rtm.start();

rtm.on('message', event=> {
  let message = event.text;
  let channel = event.channel;
  if (channel === scheduleBotChannel){
    let responseMessage = 'sample response from backend';
    rtm.sendMessage(responseMessage, scheduleBotChannel)
    .then(msg =>
      console.log('message sent:' + msg)
    ).catch(err=> console.log("error", err));
  }




})

app.post('/test', function(req, res){
  console.log('something');
  // res.setStatus(200);
  // res.setContentType('/text/plain');
  // res.getStreamWriter.writeString(req.body.data.challenge);
  // console.log(req);
  res.send(req.body.challenge);
  // res.send(req.body.data.challenge);
})

app.listen(8888);
