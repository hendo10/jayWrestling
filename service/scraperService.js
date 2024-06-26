const axios = require("axios");
const cheerio = require("cheerio");
const links = require("../input/links");
const testLinks = require("../input/linkTest");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;

class ScraperService {
  async runScraper() {
    try {
      const placements = [];
      const errorUrls = []; // Array to store URLs that caused errors
      const batchSize = 20;
      console.log("scraper starting...");

      for (let i = 0; i < links.length; i += batchSize) {
        const batch = links.slice(i, i + batchSize);

        const batchPlacements = await Promise.all(
          batch.map(async (url) => {
            try {
              const response = await axios.get(url);
              const $ = cheerio.load(response.data);

              const title = $("title").text();
              const titleArray = title.split("-");
              const name = titleArray[0].trimEnd();

              const placeDetails = {
                name: null,
                date: null,
                description: "",
                place: null,
                weight: null,
                source: null,
              };

              $(".list-item-info").each((index, element) => {
                const details = [];
                const description = $(element)
                  .children(":first-child")
                  .text()
                  .trim();
                // Iterate over child div elements and store each item in a constant
                $(element)
                  .children("div")
                  .each((itemIndex, itemElement) => {
                    const itemText = $(itemElement).text().trim();
                    details.push(itemText);
                  });

                const dateObject = new Date(details[2]);
                if (dateObject.getFullYear() === 2024) {
                  placeDetails.name = name;
                  placeDetails.weight = details[0];
                  placeDetails.place = details[1];
                  placeDetails.date = details[2];
                  placeDetails.description = description;
                  placeDetails.source = url;
                  placements.push({ ...placeDetails });
                }
              });

              return placeDetails;
            } catch (error) {
              // Handle the error for the specific URL
              // console.error(`Error for URL ${url}: ${error.message}`);
              errorUrls.push(url);
            }
          })
        );
      }

      const csvWriter = createCsvWriter({
        path: "output.csv",
        header: [
          { id: "name", title: "Name" },
          { id: "date", title: "Date" },
          { id: "description", title: "Description" },
          { id: "place", title: "Place" },
          { id: "weight", title: "Weight" },
          { id: "source", title: "url" },
        ],
      });
      const records = placements.flat();

      await new Promise((resolve, reject) => {
        csvWriter
          .writeRecords(records)
          .then(() => {
            console.log(`CSV file written successfully generated`);
            resolve();
          })
          .catch(reject);
      });

      console.log("Error URLs:", errorUrls); // Log the URLs that caused errors
      console.log("scraper completed...")
      return placements;
    } catch (error) {
      console.error(`Error with scraper: ${error.message}`);
    }
  }
}

module.exports = ScraperService;
