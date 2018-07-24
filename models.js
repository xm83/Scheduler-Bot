const mongoose = require('mongoose');
const connect = process.env.MONGODB_URI;

mongoose.connect(connect);
const Schema = mongoose.Schema;

// Schemas

const userSchema = Schema({
  auth_id: String,
  accessToken: String,
  refreshToken: String,
  profileId: String,
  expiry_date: String

  // default setting
  // meetingLength: ''
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
  gCalEventId: String,
  requesterId: String
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
  requesterId: String,
  // google calendar fields
});

// Convert Schemas to Models
const User = mongoose.model('User', userSchema);
const Meeting = mongoose.model('Meeting', meetingSchema);
const Task = mongoose.model('Meeting', taskSchema);

module.exports = {
  User,
  Meeting,
  Task
};
