const axios = require("axios");
const cheerio = require("cheerio");

function filterRelevantLinks(links, websiteUrl) {
  const baseUrl = new URL(websiteUrl);
  const seenUrls = new Set();

  const keywords = [
    "about",
    "product",
    "service",
    "solution",
    "pricing",
    "feature",
    "company",
    "technology",
  ];

  return links.filter((link) => {
    const url = new URL(link.url);

    if (url.hostname !== baseUrl.hostname) {
      return false;
    }

    if (seenUrls.has(url.href)) {
      return false;
    }

    seenUrls.add(url.href);

    return keywords.some((keyword) =>
      `${link.text} ${url.pathname}`.toLowerCase().includes(keyword),
    );
  });
}

async function fetchPageContent(websiteUrl) {
  try {
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
    });
    const html = response.data;
    const $ = cheerio.load(html);

    $("script, style, noscript, iframe").remove();

    const headings = $("h2")
      .map((index, element) => $(element).text().trim())
      .get();
    const paragraphs = $("p")
      .map((index, element) => $(element).text().trim())
      .get();

    const uniqueHeadings = [...new Set(headings)];

    const cleanParagraphs = paragraphs.filter((paragraph) => {
      return paragraph.trim().length > 0;
    });

    const uniqueParagraphs = [...new Set(cleanParagraphs)];

    return {
      websiteUrl,
      paragraphs: uniqueParagraphs,
      headings: uniqueHeadings,
    };
  } catch (error) {
    throw new Error(`Page scraping failed: ${error.message}`);
  }
}

async function scrapeWebsite(websiteUrl) {
  try {
    const parsedUrl = new URL(websiteUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      throw new Error("Invalid URL protocol. Only HTTP and HTTPS are allowed.");
    }
    const response = await axios.get(websiteUrl, {
      timeout: 10000,
    });

    const html = response.data;
    const $ = cheerio.load(html);

    $("script, style, noscript, iframe").remove();

    const title = $("title").text().trim();
    const headings = $("h1")
      .map((index, element) => $(element).text().trim())
      .get();
    const paragraphs = $("p")
      .map((index, element) => $(element).text().trim())
      .get();
    const description = $('meta[name="description"]').attr("content") || "";
    const links = [];

    $("a").each((index, element) => {
      const text = $(element).text().trim();
      const href = $(element).attr("href");

      if (!href) return;

      try {
        const absoluteUrl = new URL(href, websiteUrl).href;

        links.push({
          text,
          url: absoluteUrl,
        });
      } catch (error) {}
    });

    const relevantLinks = filterRelevantLinks(links, websiteUrl);
    const pagePromises = relevantLinks.map((link) => {
      return fetchPageContent(link.url);
    });

    const results = await Promise.allSettled(pagePromises);

    const pages = results
      .filter((result) => result.status === "fulfilled")
      .map((result) => {
        return result.value;
      });

    return {
      websiteUrl,
      title,
      description,
      links,
      relevantLinks,
      headings,
      paragraphs,
      pages,
    };
  } catch (error) {
    console.error("Website scraping failed:", error.message);
  }
}

module.exports = { scrapeWebsite, fetchPageContent };
