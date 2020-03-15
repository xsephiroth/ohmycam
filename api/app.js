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
const getSessionMasterKey = roomId => `session-${roomId}.master.json`;
const getSessionJoinKey = roomId => `session-${roomId}.join.json`;

// create a new room
app.post('/room', async (_, res) => {
  const roomId = uniqid.time();
  res.json({ roomId });
});

// update sdp to store
app.post('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const { sdp, join } = req.body;
  if (!sdp) {
    res.sendStatus(400);
    return;
  }

  const sessionKey = join
    ? getSessionJoinKey(roomId)
    : getSessionMasterKey(roomId);

  // merge session
  try {
    await cosPutObject({
      Key: sessionKey,
      Body: JSON.stringify({ sdp })
    });
  } catch (e) {
    console.error('put session object error:', e);
    res.sendStatus(500);
  }

  res.sendStatus(204);
});

app.get('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  const join = req.query.join;
  if (!roomId) {
    res.sendStatus(400);
    return;
  }

  // get another sdp from cos
  const sessionKey = join
    ? getSessionMasterKey(roomId)
    : getSessionJoinKey(roomId);
  try {
    const { Body } = await cosGetObject({ Key: sessionKey });
    const { sdp } = JSON.parse(Body);
    res.json({ sdp });
    return;
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
});

// delete session
app.delete('/room/:roomId', async (req, res) => {
  const roomId = req.params.roomId;
  if (!roomId) {
    res.sendStatus(400);
    return;
  }

  try {
    await Promise.all([
      cosDeleteObject({ Key: getSessionMasterKey(roomId) }),
      cosDeleteObject({ Key: getSessionJoinKey(roomId) })
    ]);
  } catch (e) {}

  res.sendStatus(204);
});

module.exports = app;
