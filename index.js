import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://thefhguide.com/');

    const dropdownLinks = await page.evaluate(() => {
        const dropdowns = Array.from(document.querySelectorAll('.nav-item.dropdown'));
        return dropdowns.map((dropdown) => ({
            'name': dropdown.querySelector('.nav-link').innerText.trim(),
            'links': Array.from(dropdown.querySelectorAll('.dropdown-menu > a')).map(link => ( link.href ))
        }))
    });

    console.log(dropdownLinks);

    await browser.close();
})();