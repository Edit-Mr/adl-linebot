/** @format */

const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");
require('dotenv').config();
const Cookie = process.env.COOKIE;
const readJSON = async path => {
    const data = await fs.readFile(path, "utf8");
    return JSON.parse(data);
};

const fetchPage = async url => {
    const response = await axios.get(url,{ headers: { Cookie } });
    return response.data;
};

const processUnits = async data => {
    for (const [type, grades] of Object.entries(data)) {
        for (const [grade, subjects] of Object.entries(grades)) {
            for (const [subjectName, details] of Object.entries(subjects)) {
                for (const unit of details.seme_list) {
                    const url = `https://adl.edu.tw/modules_new.php?op=modload&name=assignMission&file=ks_viewunit_new&subject=${unit.subject_id}&publisher=${details.publisher}&stage=${details.stage}&grade=${details.grade}&seme=${details.seme}&unit=${unit.unit}&subsubject=0`;
                    const html = await fetchPage(url);
                    const $ = cheerio.load(html);
                    const lessons = [];
                    $(".bnodelist dl").each((_, element) => {
                        const id = $(element).find("dt").text();
                        const name = $(element).find("dd div").first().text();
                        // const videoLink = $(element).find('a[href*="#video"]').attr("href");
                        // const practiceLink = $(element).find('a[href*="#prac"]').attr("href");
                        lessons.push({
                           id,name
                            // video: videoLink.replace(),
                            // quiz: practiceLink,
                        });
                    });
                    // get the first lesson
                    
                    unit.bNodes = lessons;
                    unit.mid = $(".bnodelist a").first().attr("href").split("&mid=")[1].split("#")[0]
                }
            }
        }
    }
    await fs.writeFile("Database/lesson.json", JSON.stringify(data, null, 2));
};

const start = async () => {
    const data = await readJSON("Database/course.json");
    await processUnits(data);
};

start().catch(console.error);
