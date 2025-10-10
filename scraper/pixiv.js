const axios = require('axios');
const cheerio = require('cheerio');

async function scrapePixiv(query, page = 1) {
    try {
        const validatedPage = validatePage(page);
        const validatedQuery = validateQuery(query);
        
        const url = `https://litexiv.qunn.link/tags/${encodeURIComponent(validatedQuery)}?p=${validatedPage}`;
        
        console.log(`Scraping URL: ${url}`);
        
        const { data, status, headers } = await axios.get(url, {
            timeout: 15000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            validateStatus: function (status) {
                return status < 500; // Don't throw for 404, but do for 500
            }
        });
        
        console.log(`Response status: ${status}`);
        
        if (status === 404) {
            throw new Error(`No results found for query "${validatedQuery}"`);
        }
        
        if (status !== 200) {
            throw new Error(`Server returned status: ${status}`);
        }
        
        const $ = cheerio.load(data);
        const artworks = [];

        // Check if we got any results
        const noResults = $('body').text().includes('No results found') || 
                         $('.grid.show-author').length === 0;
        
        if (noResults) {
            return {
                success: true,
                query: validatedQuery,
                page: validatedPage,
                results: [],
                count: 0,
                message: 'No artworks found for this query'
            };
        }

        // Select each artwork grid item
        $('.grid.show-author > div').each((i, el) => {
            try {
                const $el = $(el);
                
                // Extract image information
                const thumbnail = $el.find('a.thumbnail');
                const imageElement = thumbnail.find('img');
                const imageSrc = imageElement.attr('src');
                
                if (!imageSrc) {
                    console.log('No image source found for element:', i);
                    return; // Skip this element
                }
                
                // Extract title information
                const titleLink = $el.find('a.title');
                let title = titleLink.find('b').text().trim();
                if (!title) {
                    title = titleLink.attr('title') || 'Untitled';
                }
                
                // Extract author information
                const authorLink = $el.find('a.author');
                const authorName = authorLink.find('.username').text().trim() || 'Unknown Artist';
                const authorAvatar = authorLink.find('img.avatar').attr('src');
                
                const artworkLink = thumbnail.attr('href');
                
                const artwork = {
                    title: title,
                    artist: authorName,
                    artistAvatar: authorAvatar ? `https://litexiv.qunn.link${authorAvatar}` : null,
                    image: transformImageUrl(imageSrc),
                    thumbnail: imageSrc,
                    link: artworkLink ? `https://litexiv.qunn.link${artworkLink}` : null,
                    artworkId: extractArtworkId(artworkLink)
                };
                
                artworks.push(artwork);
                
            } catch (elementError) {
                console.error(`Error processing artwork element ${i}:`, elementError.message);
                // Continue with next element
            }
        });

        console.log(`Found ${artworks.length} artworks for query "${validatedQuery}" on page ${validatedPage}`);
        
        return {
            success: true,
            query: validatedQuery,
            page: validatedPage,
            results: artworks,
            count: artworks.length,
            hasMore: artworks.length > 0
        };
        
    } catch (error) {
        console.error('Pixiv scraping error details:', {
            message: error.message,
            response: error.response?.status,
            url: error.config?.url
        });
        
        if (error.response) {
            throw new Error(`Pixiv server error: ${error.response.status} - ${error.response.statusText}`);
        } else if (error.request) {
            throw new Error('Network error: Could not reach Pixiv server');
        } else {
            throw new Error(`Scraping error: ${error.message}`);
        }
    }
}

// Helper function to transform image URL
function transformImageUrl(url) {
    if (!url) return null;
    
    // Remove proxy prefix if present
    let transformedUrl = url.replace('/proxy/i.pximg.net', 'https://i.pximg.net');
    
    // Transform to higher quality version
    transformedUrl = transformedUrl
        .replace('_square1200', '_master1200')
        .replace('/c/250x250_80_a2/img-master/', '/img-master/')
        .replace('/c/250x250_80_a2/', '/');
    
    return transformedUrl;
}

// Helper function to extract artwork ID from URL
function extractArtworkId(url) {
    if (!url) return null;
    const match = url.match(/\/artworks\/(\d+)/);
    return match ? match[1] : null;
}

// Validation functions
function validatePage(page) {
    const pageNum = parseInt(page);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > 100) {
        return 1;
    }
    return pageNum;
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
