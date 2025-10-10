const axios = require('axios');
const cheerio = require('cheerio');

// Create axios instance with custom configuration
const axiosInstance = axios.create({
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
    }
});

exports.search = async function(query, page = 1) {
    try {
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const response = await axiosInstance.get(
            `https://www.peakpx.com/en/search?q=${query}&page=${page}`
        );
        
        const $ = cheerio.load(response.data);
        const images = [];
        
        $('#list_ul > li.grid').each((index, element) => {
            const image = {};
            image.title = $(element).find('figure > .overflow.title').text().trim();
            image.imageUrl = $(element).find('figure > link[itemprop="contentUrl"]').attr('href');
            images.push(image);
        });
        
        return images;
        
    } catch (error) {
        if (error.response && error.response.status === 403) {
            throw new Error('Cloudflare protection detected. Try using puppeteer method.');
        }
        throw error;
    }
};
