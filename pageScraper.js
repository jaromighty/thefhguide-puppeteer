const scraperObject = {
    url: 'https://www.thefhguide.com/project-1-family-tree.html',
    fs: require('fs'),
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
                let boldAnchors = await newPage.$$eval('a > b', anchors => anchors.map(anchor => anchor.textContent.split(': ')[1]));
                dataObj['nav_name'] = boldAnchors[1];
                let headers = await newPage.$$eval('h3', names => names.map(name => name.textContent.split(': ')[1]));
                dataObj['name'] = headers[0];
                dataObj['section_name'] = headers[1];
                let summary = await newPage.$$eval('h3 ~ :not(span, a, div, br, h3)', elements => elements.map(el => el.outerHTML));
                dataObj['summary'] = summary.toString();
                dataObj['choices'] = await newPage.$$eval('.choice', choices => (
                    choices.map(choice => ({
                        'name': choice.previousElementSibling.innerText.split(/(\n)/gm)[2],
                        'content': {
                            'summary': choice.querySelector('.lk + div') ? choice.querySelector('.lk + div').innerHTML.replace(/(\r\n\t|\n|\r|\t)/gm, "") : null,
                            'images': Array.from(choice.querySelectorAll('img')).map(image => image.src).filter(source => source !== "https://www.thefhguide.com/img/doc.png" && source !== "https://www.thefhguide.com/img/vid.png" && source !== "https://www.thefhguide.com/img/inf.png"),
                            'full': choice.innerHTML.replace(/(\r\n\t|\n|\r|\t)/gm, "")
                        }
                    }))
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
        this.fs.writeFile('./output/familysearch/project2.json', JSON.stringify(data, null, 4), err => {
            if (err) {
                console.log(err);
            }

            console.log('file written successfully!');
        });
        browser.close();
        return data;
    }
}

module.exports = scraperObject;