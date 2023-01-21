import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://thefhguide.com/');

    const dropdownLinks = await page.evaluate(() => (
        Array.from(document.querySelectorAll('.nav-item.dropdown')).map((dropdown) => ({
            'name': dropdown.querySelector('.nav-link').innerText.trim(),
            'links': Array.from(dropdown.querySelectorAll('.dropdown-menu > a')).filter(({innerHTML}) => innerHTML !== "<hr>").map(({href}) => href)
        }))
    ));

    const partners = [...dropdownLinks.splice(1,4)];

    await browser.close();
})();