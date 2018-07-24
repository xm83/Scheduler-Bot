const { RTMClient, WebClient } = require('@slack/client');
const teamId = 'sjs-2018';
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
let axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');

let app = express();
// models
const User = require('./models').User;

const scheduleBotChannel = 'DBWNA5TCN';

// google api setup
const {google} = require('googleapis');

const scopes = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/calendar'
];

// new client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.DOMAIN + '/google/callback'
);


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
  
// GET route that redirects to google oatuh2 url
app.get('/google/calendar', function(req, res) {
    var auth_id = req.query.auth_id;
    // create a new user in database based on auth_id
    var newUser = new User({auth_id});
    newUser.save()
    .then(() => ( 
      // generate a url that asks permissions for Google+ and Google Calendar scopes
      var url = oauth2Client.generateAuthUrl({
        // 'online' (default) or 'offline' (gets refresh_token)
        access_type: 'online',
        // refresh_token only returned on the first authorization

        scope: scopes,
        state: encodeURIComponent(JSON.stringify({
          auth_id: auth_id
        })),
        prompt: 'consent'
      });

      res.redirect(url);
    ))
    .catch((err) => {
      res.send("error", err);
    })

    

})

// GET route that handles oauth callback for google api
app.get('/google/callback', function(req, res) {
    var code = req.query.code;
    // This will provide an object with the access_token and refresh_token
    oauth2Client.getToken(code, (err, tokens) => {
      oauth2Client.setCredentials(tokens);

      // look for user based on auth_id and store token in database
      var auth_id = JSON.parse(decodeURIComponent(req,query.state))
      User.findOne({auth_id})
      .exec()
      .then((user) => {
        // store token
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date
      })
      .catch((err) => {
        res.send("error", err);
      })

  })

})


const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})

calendar.events.list({
  calendarId: 'primary',
  timeMin:(new Date()).toISOString(),
  maxResults: 10,
  singleEvents: true,
  orderBy: 'startTime'
}, (err, resp) => {
  console.log(resp);
})

calendar.event.insert({
  calendarId: 'primary',
  summary: 'eat fish',
  start: {
    date: new Date(Date.now() + 30000) // 30 seconds from now
  },
  end: {
    date: new Date(Date.now() + 90000)
  }
}, (err, resp) => {
  console.log(resp);
})

app.listen(1337);
