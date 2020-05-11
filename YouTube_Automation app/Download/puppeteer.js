// 3rd party website used for downloading -> https://www.savethevideo.com/

let puppeteer = require('puppeteer');
let fs = require('fs')
let path = require('path')

let link = process.argv[2];

(async function () {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications", "--incognito"]  // "--incognito",
        })

        let tabs = await browser.pages()
        let tab = tabs[0];

        await tab.goto("https://www.savethevideo.com/", { waitUntil: "networkidle0" })

        await tab.waitForSelector("#url")
        await tab.type("#url", link);

        await tab.waitForSelector("button[formaction='download']")
        let searchBtn = await tab.$$("button[formaction='download']");

        await searchBtn[0].click();
        await tab.waitForNavigation({ timeout: 120000, waitUntil: "networkidle2" })
        await tab.waitFor(2000)
        tabs = await browser.pages();
        let fill = []
        for (let i = tabs.length - 1; i > 0; i--) {
            fill.push(tabs[i].close());
        }

        await Promise.all(fill);

        await tab.waitForSelector("button[type=submit]", { timeout: 120000 });
        await tab.click("button[type=submit]")

        let i = 0;
        while (i++ < 3) {
            let hasClass = await tab.evaluate(() => {
                let x = document.querySelector('button[type="submit"].is-loading')
                if (x != null) return false;
                return true;
            })

            if (!hasClass) {
                try {
                    await tab.waitForSelector("#dl-section .hero-body .b-tabs .tab-item .column .box span.is-always a", { timeout: 10000 });
                    break
                } catch (e) {

                }
            }

            await tab.waitFor(120000);
            await tab.click("button[type=submit]")
        }

        let dBtn = await tab.$$("#dl-section .hero-body .b-tabs .tab-item .column .box span.is-always a")
        await dBtn[0].click();

        await tab.waitForSelector("span[data-label='Click to download']", { timeout: 600000 })

        dBtn = await tab.$$("#dl-section .hero-body .b-tabs .tab-item .column .box span.is-always a")
        await dBtn[0].click();

        console.log("Your video download has been initiated, please wait until it finishes and find you video in your default downloads folder")

    } catch (err) {

    }
})()
