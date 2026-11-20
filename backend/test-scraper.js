const {scrapeWebsite, fetchPageContent} = require('./services/scraper.service');

async function testScraper() {
  try {
    const result = await scrapeWebsite("https://cursor.com");
    const resultOfFetchPageContent = await fetchPageContent("https://cursor.com/product");
    console.log("Scraping Result:", result);
    console.log("Fetch Page Content Result:", resultOfFetchPageContent);
  } catch (error) {
    console.error("Error during scraping:", error.message);
  }
}

testScraper();