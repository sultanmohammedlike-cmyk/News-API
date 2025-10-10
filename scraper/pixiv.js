const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePixiv(query, page = 1) {
    try {
        const validatedPage = validatePage(page);
        const validatedQuery = validateQuery(query);
        
        const url = `https://litexiv.qunn.link/tags/${encodeURIComponent(validatedQuery)}?p=${validatedPage}`;
        
        console.log(`Scraping URL: ${url}`);
        
        const { data } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
            }
        });
        
        const $ = cheerio.load(data);
        const artworks = [];

        // Select each artwork grid item
        $('.grid.show-author > div').each((i, el) => {
            const $el = $(el);
            
            // Extract image information
            const thumbnail = $el.find('a.thumbnail');
            const imageSrc = thumbnail.find('img').attr('src');
            
            // Extract title information
            const titleLink = $el.find('a.title');
            const title = titleLink.find('b').text().trim() || titleLink.attr('title') || 'Untitled';
            
            // Extract author information
            const authorLink = $el.find('a.author');
            const authorName = authorLink.find('.username').text().trim();
            const authorAvatar = authorLink.find('img.avatar').attr('src');
            
            if (imageSrc) {
                const artwork = {
                    title: title,
                    artist: authorName || 'Unknown Artist',
                    artistAvatar: authorAvatar ? `https://litexiv.qunn.link${authorAvatar}` : null,
                    image: imageSrc.replace('_square1200', '_master1200').replace('/c/250x250_80_a2/', '/'),
                    thumbnail: imageSrc, // Keep original thumbnail
                    link: thumbnail.attr('href') ? `https://litexiv.qunn.link${thumbnail.attr('href')}` : null,
                    artworkId: this.extractArtworkId(thumbnail.attr('href'))
                };
                artworks.push(artwork);
            }
        });

        console.log(`Found ${artworks.length} artworks for query "${validatedQuery}" on page ${validatedPage}`);
        
        return {
            success: true,
            query: validatedQuery,
            page: validatedPage,
            results: artworks,
            count: artworks.length,
            hasMore: artworks.length > 0 // Basic check - you might want to improve this
        };
        
    } catch (error) {
        console.error('Pixiv scraping error:', error.message);
        throw new Error(`Failed to scrape Pixiv: ${error.message}`);
    }
}

// Helper function to extract artwork ID from URL
function extractArtworkId(url) {
    if (!url) return null;
    const match = url.match(/\/artworks\/(\d+)/);
    return match ? match[1] : null;
}

// Validation functions (add these to your scraper file)
function validatePage(page) {
    const pageNum = parseInt(page);
    return (pageNum > 0 && pageNum < 1000) ? pageNum : 1;
}

function validateQuery(query) {
    if (!query || query.trim().length === 0) {
        throw new Error('Query parameter is required');
    }
    if (query.length > 100) {
        throw new Error('Query parameter too long');
    }
    return query.trim();
}

module.exports = scrapePixiv;
