const mongoose = require('mongoose');
const connect = process.env.MONGODB_URI;

mongoose.connect(connect);
const Schema = mongoose.Schema;

// Schemas

const userSchema = Schema({
  access_token: String,
  refresh_token: String,
  profileId: String,
  expiry_date: String,
  defaultSetting: {
    meetingLength: {
      type: Number,
      default: 30
    }
  },
  slackId: String,
  slackUsername: String,
  slackEmail: String,
  slackDMId: String

})


const taskSchema = Schema({
  subject: {
    type: String,
    required: true
  },
  day: {
    type: String,
    required: true
  },
  status: String, // pending or scheduled
  gCalEventId: String,
  requesterId: {
    type: Schema.Types.ObjectId, 
    ref: 'User'
  }
});

const meetingSchema = Schema({
  day: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  invitees: {
    type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    default: [],
    required: true
  },
  subject: String,
  location: String,
  meetingLength: String,
  status: String, // pending or scheduled
  createdAt: {
    type: Date,
    default: '',
  },
  requesterId: {
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  // google calendar fields
});

// Convert Schemas to Models
const User = mongoose.model('User', userSchema);
// const Meeting = mongoose.model('Meeting', meetingSchema);
const Task = mongoose.model('Task', taskSchema);

module.exports = {
  User,
  // Meeting,
  Task
};
