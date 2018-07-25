const { RTMClient, WebClient } = require('@slack/client');
const teamId = 'sjs-2018';
const token = process.env.BOT_USER_OAUTH_ACCESS_TOKEN;
let axios = require('axios');
const express = require('express');
const bodyParser = require('body-parser');
const dialogflow = require('dialogflow');
const projectId = process.env.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
const sessionId = 'quickstart-session-id';
var urlencodedParser = bodyParser.urlencoded({ extended: false })
const request = require('request');
const http = require('http');
const { createMessageAdapter } = require('@slack/interactive-messages');
const slackVerificationToken = process.env.SLACK_VERIFICATION_TOKEN;
const slackInteractions = createMessageAdapter(slackVerificationToken);

const port = 8888 | process.env.PORT;

let app = express();

function sendMessageToSlackResponseURL(responseURL, JSONmessage){
    var postOptions = {
        uri: responseURL,
        method: 'POST',
        headers: {
            'Content-type': 'application/json'
        },
        json: JSONmessage
    }
    request(postOptions, (error, response, body) => {
        if (error){
            // handle errors as you see fit
        }
    })
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/slack/actions', slackInteractions.expressMiddleware());

const web = new WebClient(token);
const rtm = new RTMClient(token);
rtm.start();

rtm.on('message', event=> {
  let message = event.text;
  let channel = event.channel;

  // console.log(message, channel);

  //CHECK IF WE HAVE ACCESS TO THAT USER'S CALENDAR
  //GENERATE AUTH REQUEST -> SAVE CREDENTIALS INTO OUR DATABASE
  // so that we can use the existing credentials
  //
  //Access token and refresh token from oauth
  //if token is expired, then we refresh the token so that the user doesn't
  // need to reenter credentials

  //user database needs to contain slackID and oauth stuff


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

  sessionClient
  .detectIntent(request)
  .then(responses => {
    // console.log('Detected intent');
    const result = responses[0].queryResult;
    // console.log(`  Query: ${result.queryText}`);
    // console.log(`  Response: ${result.fulfillmentText}`);
    // console.log(result.parameters);

    /**

    web.chat.postMessage({ channel: conversationId, text: 'Hello there' })
    .then((res) => {
    // `res` contains information about the posted message
      console.log('Message sent: ', res.ts);
    })
    .catch(console.error);

    **/
    rtm.sendMessage(result.fulfillmentText, channel)
      if (result.intent) {


        // console.log(`Intent: ${result.intent.displayName}`);
      } else {
        // console.log(`No intent matched.`);
      }
    }).catch(err=> console.log("error", err)
  );
})

//to have a message action, create a post route
app.post('/commands/send-me-buttons', urlencodedParser, (req, res) =>{
  console.log('send buttons');
    res.status(200).end() // best practice to respond with empty 200 status code
    var reqBody = req.body
    var responseURL = reqBody.response_url
    console.log(reqBody);

    if (reqBody.token != slackVerificationToken){
        res.status(403).end("Access forbidden")
   }else{
        var message = {
            "text": "This is your first interactive message",
            "attachments": [
                {
                    "text": "Building buttons is easy right?",
                    "fallback": "Shame... buttons aren't supported in this land",
                    "callback_id": "send_button",
                    "color": "#3AA3E3",
                    "attachment_type": "default",
                    "actions": [
                        {
                            "name": "yes",
                            "text": "yes",
                            "type": "button",
                            "value": "yes"
                        },
                        {
                            "name": "no",
                            "text": "no",
                            "type": "button",
                            "value": "no"
                        },
                        {
                            "name": "maybe",
                            "text": "maybe",
                            "type": "button",
                            "value": "maybe",
                            "style": "danger"
                        }
                    ]
                }
            ]
        }
        sendMessageToSlackResponseURL(responseURL, message)
    }
})


//slack webhook
app.post('/slack/actions', urlencodedParser, (req, res) =>{
  let payload = JSON.parse(req.body.payload);
  console.log(payload);
  let username = payload.user.name;
  let callback = payload.callback_id;
    res.status(200).end() // best practice to respond with 200 status
    var actionJSONPayload = JSON.parse(req.body.payload) // parse URL-encoded payload JSON string
    var message = {
        "text": username+" clicked: "+ callback,
        "replace_original": false,
    }
    console.log(message);
    sendMessageToSlackResponseURL(actionJSONPayload.response_url, message)
})

slackInteractions.action({

  type: 'button'
}, (payload, respond) => {
  console.log('send button!!!!');
});



http.createServer(app).listen(port, () => {
  console.log(`server listening on port ${port}`);
});


"@slack/client": "^4.3.1",
"@slack/interactive-messages": "^0.4.0",
"axios": "^0.18.0",
"body-parser": "^1.18.3",
"dialogflow": "^0.6.0",
"express": "^4.16.3",
"googleapis": "^27.0.0",
"request": "^2.87.0"
