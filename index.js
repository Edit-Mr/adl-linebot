/** @format */

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
    if (!videodata[parts[0]]) {
		console.log( Object.keys(videodata))
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: "以下是課程分類:\n" + Object.keys(videodata).join("\n"),
        });
    }
    let current = videodata[parts[0]];
    if (!current[parts[1]]) {
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: "以下是年級列表:\n" + Object.keys(current).join("\n"),
        });
    }
    current = current[parts[1]];
    if (!current[parts[2]]) {
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: "以下是科目列表:\n" + Object.keys(current).join("\n"),
        });
    }
    current = current[parts[2]];
    // if current.seme_list array have a element that unit_name is equal to parts[3]
    // then assign that element to current]
    let checkCurrent = current.seme_list.find(e => e.unit_name === parts[3]);
    if (!checkCurrent) {
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: "以下是單元列表:\n" + current.seme_list.map(e => e.unit_name).join("\n"),
        });
    }
    current = checkCurrent;
    checkCurrent = current.bNodes.find(e => e.name === parts[4]);
    if (!checkCurrent) {
        return client.replyMessage(event.replyToken, {
            type: "text",
            text: "以下是影片列表:\n" + current.bNodes.map(e => e.name).join("\n"),
        });
    }
    current = checkCurrent;
    const message = {
        type: "video",
        originalContentUrl: `https://adl.edu.tw/${current.video}`,
        previewImageUrl: "https://raw.githubusercontent.com/Edit-Mr/adl-linebot/main/thumbnail.jpg",
    };
    fs.appendFile("access.log", JSON.stringify(event) + "\n", () => {});
    return client.replyMessage(event.replyToken, message);
    // save log to access.log
}

app.listen(3030, () => {
    console.log("Application is running on port 3030");
});

