const scraperObject = {
    url: 'https://thefhguide.com/project-9-us-arizona.html',
    fs: require('fs'),
    async scraper(browser) {
        let page = await browser.newPage();
        console.log(`Navigating to ${this.url}...`);
        await page.goto(this.url, {
            waitUntil: 'networkidle2',
            timeout: 0
        });

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
                await newPage.goto(link, {
                    waitUntil: 'networkidle2',
                    timeout: 0
                });
                console.log(`Reading page at ${link}....`);
                let boldAnchors = await newPage.$$eval('a > b', anchors => anchors.map(anchor => anchor.textContent.split(': ')[1]));
                dataObj['nav_name'] = boldAnchors[1];
                let headers = await newPage.$$eval('h3', names => names.map(name => name.textContent.split(': ')[1]));
                dataObj['name'] = headers[0];
                dataObj['section_name'] = headers[1];
                let summary = await newPage.$$eval('h3 ~ :not(span, a, div, br, h3)', elements => elements.map(el => el.outerHTML));
                dataObj['summary'] = summary.join('');
                dataObj['choices'] = await newPage.$$eval('.choice', choices => (
                    choices.map(choice => ({
                        'name': choice.previousElementSibling.innerText.split(/(\n)/gm)[2],
                        'content': {
                            'hidden': Array.from(choice.querySelectorAll('.lk')).map(element => {
                                if (element.nextElementSibling?.tagName === 'DIV') {
                                    let key = element.textContent.toLowerCase();
                                    let value = element.nextElementSibling.innerHTML.replace(/(\r\n\t|\n|\r|\t)/gm, "");
                                    return {
                                        [key]: value
                                    };
                                }
                            }).filter(element => element),
                            'images': Array.from(choice.querySelectorAll('img')).map(image => image.src).filter(
                                source => source.toLowerCase().indexOf("img/doc.png") === -1 &&
                                source.toLowerCase().indexOf("img/vid.png") === -1 &&
                                source.toLowerCase().indexOf("img/inf.png") === -1 &&
                                source.toLowerCase().indexOf("img/d.png") === -1 &&
                                source.toLowerCase().indexOf("img/bolt1.png") === -1 &&
                                source.toLowerCase().indexOf("img/check.png") === -1),
                            'text': Array.from(choice.querySelectorAll('p, ol, h5')).map(element => {
                                if (
                                    (
                                        element.previousElementSibling &&
                                        element.previousElementSibling.innerText !== "Resources" &&
                                        element.previousElementSibling.innerText !== "Review"
                                    ) &&
                                    (element.innerText !== "Resources" && element.innerText !== "Review")
                                ) {
                                    return element.outerHTML.replace(/(\r\n\t|\n|\r|\t)/gm, "");
                                }
                            }).filter(element => element),
                            'resources': Array.from(choice.querySelectorAll('ol')).map(element => {
                                if (
                                    element.previousElementSibling &&
                                    (element.previousElementSibling.innerText === "Resources" || element.previousElementSibling.innerText === "Review")
                                ) {
                                    return Array.from(element.querySelectorAll(':scope > li')).map(listItem => ({
                                        'description': listItem.innerText.split('☆')[0].replace(/(\r\n\t|\n|\r|\t)/gm, ""),
                                        'links': Array.from(listItem.querySelectorAll(':scope > a')).map(anchor => {
                                            return {
                                                'link': anchor.href,
                                                'text': anchor.innerText.trim(),
                                                'type': anchor.querySelector('img')?.src.includes('doc') ? 'document' : 'video',
                                            }
                                        }).filter(anchor => anchor.text)
                                    }));
                                }
                            }).filter(element => element)
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
        this.fs.writeFile('./output/united-states/arizona.json', JSON.stringify(data, null, 4), err => {
            if (err) {
                console.log(err);
            }

            console.log('🎉 file written successfully! 🎉');
        });
        browser.close();
        return data;
    }
}

module.exports = scraperObject;