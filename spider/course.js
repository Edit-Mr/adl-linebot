/** @format */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
const Cookie = `PHPSESSID=188evhci55ubuss0sf298vf41q; _ga=GA1.1.362768852.1715238395; _ga_07X29V013K=GS1.1.1715875220.3.1.1715881140.0.0.0; set_school0=%E8%87%BA%E4%B8%AD%E5%B8%82; set_school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; set_school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD; authchallenge=14ab3f087bf4c28f308f26f89b5566d9; GCILB="b6ae9ea355d46cee"; _gid=GA1.3.1985147559.1715875221; username=193313-110256; id_level=1; captcha_code=8054; school0=%E8%87%BA%E4%B8%AD%E5%B8%82; school1=407-%E8%A5%BF%E5%B1%AF%E5%8D%80; school2=193313-%E8%A5%BF%E8%8B%91%E9%AB%98%E4%B8%AD`;
// Function to read JSON file
function readJSONFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(JSON.parse(data));
            }
        });
    });
}

// Function to scrape data and make POST request
async function scrapeAndPost(url) {
    try {
        const response = await axios.get(url, { headers: { Cookie } });
        const trimed = response.data.replace(/\s+/g, "");
        let postData = {
            router: trimed
                .split("functiongetList(publisherNow){varrouter=`")[1]
                .split("`;")[0],
            action: "getPublisher",
            subjectG: trimed.split("varsubjectG=")[1].split(";")[0],
            grade: trimed.split("vargrade=")[1].split(";")[0],
            subSubject: trimed.split("varsubsubject=")[1].split(";")[0],
            subject: trimed.split("varsubjectId=")[1].split(";")[0],
            stage: trimed.split("varstage=")[1].split(";")[0],
        };
        const postResponse = await axios({
            method: "post",
            url: "https://adl.edu.tw/turnpage.php",
            data: new URLSearchParams(postData).toString(),
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                Cookie,
            },
        });
        postData.action = "getList";
        postData.publisher = postResponse.data.publisher[0].publisher_id;
        const postResponse2 = await axios({
            method: "post",
            url: "https://adl.edu.tw/turnpage.php",
            data: new URLSearchParams(postData).toString(),
            headers: {
                "Content-Type":
                    "application/x-www-form-urlencoded; charset=UTF-8",
                Cookie,
            },
        });
        let output = postResponse2.data.list[0];
        output = {
            ...output,
            publisher: postData.publisher,
            stage: postData.stage,
            grade: postData.grade,
        };
        return output;
    } catch (error) {
        console.error("Error during scraping and posting:", error);
    }
}

// Main function to process the JSON file and handle URLs
async function processFile(filePath) {
    const jsonData = await readJSONFile(filePath);
    for (const school in jsonData) {
        for (const grade in jsonData[school]) {
            for (const subject in jsonData[school][grade]) {
                const url = jsonData[school][grade][subject];
                if (url.includes("assignMission")) {
                    const result = await scrapeAndPost(url);
                    jsonData[school][grade][subject] = result;
                }
            }
        }
    }
    // Write the updated JSON to new file called course.json
    fs.writeFile("Database/course.json", JSON.stringify(jsonData), err => {
        if (err) {
            console.error("Error during writing file:", err);
        }
    });
}
// Run the process
processFile("Database/test.json");
