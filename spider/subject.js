/** @format */

const axios = require("axios");
const cheerio = require("cheerio");
// save file
const fs = require("fs");

async function fetchCourseData() {
    const url =
        "https://adl.edu.tw/modules_new.php?op=modload&name=dashboard&file=modules_student";
    const headers = {
        Cookie: `PHPSESSID=188evhci55ubuss0sf298vf41q; _ga=GA1.1.362768852.1715238395; _ga_07X29V013K=GS1.1.1715875220.3.1.1715881140.0.0.0; set_school0=%E8%87%BA%E4%B8%AD%E5%B8%82; set_school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; set_school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD; authchallenge=14ab3f087bf4c28f308f26f89b5566d9; GCILB="b6ae9ea355d46cee"; _gid=GA1.3.1985147559.1715875221; username=193313-110256; id_level=1; captcha_code=8054; school0=%E8%87%BA%E4%B8%AD%E5%B8%82; school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD`,
    };

    try {
        const response = await axios.get(url, { headers });
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
