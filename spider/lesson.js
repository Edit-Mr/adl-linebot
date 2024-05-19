/** @format */

const fs = require("fs").promises;
const axios = require("axios");
const cheerio = require("cheerio");
require("dotenv").config();
const Cookie = process.env.COOKIE;
const readJSON = async (path) => {
  const data = await fs.readFile(path, "utf8");
  return JSON.parse(data);
};

const fetchPage = async (url) => {
  const response = await axios.get(url, { headers: { Cookie } });
  return response.data;
};
const processUnits = async (data) => {
  for (const [type, grades] of Object.entries(data)) {
    for (const [grade, subjects] of Object.entries(grades)) {
      for (const [subjectName, details] of Object.entries(subjects)) {
        if (!details.seme_list) continue;
        for (const unit of details.seme_list) {
          try {
            const url = `https://adl.edu.tw/modules_new.php?op=modload&name=assignMission&file=ks_viewunit_new&subject=${unit.subject_id}&publisher=${details.publisher}&stage=${details.stage}&grade=${details.grade}&seme=${details.seme}&unit=${unit.unit}&subsubject=0`;
            const html = await fetchPage(url);
            if (html.includes("認證已到期")) {
              console.log("The certification has expired.");
              continue;
            }

            const $ = cheerio.load(html);
            const lessons = [];
            $(".bnodelist dl").each((_, element) => {
              const id = $(element).find("dt").text();
              const name = $(element).find("dd div").first().text();
              const resources = [];
              const resourceTypes = {
                video: "video",
                prac: "prac",
                worksheet: "worksheet",
                external: "external",
              };

              $(element).find("a").each((_, link) => {
                const href = $(link).attr("href");
                if (href) {
                  Object.entries(resourceTypes).forEach(([key, value]) => {
                    if (href.includes(value)) {
                      resources.push({ type: key, url: href });
                    }
                  });
                }
              });
              lessons.push({ id, name, resources });
            });

            unit.bNodes = lessons;

            const midElement = $(".bnodelist a").first();
            let mid = midElement.length ? midElement.attr("href") : null;
            if (mid && mid.includes("#mid=")) {
              unit.mid = mid.split("&mid=")[1].split("#")[0];
            }
          } catch (error) {
            console.error(`Error processing unit ${unit.unit}: ${error.message}`);
            // Optionally log more details or handle specific error types differently
          }
        }
      }
    }
  }
  await fs.writeFile("../Database/lesson.json", JSON.stringify(data, null, 2));
};
const start = async () => {
  const data = await readJSON("../Database/course.json");
  await processUnits(data);
};

start().catch(console.error);

