/** @format */

const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");
const Cookie = `_ga=GA1.3.362768852.1715238395; _ga_07X29V013K=GS1.1.1715904389.4.1.1715908040.0.0.0; set_school0=%E8%87%BA%E4%B8%AD%E5%B8%82; set_school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; set_school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD; authchallenge=134827294a31b0f60df1c47fde20c1a0; GCILB="cd8dab841b57a46d"; _gid=GA1.3.1985147559.1715875221; PHPSESSID=9efp5b07o8evecbtcgasjo659h; username=193313-110256; id_level=1; captcha_code=0680; school0=%E8%87%BA%E4%B8%AD%E5%B8%82; school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD`;
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
