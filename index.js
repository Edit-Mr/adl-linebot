const express = require('express');
const line = require('@line/bot-sdk');
require("dotenv").config();
const config = {
  channelAccessToken: process.env.ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

const client = new line.Client(config);
const app = express();

app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});

function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // Ignore non-text-message event
    return Promise.resolve(null);
  }

  const userMessage = event.message.text;
  const videoUrl = findVideoUrl(userMessage);

  if (videoUrl) {
    const message = {
      type: 'video',
      originalContentUrl: videoUrl,
      previewImageUrl: "URL_TO_A_PREVIEW_IMAGE"
    };
    return client.replyMessage(event.replyToken, message);
  } else {
    return client.replyMessage(event.replyToken, { type: 'text', text: 'Video not found.' });
  }
}

function findVideoUrl(query) {
  // Logic to traverse the video.json based on the query string from the user
  // Example: "普通型高中/十一年級/國語文/能量的形式與轉換（Ba）/功與能量的概念"
  const parts = query.split('/');
  let current = videoData; // Assume videoData is loaded from video.json
  for (const part of parts) {
    if (current[part]) {
      current = current[part];
    } else {
      return null;
    }
  }
  return current.video ? `https://adl.edu.tw/${current.video}` : null;
}

app.listen(3000, () => {
  console.log('Application is running on port 3000');
});
