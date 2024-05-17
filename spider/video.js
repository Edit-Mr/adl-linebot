/** @format */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const Cookie = `_ga=GA1.3.362768852.1715238395; _ga_07X29V013K=GS1.1.1715904389.4.1.1715916501.0.0.0; set_school0=%E8%87%BA%E4%B8%AD%E5%B8%82; set_school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; set_school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD; authchallenge=134827294a31b0f60df1c47fde20c1a0; _gid=GA1.3.1985147559.1715875221; PHPSESSID=9efp5b07o8evecbtcgasjo659h; username=193313-110256; id_level=1; captcha_code=0680; school0=%E8%87%BA%E4%B8%AD%E5%B8%82; school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD; GCILB="5159e1d6e5006210"; _gat_gtag_UA_108376301_1=1`;
// Load the lessons JSON
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
                                    node.video = videoUrlMatch[1];
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
