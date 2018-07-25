const { RTMClient, WebClient } = require('@slack/client')
const teamId = 'sjs-2018'
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN
let axios = require('axios')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const dialogflow = require('dialogflow')

let app = express();
// models
const User = require('./models').User

const scheduleBotChannel = 'DBWNA5TCN'

// gCal api setup
const {google} = require('googleapis')
const {scopes, makeCalendarAPICall} = require('./cal')
// TODO: how to create a new unique google profile for every new user???
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
        languageCode: 'en-US'
      }
    }
  }

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
app.get('/google/calendar', function (req, res) {
  let slackId = req.query.slackId || 'myslackId'

  // save action into database?

  // check if user exists
  User.findOne({
    slackId: slackId
  })
    .exec()
    .then((user) => {
      if (!user) {
      // create a new user in database
        var newUser = new User({
          slackId: slackId
        })
        newUser.save()
          .then((user) => {
            // generate a url that asks permissions for Google+ and Google Calendar scopes
            var url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
              access_type: 'online',
              // refresh_token only returned on the first authorization
              scope: scopes,
              state: encodeURIComponent(JSON.stringify({
                auth_id: user._id
              })),
              prompt: 'consent'
            })
            res.redirect(url);
          })
          .catch((err) => {
            console.log('errorrrr', err)
            res.status(500).send('internal error')
          })
      } else {
        // check access token
        if (!user.access_token) {
          // user exists but failed to authenticate 
          var url = oauth2Client.generateAuthUrl({
            // 'online' (default) or 'offline' (gets refresh_token)
              access_type: 'online',
              // refresh_token only returned on the first authorization
              scope: scopes,
              state: encodeURIComponent(JSON.stringify({
                auth_id: user._id
              })),
              prompt: 'consent'
            })
            res.redirect(url);
        } else {
          // user exists and is authenticated - shouldn't be here
          console.log("why are you here???");
          res.status(500).send('server error');

        }
      }
    })
    .catch((err) => {
      console.log('error finding user', err)
      res.status(500).send('internal server error')
    })
})

// GET route that handles oauth callback for google api
app.get('/google/callback', function (req, res) {
  var code = req.query.code
  // This will provide an object with the access_token and refresh_token
  oauth2Client.getToken(code, (err, tokens) => {
    console.log('token!!', tokens)
    if (err) return console.log('!!error:', err)
    oauth2Client.setCredentials(tokens)

    // look for user based on auth_id and store token in database
    var auth_id = JSON.parse(decodeURIComponent(req.query.state)).auth_id
    console.log('auth_id!!!', auth_id)
    User.findById(auth_id)
      .exec()
      .then((user) => {
        if (!user) {
          console.log('user not found')
          res.status(500).send('database error')
        } else {
          user.access_token = tokens.access_token
          user.refresh_token = tokens.refresh_token
          user.save()
          res.status(200).send('Successfully authenticated. You may now go back to Slack to send the message again');
        }
      })
      .catch((err) => {
        console.log('errorrrr', err)
        res.status(500).send('internal error')
      })
  })
})

app.listen(1337);
