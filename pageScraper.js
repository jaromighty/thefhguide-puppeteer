const scraperObject = {
    url: 'https://www.thefhguide.com/project-1-family-tree.html',
    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url);

        let scrapedData = [];

        async function scrapeCurrentPage() {
            await page.waitForSelector('#goals');
            let urls = await page.$$eval('#goals a', links => {
                links = links.filter(link => link.innerText.includes(':'));
                links = links.map(el => el.href);
                return links;
            });

            let pagePromise = link => new Promise(async (resolve, reject) => {
                let dataObj = {};
                let newPage = await browser.newPage();
                await newPage.goto(link);
                console.log(`Navigating to ${link}....`);
                dataObj['name'] = await newPage.$eval('h3', text => text.textContent);
                dataObj['choices'] = await newPage.$$eval('.choice', choices => (
                    choices.map(choice => choice.innerHTML.replace(/(\r\n\t|\n|\r|\t)/gm, ""))
                ));
                resolve(dataObj);
                await newPage.close();
            });

            for (link in urls) {
                let currentPageData = await pagePromise(urls[link]);
                scrapedData.push(currentPageData);
            }

            await page.close();
            return scrapedData;
        }

        let data = await scrapeCurrentPage();
        console.log(data);
        browser.close();
        return data;
    }
}

module.exports = scraperObject;