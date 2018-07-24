// models
const User = require('./models').User;

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

// calendar
const calendar = google.calendar({
  version: 'v3',
  auth: oauth2Client
})


async function addEvent() {
  return new Promise((resolve, reject) => {
    calendar.event.insert({
      calendarId: 'primary',
      summary: 'eat fish',
      start: {
        date: new Date(Date.now() + 30000) // 30 seconds from now
      },
      end: {
        date: new Date(Date.now() + 90000)
      }
    }, (err, {data}) => {
      if (err) return console.log("error:", error);
      console.log(data);
      resolve(resp);
    })
  })
}


async function listEvents() {
  return new Promise((resolve, reject) => {   
    calendar.events.list({
      calendarId: 'primary',
      timeMin:(new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime'
    }, (err, resp) => {
      console.log(resp);
    })   
  })
}

