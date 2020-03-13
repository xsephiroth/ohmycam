'use strict';

const express = require('express');
const cors = require('cors');
const COS = require('cos-nodejs-sdk-v5');

// cos bucket env
const BUCKET = process.env.COS_BUCKET;
const REGION = process.env.COS_REGION;

const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY
});

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send(JSON.stringify({ message: 'Hello World' }));
});

const cosPromise = fn => params => {
  return new Promise((resolve, reject) => {
    fn({ Bucket: BUCKET, Region: REGION, ...params }, (err, data) =>
      err ? reject(err) : resolve(data)
    );
  })
};

const cosGetObject = cosPromise(cos.getObject);
const cosPutObject = cosPromise(cos.putObject);
const cosDeleteObject = cosPromise(cos.deleteObject);

app.post('/session', async (req, res) => {
  const { token, sdp } = req.body;

  if (!token || ! sdp) {
    res.sendStatus(400);
    return
  }

  const sessionKey = `session-${token}.json`;

  // get session from cos
  let session;
  try {
    const data = await cosGetObject({Key: sessionKey});
    session = JSON.parse(data.Body);
    console.log('got session', session);
  } catch (e) {
    session = {};
  }

  // session full
  if (session.a && session.b) {
    res.sendStatus(409);
    return
  }

  // user a or b marker
  let user;

  // update session values
  if (!session.a) {
    session.a = sdp;
    user = 'a';
  } else {
    session.b = sdp;
    user = 'b';
  }

  try {
     await cosPutObject({Key: sessionKey, Body: JSON.stringify(session)});
  } catch (e) {
    console.error('put session object error:', e);
    res.sendStatus(500);
    return
  }

  res.send({
    user
  });
});

app.get('/session', (req, res) => {
  // try {
  //   const data = await cosGetObject({Key: 'session-123.json'});
  //   console.log(data);
  //   res.send(data.Body);
  // } catch (e) {
  //   console.error(e);
  //   throw e;
  // }
  cos.getObject({
    Bucket: BUCKET,
    Region: REGION,
    Key: 'session-123.json'
  }, (err, data) => {
    console.log(err || data.Body);
    res.send({});
  });
});

module.exports = app;
