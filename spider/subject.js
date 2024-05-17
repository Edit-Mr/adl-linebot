/** @format */

const axios = require("axios");
const cheerio = require("cheerio");
// save file
const fs = require("fs");
require("dotenv").config();
const Cookie = process.env.COOKIE;
async function fetchCourseData() {
    const url =
        "https://adl.edu.tw/modules_new.php?op=modload&name=dashboard&file=modules_student";

    try {
        const response = await axios.get(url, {
            headers: {
                Cookie,
            },
        });
        const data = parseData(response.data);
        // save to Database/subject.json
        fs.writeFileSync(
            "./Database/subject.json",
            JSON.stringify(data, null, 4)
        );
        console.log("Data saved to Database/subject.json");
    } catch (error) {
        console.error("Error fetching the data:", error);
    }
}

function parseData(html) {
    console.log(html);
    const $ = cheerio.load(html);
    const results = {};

    $(".category").each((i, elem) => {
        const categoryName = $(elem).find("h2").text().trim(); // e.g., '國小', '國中', etc.
        results[categoryName] = {};

        $(elem)
            .find(".menu-item")
            .each((j, item) => {
                const grade = $(item).find("dt").text().trim(); // e.g., '一年級', '二年級', etc.
                results[categoryName][grade] = {};

                $(item)
                    .find("dd a")
                    .each((k, link) => {
                        const subject = $(link).text().trim(); // e.g., '國語文', '數學', etc.
                        const href = $(link).attr("href");
                        results[categoryName][grade][
                            subject
                        ] = `https://adl.edu.tw/${href}`;
                    });
            });
    });

    return results;
}

fetchCourseData();
