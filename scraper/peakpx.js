const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');

exports.search = function(query, page = 1) {
    return new Promise((resolve, reject) => {
        const url = `https://www.peakpx.com/en/search?q=${query}&page=${page}`;
        
        console.log(`Scraping PeakPX: ${url}`);
        
        cloudscraper.get({
            url: url,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
            }
        }).then(html => {
            const $ = cheerio.load(html);
            const images = [];
            
            console.log('Successfully bypassed Cloudflare');
            
            $('#list_ul > li.grid').each((index, element) => {
                try {
                    const image = {};
                    image.title = $(element).find('figure > .overflow.title').text().trim();
                    image.imageUrl = $(element).find('figure > link[itemprop="contentUrl"]').attr('href');
                    
                    // Add additional image information if available
                    const imgElement = $(element).find('figure img');
                    if (imgElement.length) {
                        image.thumbnail = imgElement.attr('src');
                        image.alt = imgElement.attr('alt') || image.title;
                    }
                    
                    // Add image dimensions if available
                    const dimensions = $(element).find('.resolution').text().trim();
                    if (dimensions) {
                        image.dimensions = dimensions;
                    }
                    
                    if (image.imageUrl) {
                        images.push(image);
                    }
                } catch (error) {
                    console.error(`Error processing image ${index}:`, error.message);
                    // Continue with next image
                }
            });
            
            console.log(`Found ${images.length} images for query "${query}"`);
            resolve(images);
        }).catch(error => {
            console.error('Cloudscraper error:', error);
            reject(new Error(`Failed to scrape PeakPX: ${error.message}`));
        });
    });
};
