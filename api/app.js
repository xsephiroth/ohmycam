'use strict';

const express = require('express');
const cors = require('cors');
const COS = require('cos-nodejs-sdk-v5');
const uniqid = require('uniqid');

// cos bucket env
const Bucket = process.env.COS_BUCKET;
const Region = process.env.COS_REGION;

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});

const cosPromise = fn => params =>
  new Promise((resolve, reject) => {
    fn({ Bucket, Region, ...params }, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  });

const cosGetObject = cosPromise(cos.getObject.bind(cos));
const cosPutObject = cosPromise(cos.putObject.bind(cos));
const cosDeleteObject = cosPromise(cos.deleteObject.bind(cos));

const app = express();
app.use(cors());
app.use(express.json());

// cos file sessionKey builder
const getSessionKey = id => `session-${id}.json`;

// create a new room
app.post('/room', async (_, res) => {
  const roomId = uniqid.time();
  const sessionKey = getSessionKey(roomId);
  try {
    await cosPutObject({ Key: sessionKey, Body: JSON.stringify({}) });
    res.json({ roomId });
  } catch (e) {
    console.error('put session object error:', e);
    res.sendStatus(500);
  }
});

// update sdp to store
app.post('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const { sdp } = req.body;
  if (!sdp) {
    res.sendStatus(400);
    return;
  }

  const sessionKey = getSessionKey(roomId);

  // get session from cos
  let session;
  try {
    const { Body } = await cosGetObject({ Key: sessionKey });
    session = JSON.parse(Body);
  } catch (e) {
    if (e.statusCode && e.statusCode === 404) {
      res.sendStatus(404);
      return;
    }
    console.error('put session object error:', e);
    res.sendStatus(500);
    return;
  }

  const userId = uniqid();

  // merge session
  try {
    await cosPutObject({
      Key: sessionKey,
      Body: JSON.stringify({
        ...session,
        [userId]: sdp
      })
    });
  } catch (e) {
    console.error('put session object error:', e);
    res.sendStatus(500);
  }

  res.json({ userId });
});

app.get('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.query.userId;
  if (!roomId || !userId) {
    res.sendStatus(400);
    return;
  }

  const sessionKey = getSessionKey(roomId);

  // get session from cos
  let session;
  try {
    const { Body } = await cosGetObject({ Key: sessionKey });
    session = JSON.parse(Body);
  } catch (e) {
    // err not exists
    if (e.statusCode && e.statusCode === 404) {
      res.sendStatus(404);
      return;
    }
    // others err
    console.error('get cos object error:', e);
    res.sendStatus(500);
    return;
  }

  // return another sdp
  const another = Object.entries(session).find(u => u[0] !== userId);
  res.json({ sdp: another ? another[1] : null });
});

// delete session
app.delete('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  if (!roomId) {
    res.sendStatus(400);
    return;
  }

  try {
    await cosDeleteObject({ Key: getSessionKey(roomId) });
  } catch (e) {
    console.error('delete cos object error:', e);
    res.sendStatus(500);
    return;
  }

  res.sendStatus(204);
});

module.exports = app;
