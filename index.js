import puppeteer from "puppeteer";

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto('https://thefhguide.com/');

    const dropdownNames = await page.evaluate(() => {
        const dropdowns = Array.from(document.querySelectorAll('.nav-item.dropdown'));
        return dropdowns.map(dropdown => {
            const name = dropdown.querySelector('.nav-link').innerText.trim();
            return name;
        });
    },);

    console.log(dropdownNames);

    await browser.close();
})();