/** @format */

const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");
require('dotenv').config();
const Cookie = process.env.COOKIE;
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
