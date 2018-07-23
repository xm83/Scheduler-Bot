You can find your project ID in your Dialogflow agent settings
// const projectId = PROCESS.ENV.DIALOGFLOW_PROJECT_ID; //https://dialogflow.com/docs/agents#settings
// const sessionId = 'quickstart-session-id';
// const query = 'hello';

function bot(projectId, sessionId, query){
  // Instantiate a DialogFlow client.
  const dialogflow = require('dialogflow');
  const sessionClient = new dialogflow.SessionsClient();

  // Define session path
  const sessionPath = sessionClient.sessionPath(projectId, sessionId);

  // The text query request.
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: query,
        languageCode: 'en-US',
      },
    },
  };

  // Send request and log result
  sessionClient
    .detectIntent(request)
    .then(responses => {
      console.log('Detected intent');
      const result = responses[0].queryResult;
      console.log(`  Query: ${result.queryText}`);
      console.log(`  Response: ${result.fulfillmentText}`);
      if (result.intent) {
        console.log(`  Intent: ${result.intent.displayName}`);
      } else {
        console.log(`  No intent matched.`);
      }
    })
    .catch(err => {
      console.error('ERROR:', err);
    });
}
