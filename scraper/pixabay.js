const axios = require('axios');

class PixabayScraper {
    constructor(apiKey = '43436962-2f637a7010cb24edd3bd62fc2') {
        this.apiKey = apiKey;
        this.baseURL = 'https://pixabay.com/api/';
    }

    async search(query, page = 1, perPage = 20, options = {}) {
        try {
            const params = {
                key: this.apiKey,
                q: encodeURIComponent(query),
                page: page,
                per_page: perPage,
                safesearch: options.safesearch !== false ? 'true' : 'false',
                image_type: options.image_type || 'all',
                orientation: options.orientation || 'all',
                category: options.category || '',
                min_width: options.min_width || 0,
                min_height: options.min_height || 0,
                colors: options.colors || '',
                editors_choice: options.editors_choice || false,
                order: options.order || 'popular',
                pretty: options.pretty || false
            };

            // Remove empty parameters
            Object.keys(params).forEach(key => {
                if (params[key] === '' || params[key] === 0 || params[key] === false) {
                    delete params[key];
                }
            });

            console.log(`Searching Pixabay for: "${query}" - Page: ${page}`);

            const response = await axios.get(this.baseURL, {
                params: params,
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.data.hits) {
                throw new Error('Invalid response from Pixabay API');
            }

            const images = this.transformResponse(response.data, query, page);
            
            console.log(`Found ${images.length} images for "${query}" on page ${page}`);
            
            return {
                success: true,
                query: query,
                page: page,
                total: response.data.totalHits,
                totalPages: Math.ceil(response.data.totalHits / perPage),
                results: images,
                count: images.length
            };

        } catch (error) {
            console.error('Pixabay API error:', error.message);
            
            if (error.response) {
                throw new Error(`Pixabay API error: ${error.response.status} - ${error.response.statusText}`);
            } else if (error.request) {
                throw new Error('Network error: Could not reach Pixabay API');
            } else {
                throw new Error(`Search error: ${error.message}`);
            }
        }
    }

    transformResponse(data, query, page) {
        return data.hits.map(image => ({
            id: image.id,
            title: image.tags || 'Untitled',
            description: image.tags ? `Image of ${image.tags.split(',').slice(0, 3).join(', ')}` : 'No description',
            imageUrl: image.largeImageURL || image.webformatURL,
            previewUrl: image.previewURL,
            webFormatUrl: image.webformatURL,
            fullHDUrl: image.fullHDURL || image.largeImageURL,
            thumbnail: image.previewURL,
            user: image.user,
            user_id: image.user_id,
            userImage: image.userImageURL || `https://cdn.pixabay.com/user/${image.user_id}.png`,
            likes: image.likes,
            downloads: image.downloads,
            views: image.views,
            comments: image.comments,
            favorites: image.favorites,
            tags: image.tags ? image.tags.split(',') : [],
            type: image.type,
            dimensions: {
                width: image.imageWidth,
                height: image.imageHeight,
                ratio: (image.imageWidth / image.imageHeight).toFixed(2)
            },
            size: this.formatBytes(image.imageSize),
            source: 'Pixabay',
            pageURL: image.pageURL,
            collections: image.collections,
            searchQuery: query,
            searchPage: page
        }));
    }

    formatBytes(bytes) {
        if (!bytes) return 'Unknown';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    // Additional methods for different search types
    async searchPhotos(query, page = 1, perPage = 20) {
        return this.search(query, page, perPage, { image_type: 'photo' });
    }

    async searchIllustrations(query, page = 1, perPage = 20) {
        return this.search(query, page, perPage, { image_type: 'illustration' });
    }

    async searchVectors(query, page = 1, perPage = 20) {
        return this.search(query, page, perPage, { image_type: 'vector' });
    }

    async searchByCategory(category, page = 1, perPage = 20) {
        const categories = {
            'backgrounds': 'backgrounds',
            'fashion': 'fashion',
            'nature': 'nature',
            'science': 'science',
            'education': 'education',
            'feelings': 'feelings',
            'health': 'health',
            'people': 'people',
            'religion': 'religion',
            'places': 'places',
            'animals': 'animals',
            'industry': 'industry',
            'computer': 'computer',
            'food': 'food',
            'sports': 'sports',
            'transportation': 'transportation',
            'travel': 'travel',
            'buildings': 'buildings',
            'business': 'business',
            'music': 'music'
        };

        if (!categories[category]) {
            throw new Error(`Invalid category. Available categories: ${Object.keys(categories).join(', ')}`);
        }

        return this.search('', page, perPage, { category: categories[category] });
    }

    async getPopular(page = 1, perPage = 20) {
        return this.search('', page, perPage, { order: 'popular' });
    }

    async getLatest(page = 1, perPage = 20) {
        return this.search('', page, perPage, { order: 'latest' });
    }

    async getEditorsChoice(page = 1, perPage = 20) {
        return this.search('', page, perPage, { editors_choice: true });
    }
}

// Create instance with your API key
const pixabay = new PixabayScraper('43436962-2f637a7010cb24edd3bd62fc2');

module.exports = pixabay;
