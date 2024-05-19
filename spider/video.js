/** @format */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();
let Cookie = process.env.COOKIE;

const lessonData = JSON.parse(
  fs.readFileSync("../Database/video.json", "utf8")
);

async function fetchVideoUrls() {
  for (const schoolType in lessonData) {
    for (const grade in lessonData[schoolType]) {
      for (const subject in lessonData[schoolType][grade]) {
        if (!subject) continue;
        const subjectData = lessonData[schoolType][grade][subject];
        if (!subjectData.seme_list) continue;
        for (const unit of subjectData.seme_list) {
          if (!unit) continue;
          for (const node of unit.bNodes) {
            if (node.video) {
              console.log("skip");
              continue;
            }
            if (!node.resources) continue;
            // Check if there's a resource with type 'video'
            const videoResource = node.resources.find(
              (res) => res.type === "video"
            );
            if (!videoResource) continue; // If no video resource is found, skip to the next node
            // Now you have the video resource URL which you can use to construct the full URL
            const baseUrl = "https://adl.edu.tw/";
            const url = baseUrl + videoResource.url;
            console.log(url);
            try {
              const response = await axios.get(url, {
                headers: { Cookie },
              });
              const body = response.data;
              Cookie = response.headers["set-cookie"];
              if (body.includes("認證已到期")) {
                console.log("The certification has expired.");
                return;
              }
              const $ = cheerio.load(body);
              const videoDataScript = $("script")
                .toArray()
                .find((script) => $(script).html().includes("const aVideo"));
              if (videoDataScript) {
                const videoData = $(videoDataScript).html();
                const videoUrlMatch = videoData.match(/"src":"([^"]+)"/);
                if (videoUrlMatch && videoUrlMatch[1]) {
                  // Save the video URL to the node
                  node.video = videoUrlMatch[1].replace("\\", "");
                } else console.log("no");
              }
            } catch (error) {
              console.error(
                `Failed to fetch or parse for ${node.id}: ${error.message}`
              );
              continue; // Ensure the next iteration of the loop proceeds
            }
          }
        }
        fs.writeFileSync(
          "../Database/video.json",
          JSON.stringify(lessonData, null, 2)
        );
      }
    }
  }
  // Save the updated JSON with video URLs
  fs.writeFileSync(
    "../Database/video.json",
    JSON.stringify(lessonData, null, 2)
  );
}

fetchVideoUrls();
