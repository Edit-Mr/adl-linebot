/** @format */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
require('dotenv').config();
const Cookie = process.env.COOKIE;

const lessonData = JSON.parse(fs.readFileSync("Database/lesson.json", "utf8"));

async function fetchVideoUrls() {
    for (const schoolType in lessonData) {
        for (const grade in lessonData[schoolType]) {
            for (const subject in lessonData[schoolType][grade]) {
                const subjectData = lessonData[schoolType][grade][subject];
                for (const unit of subjectData.seme_list) {
                    for (const node of unit.bNodes) {
                        // Construct the URL for each node
                        const url = `https://adl.edu.tw/modules_new.php?op=modload&name=assignMission&file=ks_viewskill_new&ind=${node.id}&mid=${unit.mid}#video`;
                        try {
                            const response = await axios.get(url, {
                                headers: { Cookie },
                            });
                            const body = response.data;
                            if (body.includes("認證已到期")) {
                                console.log("The certification has expired.");
                                return;
                            }
                            const $ = cheerio.load(body);
                            const videoDataScript = $("script")
                                .toArray()
                                .find(script =>
                                    $(script).html().includes("const aVideo")
                                );
                            if (videoDataScript) {
                                const videoData = $(videoDataScript).html();
                                const videoUrlMatch =
                                    videoData.match(/"src":"([^"]+)"/);
                                if (videoUrlMatch && videoUrlMatch[1]) {
                                    // Save the video URL to the node
                                    node.video = videoUrlMatch[1].replace("\\","");
                                    console.log(node.video);
                                }
                            }
                        } catch (error) {
                            console.error(
                                `Failed to fetch or parse for ${node.id}: ${error}`
                            );
                        }
                    }
                }
            }
        }
    }
    // Save the updated JSON with video URLs
    fs.writeFileSync(
        "Database/video.json",
        JSON.stringify(lessonData, null, 2)
    );
}

fetchVideoUrls();
