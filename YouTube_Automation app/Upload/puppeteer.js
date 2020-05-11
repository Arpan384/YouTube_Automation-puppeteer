let puppeteer = require('puppeteer');
let fs = require('fs')
let path = require('path')

let credPath = process.argv[2];
let vidPath = require(process.argv[3]);


(async function () {
    try {
        let browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized", "--disable-notifications", "--incognito"]  // "--incognito",
        })

        let tabs = await browser.pages()
        let tab = tabs[0];

        await tab.goto("https://www.youtube.com/", { waitUntil: "networkidle2" });
        let signIn = await tab.$$("#button>#text")
        signIn = signIn[1]
        signIn.click()
        await tab.waitForNavigation({ waitUntil: "networkidle0" })

        cred = await fs.promises.readFile(credPath)
        cred = JSON.parse(cred)

        await tab.goto("https://stackoverflow.com/users/login", { waitUntil: "networkidle2" })
        let btns = await tab.$$("div[id=openid-buttons]>button")
        btns = btns[0];
        await btns.click();
        await tab.waitForNavigation({ waitUntil: "networkidle0" })

        await tab.type("#identifierId", cred["username"], { delay: 200 })
        await tab.keyboard.press("Enter")

        await tab.waitForNavigation({ waitUntil: "networkidle0" })
        await tab.waitForSelector("input[name=password]", { timeout: 10000 })
        await tab.type("input[name=password]", cred["password"], { delay: 30 })

        await tab.evaluate((pwd) => {
            return document.querySelector("input[name=password]").value = ""
        }, cred["password"])

        await tab.type("input[name=password]", cred["password"], { delay: 200 })
        await tab.waitForSelector("#passwordNext")

        await tab.waitFor(2000)
        await tab.keyboard.press("Enter")

        await tab.waitForNavigation({ waitUntil: "networkidle2" })
        await tab.goto("https://www.youtube.com/", { waitUntil: "networkidle2" });

        let uploadsBtn = await tab.$$("#masthead-container #buttons #button");
        uploadsBtn = uploadsBtn[0];

        await uploadsBtn.click();

        uploadsBtn = await tab.$$("#container #sections #items #endpoint")
        await uploadsBtn[0].click()
        // try {
        //     await tab.waitForSelector(".ytd-channel-warm-welcome-renderer #next-button #button", { timeout: 2000 })
        //     let nxt = await tab.$$(".ytd-channel-warm-welcome-renderer #next-button #button");

        //     nxt = nxt[0];
        //     await nxt.click();
        //     await tab.waitForSelector(".ytd-channel-warm-welcome-cont-renderer #personal-account-tile-select-button #button");
        //     nxt = await tab.$$(".ytd-channel-warm-welcome-cont-renderer #personal-account-tile-select-button #button");
        //     nxt = nxt[0];

        //     await Promise.all([nxt.click(), tab.waitForNavigation({ waitUntil: "networkidle2" }), await tab.waitForSelector("#set-up-later-button")]);
        //     nxt = await tab.$$("#set-up-later-button");
        //     await nxt.click();

        // }
        // catch (err) {

        // }


        await tab.waitForSelector("input[type=file]")
        let fileIp = await tab.$$("input[type=file]")
        fileIp = fileIp[0];

        let linksArr = []

        for (v of vidPath) {

            if (path.extname(v.path) !== '.mp4') continue;
            fileIp.uploadFile(v.path)

            await tab.waitForSelector("#details #child-input #textbox", { timeout: 50000, visible: true })

            let i = 0;
            while (i++ < 10) {
                try {
                    let f = await tab.waitForFunction(
                        (selector) => {
                            let f = document.querySelector(selector).innerText.trim().length > 0
                            return document.querySelector(selector).innerText;
                        },
                        { timeout: 30000 },
                        "#details #child-input #textbox"
                    );
                    f += "";
                    if (f.include(path.basename(v.path))) break;
                    else throw f;
                }
                catch (err) {
                    await tab.waitFor(1000);
                }
            }

            try {
                await tab.evaluate(() => {
                    document.querySelector("paper-dialog#dialog.ytcp-uploads-mini-indicator").style.zIndex = "0";
                })
            } catch (err) {

            }

            let e1 = await tab.$$("#outer>#child-input>#input");

            await e1[0].type(v.title);
            await tab.waitFor(2000)
            await e1[1].click();
            await e1[1].type(v.description);


            if (!fs.existsSync("./screenshots")) fs.mkdirSync("./screenshots")
            let p = `./screenshots/` + v.title + ".png"
            await tab.screenshot({ path: p });


            await tab.waitForSelector("#made-for-kids-rating-container .ytcp-audience-picker #radioContainer #onRadio", { timeout: 50000, visible: true })
            await tab.evaluate((sel, flag) => {
                let audience = document.querySelectorAll(sel);
                if (flag) {
                    audience[0].click();
                }
                else {
                    audience[1].click();
                }
            }, "#made-for-kids-rating-container .ytcp-audience-picker #radioContainer #onRadio", v.forChildren);


            let vidLink = await tab.evaluate((sel) => {
                return document.querySelector(sel).getAttribute("href");
            }, "a.ytcp-video-info")


            linksArr.push({ title: v.title, image: "./screenshots" + v.title + ".png", url: vidLink });

            let nxt = await tab.$$("#next-button>div")
            await nxt[0].click();
            await tab.waitFor(1500)
            await nxt[0].click();

            let vis = v.visibility.toUpperCase()
            let sel = "paper-radio-button[name=" + vis + "]>#radioContainer>#onRadio"
            await tab.evaluate((sel) => {
                return document.querySelector(sel).click()
            }, sel)

            await tab.evaluate((sel) => {
                return document.querySelector(sel).click();
            }, "#done-button")

            try {
                await tab.waitForSelector("#dialog #dialog #close-button", { timeout: 10000 });
                let cbtn = await tab.$$("#dialog #dialog #close-button")
                await cbtn[0].click()
            } catch (err) {
                console.log(err);
            }


            await tab.waitForSelector("header #create-icon");
            let uploadsBtn = await tab.$$("header #create-icon");
            uploadsBtn = uploadsBtn[0];

            await uploadsBtn.click();

            uploadsBtn = await tab.$$("#paper-list #text-item-0")
            await uploadsBtn[0].click()

            await tab.waitForSelector("input[type=file]")
            fileIp = await tab.$$("input[type=file]")
            fileIp = fileIp[0];

        }

        await tab.waitForSelector("ytcp-icon-button[id='close-button']");
        let btn = await tab.$$("ytcp-icon-button[id='close-button']");
        await btn[btn.length - 1].click();

        fs.writeFileSync("result.json", JSON.stringify(linksArr));

        console.log("Task Completed, please view results.json for uploaded video links and sreenshots path")
    } catch (err) {
        console.log(err)
    }

})()