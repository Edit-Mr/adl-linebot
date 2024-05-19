
const express = require("express");
const fs = require("fs");
const line = require("@line/bot-sdk");
const videodata = require('./Database/video.json');
require("dotenv").config();
const config = {
  channelAccessToken: process.env.ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

app.post("/webhook", line.middleware(config), (req, res) => {
  Promise.all(req.body.events.map(handleEvent)).then(result =>
    res.json(result)
  );
});

function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }
  const parts = event.message.text.split("/");
  if (!videodata[parts[0]])
    return client.replyMessage(event.replyToken, flexElement("", "課程分類", "以下是課程列表", Object.keys(videodata)));
  let current = videodata[parts[0]];
  if (!current[parts[1]])
    return client.replyMessage(event.replyToken, flexElement(parts[0], "年級列表", "以下是年級列表", Object.keys(current)));
  current = current[parts[1]];
  if (!current[parts[2]])
    return client.replyMessage(event.replyToken, flexElement(parts[0] + "/" + parts[1], "科目列表", "以下是科目列表", Object.keys(current)));
  current = current[parts[2]];
  let checkCurrent = current.seme_list.find(e => e.unit_name === parts[3]);
  if (!checkCurrent) {
    // return client.replyMessage(event.replyToken, {
    //   type: "text",
    //   text: "以下是單元列表:\n" + current.seme_list.map(e => e.unit_name).join("\n"),
    // });
    return client.replyMessage(event.replyToken, flexElement(parts[0] + "/" + parts[1] + "/" + parts[2], "單元列表", "以下是單元列表", current.seme_list.map(e => e.unit_name)));
  }
  current = checkCurrent;
  checkCurrent = current.bNodes.find(e => e.name === parts[4]);
  if (!checkCurrent) {
    // return client.replyMessage(event.replyToken, {
    //   type: "text",
    //   text: "以下是影片列表:\n" + current.bNodes.map(e => e.name).join("\n"),
    // });
    return client.replyMessage(event.replyToken, flexElement(parts[0] + "/" + parts[1] + "/" + parts[2] + "/" + parts[3], "影片列表", "以下是影片列表", current.bNodes.map(e => e.name)));
  }
  current = checkCurrent;
  let resources = current.resources;
  let messages = [];
 
const typeTranslate = {
  "video": "影片",
  "prac": "練習題",
  "worksheet": "學習單",
  "external": "外部資源"
}
  const resourcesButtons = resources.map(r => {
    return {
      "type": "action",
      "action": {
        "type": "uri",
        "label": typeTranslate[r.type],
        "uri": "https://adl.edu.tw/" + r.url
      }
    };
  }
  );
  if (current.video) {
    messages.push({
      type: "video",
      originalContentUrl: "https://adl.edu.tw/" + JSON.parse(`"${current.video.replace(/\\\\/g, '\\')}"`),
      previewImageUrl: "https://raw.githubusercontent.com/Edit-Mr/adl-linebot/main/thumbnail.jpg",
      "quickReply": { // 2
        "items": [
         ...resourcesButtons
          
        ]
      }
    });
  }

  fs.appendFile("access.log", JSON.stringify(event) + "\n", () => { });
  return client.replyMessage(event.replyToken, messages);
  // save log to access.log
}

app.listen(3030, () => {
  console.log("Application is running on port 3030");
});


const flexElement = (path, title, text, urls) => {
  const buttons = urls.map(url => {
    return {
      "type": "button",
      "action": {
        "type": "message",
        "label": url,
        "text": path + ((path) ? "/" : "") + url
      },
      "style": "secondary",
      "scaling": true,
      "height": "sm",
      "margin": "md",
      "color": "#e5e5e5"
    };
  });

  return {
    "type": "flex",
    "altText": title,
    "contents": {
      "type": "bubble",
      "body": {
        "type": "box",
        "layout": "vertical",
        "contents": [
          {
            "type": "text",
            "text": (path) ? path : "課程分類",
            "weight": "bold",
            "color": "#fca311",
            "size": "sm"
          },
          {
            "type": "text",
            "text": title,
            "weight": "bold",
            "size": "xxl",
            "margin": "sm",
            "color": "#14213d"
          },
          {
            "type": "text",
            "text": text,
            "size": "xs",
            "color": "#aaaaaa",
            "wrap": true,
            "margin": "xs"
          },
          {
            "type": "separator",
            "margin": "sm",
            "color": "#FFFFFF"
          },
          ...buttons,
          {
            "type": "box",
            "layout": "horizontal",
            "margin": "md",
            "contents": [
              {
                "type": "text",
                "text": "更新日期: 2024/5/19",
                "size": "xs",
                "color": "#aaaaaa",
                "flex": 0
              },
              {
                "type": "text",
                "text": "問題回報",
                "color": "#aaaaaa",
                "size": "xs",
                "align": "end"
              }
            ]
          }
        ]
      },
      "styles": {
        "body": {
          "backgroundColor": "#ffffff"
        },
        "footer": {
          "separator": true
        }
      }
    }
  };
}
