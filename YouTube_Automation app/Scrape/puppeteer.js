let puppeteer = require('puppeteer');
let fs = require('fs')
let path = require('path')

let pUrl = process.argv[2];
let num = process.argv[3];



(async function () {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications", "--incognito"]  // "--incognito",
        })

        let tabs = await browser.pages()
        let tab = tabs[0];

        await tab.goto(pUrl, { waitUntil: "networkidle0" })
        await tab.waitForSelector("h1.title>.ytd-video-primary-info-renderer")
        let title = await tab.evaluate(() => {
            return document.querySelector("h1.title>.ytd-video-primary-info-renderer").innerText
        })

        if (!fs.existsSync("./screenshots")) fs.mkdirSync("./screenshots");
        await tab.screenshot({ path: "./screenshots/" + title + ".png" });

        await tab.evaluate(() => {
            window.scrollBy(0, 500)
        })

        await tab.waitFor(2000);
        await tab.waitForSelector("#spinner-container #spinnerContainer", { visible: false });

        let data = [];
        let idx = 0;
        let comments = null;

        while (idx < num) {
            comments = await tab.$$("#comments #contents #comment");
            if (idx == comments.length) break;
            let comment = comments[idx];
            let name = await comment.$("#author-text");
            name = await tab.evaluate((ele) => {
                return ele.innerText;
            }, name);

            let content = await comment.$("#content-text");

            await tab.evaluate((sel) => {
                let ele = document.querySelector(sel)
                if (ele) ele.click();
            }, "#dismiss-button")

            await comment.click();

            content = await tab.evaluate((ele) => {
                return ele.innerText;
            }, content);


            data.push({ name, content });
            await tab.evaluate((ele) => {
                window.scrollBy(0, ele.style.height + 20);
            }, comment)

            idx++;

            let i = 0
            if (idx == comments.length) {

                await tab.waitFor(1000);
                await tab.waitForSelector("#continuations #spinner #spinnerContainer", { visible: false })

            }
        }

        console.log(data.length);
        console.log(data[0]);
        let str = '<h1 style="text-decoration: wavy;text-decoration-line: underline;text-align: center;">Scrappy</h1>'
        str += '<h2><a style="color: black; text-decoration: none;" href="' + pUrl + '">' + title + '</a></h2>'
        let x = "./screenshots/" + title + ".png";
        if (fs.existsSync(x)) console.log(true);
        x = base64_encode(x);
        str += `<img width="800px" src="` + 'data:image/png;base64,' + x + `">`
        str += '<ol style="border:2px solid orangered; border-radius:5px;">'
        for (d of data) {
            str += '<li style="padding:3px 2px; margin:5px 0px; box-shadow: 2px 1px black;"><b><span style="color:gold; font-size: 20px;">' + d.name + ": </span></b><span>" + d.content + "</span></li>";
        }
        str += "</ol>";

        await browser.close();

        browser = await puppeteer.launch({
            headless: true,
        })

        tabs = await browser.pages();
        tab = tabs[0];

        await tab.setContent(str);
        await tab.waitFor(10000);
        await tab.pdf({ path: 'result.pdf', format: 'A4' });

        str = "<html><head></head><body>" + str + "</body></html>"
        fs.writeFileSync("file.html", str);
        await browser.close();

        console.log("Scraping complete, your results are stored in result.pdf")

    } catch (err) {
        console.log(err);
    }
})()

function base64_encode(file) {
    var bitmap = fs.readFileSync(file);
    return new Buffer(bitmap).toString('base64');
}