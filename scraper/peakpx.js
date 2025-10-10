const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

// Global browser instance to avoid launching browser for every request
let browserInstance = null;

async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-blink-features=AutomationControlled',
                '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                '--window-size=1920,1080'
            ],
            ignoreHTTPSErrors: true
        });
        
        // Clean up browser on process exit
        process.on('exit', async () => {
            if (browserInstance) {
                await browserInstance.close();
            }
        });
    }
    return browserInstance;
}

exports.search = async function(query, page = 1) {
    let browser;
    let pageInstance;
    
    try {
        browser = await getBrowser();
        pageInstance = await browser.newPage();
        
        // Set realistic viewport
        await pageInstance.setViewport({ width: 1920, height: 1080 });
        
        // Set user agent
        await pageInstance.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Block images and other resources to speed up loading
        await pageInstance.setRequestInterception(true);
        pageInstance.on('request', (req) => {
            if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });
        
        const url = `https://www.peakpx.com/en/search?q=${encodeURIComponent(query)}&page=${page}`;
        console.log(`Scraping PeakPX with Puppeteer: ${url}`);
        
        // Navigate to the page with longer timeout
        await pageInstance.goto(url, { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for the content to load
        try {
            await pageInstance.waitForSelector('#list_ul li.grid', { 
                timeout: 15000 
            });
        } catch (waitError) {
            console.log('Content not found, checking if blocked...');
            
            // Check if we're blocked by Cloudflare
            const pageContent = await pageInstance.content();
            if (pageContent.includes('Cloudflare') || pageContent.includes('cf-ray')) {
                throw new Error('Cloudflare blocking detected');
            }
            
            // If no content found but not blocked, return empty results
            return [];
        }
        
        // Extract data
        const images = await pageInstance.evaluate(() => {
            const items = [];
            const elements = document.querySelectorAll('#list_ul > li.grid');
            
            elements.forEach(element => {
                try {
                    const titleEl = element.querySelector('figure > .overflow.title');
                    const imageUrlEl = element.querySelector('figure > link[itemprop="contentUrl"]');
                    const imgElement = element.querySelector('figure img');
                    
                    if (imageUrlEl) {
                        const image = {
                            title: titleEl ? titleEl.textContent.trim() : 'Untitled',
                            imageUrl: imageUrlEl.getAttribute('href'),
                            thumbnail: imgElement ? imgElement.getAttribute('src') : null,
                            alt: imgElement ? imgElement.getAttribute('alt') : null
                        };
                        
                        // Add dimensions if available
                        const dimensionsEl = element.querySelector('.resolution');
                        if (dimensionsEl) {
                            image.dimensions = dimensionsEl.textContent.trim();
                        }
                        
                        items.push(image);
                    }
                } catch (error) {
                    console.error('Error processing element:', error);
                }
            });
            
            return items;
        });
        
        console.log(`Found ${images.length} images for query "${query}" on page ${page}`);
        return images;
        
    } catch (error) {
        console.error('Puppeteer scraping error:', error.message);
        
        // Close the page instance on error
        if (pageInstance && !pageInstance.isClosed()) {
            await pageInstance.close().catch(e => console.error('Error closing page:', e));
        }
        
        throw new Error(`Failed to scrape PeakPX: ${error.message}`);
    } finally {
        // Always close the page instance
        if (pageInstance && !pageInstance.isClosed()) {
            await pageInstance.close().catch(e => console.error('Error closing page:', e));
        }
    }
};

// Function to close browser (useful for cleanup)
exports.closeBrowser = async function() {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
};
