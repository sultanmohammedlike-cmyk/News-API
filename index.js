const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const axios = require('axios');
// Import your scraper function
const { pirateBay } = require('./scraper/pirateBay');
const { torrent1337x } = require('./scraper/1337x');
const { nyaaSI } = require('./scraper/nyaaSI');
const { yts } = require('./scraper/yts');
const peakpx = require('./scraper/peakpx');
const scrapePixiv = require('./scraper/pixiv');
const getRingtones = require('./scraper/ringtone');
const getGifs = require('./scraper/giphy');
const getStations = require('./scraper/radio');

const app = express();
const port = 3000;

// Enable All CORS Requests
app.use(cors());

app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>The News Api's</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<link href="https://i.imgur.com/38RT99Z.jpg" rel="icon" />
<style>
@import url('https://fonts.googleapis.com/css2?family=Mukta&display=swap');

body {
     font-family: 'Mukta', sans-serif;
     padding: 2rem;
     text-align: center;
     background-color: #111;
     color: #fff;
}
/* Dark mode styles */
 main {
     background-color: #222;
     padding: 2rem;
     border-radius: 8px;
}
 h1, h2, h3, h6 {
     word-wrap: break-word;
     color: #fff;
}
 p {
     color: #ccc;
}
 a {
     color: #999;
}
 a:hover {
     color: #fff;
}
/* Separator */
 .separator {
     margin: 2rem 0;
     height: 1px;
     background-color: #666;
}
/* Allow text selection */
 body {
     -webkit-user-select: text;
     -moz-user-select: text;
     -ms-user-select: text;
     user-select: text;
}
</style>
</head>
<body>
<main>
<h1>Welcome</h1>
<p>Your one-stop solution to access the latest news, search for torrents, get insights from Genius, fetch data from Newscatcher, and more.</p>
<h3>Base URL</h3>
<p>https://news-api-six-navy.vercel.app</p>
<p>https://news-api-czsp.onrender.com</p>
<div class="separator"></div>
<h6>API Endpoints</h6>

<h2>News Category</h2>

<h3>GET /api/news/ann</h3>
<p>Fetches news from AnimeNewsNetwork.</p>

<h3>GET /api/news/inshorts</h3>
<p>Fetches news from Inshorts. Use ?query= to search for news.</p>

<h3>GET /api/news/us-tech</h3>
<p>Fetches top headlines in the technology category from the US.</p>

<h3>GET /api/news/in-tech</h3>
<p>Fetches top headlines in the technology category from India.</p>

<div class="separator"></div>

<h2>Torrents Category</h2>

<h3>GET /api/torrent/piratebay/:query/:page?</h3>
<p>Fetches torrents data from pirateBay. Replace :query with your search query. :page is optional and defaults to 1.</p>

<h3>GET /api/torrent/1337x/:query/:page?</h3>
<p>Fetches torrents data from 1337x. Replace :query with your search query. :page is optional and defaults to 1.</p>

<h3>GET /api/torrent/nyaasi/:query/:page?</h3>
<p>Fetches torrents data from Nyaa.si. Replace :query with your search query. :page is optional and defaults to 1.</p>

<h3>GET /api/torrent/yts/:query/:page?</h3>
<p>Fetches torrents data from YTS. Replace :query with your search query. :page is optional and defaults to 1.</p>

<div class="separator"></div>

<h2>Additional APIs Category</h2>

<h3>GET /api/peakpx/:query/:page?</h3>
<p>Fetches img from peakpx. :page is optional and defaults to 1.</p>

<h3>GET /api/slok/:ch?/:sl?</h3>
<p>Fetches slok from Gita. :ch & :sl is optional and defaults to 1.</p>

<h3>GET /api/genius/:query</h3>
<p>Fetches lyrics from Genius.</p>

<h3>GET /api/ringtone/:query</h3>
<p>Fetches ringtones from MusikRingtone.</p>

<h3>GET /api/memes</h3>
<p>Fetches memes from API.</p>

<h3>GET /api/pixiv/:query/:page?</h3>
<p>Fetches image from PIXIV.</p>

<h3>GET /api/person/:num?</h3>
<p>Fetches random details from API.</p>

<h3>GET /api/giphy/:query/:page?</h3>
<p>Fetches gifs from Giphy.</p>

<h3>GET /api/radio/:page?</h3>
<p>Fetches radio from API.</p>

<h3>GET /api/ifsc/:ifsc</h3>
<p>Fetches bank details from IFSC CODE.</p>

<h3>GET /api/jokes/:query</h3>
<p>Fetches jokes from Chucknorris.</p>
</main>
</body>
</html>
  `);
});

app.get('/api/torrent/piratebay/:query/:page?', createScrapeRoute(pirateBay));
app.get('/api/torrent/1337x/:query/:page?', createScrapeRoute(torrent1337x));
app.get('/api/torrent/nyaasi/:query/:page?', createScrapeRoute(nyaaSI));
app.get('/api/torrent/yts/:query/:page?', createScrapeRoute(yts));

// Generic function to handle scraping requests
function createScrapeRoute(scraperFunction) {
  return async (req, res) => {
    const { query, page = 1 } = req.params;
    try {
      const data = await scraperFunction(query, page);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'An error occurred while scraping torrents data.' });
    }
  };
}

app.get('/api/radio/:page?', async (req, res) => {
  const page = req.params.page || 1;
  try {
    const stations = await getStations(page);
    let data = JSON.stringify(stations, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/giphy/:query/:page?', async (req, res) => {
  const { query, page } = req.params;

  try {
    const gifs = await getGifs(query, page);
    let data = JSON.stringify(gifs, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
});

app.get('/api/ringtone/:query', async (req, res) => {
  const { query } = req.params;

  try {
    const ringtones = await getRingtones(query);
    let data = JSON.stringify(ringtones, null, 2);
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get('/api/person/:num?', async (req, res) => {
  try {
    const num = req.params.num || 1;
    const url = `https://peoplegeneratorapi.live/api/person/${num}`;

    const response = await axios.get(url);
    const prettyJson = JSON.stringify(response.data, null, 2); // This will format the JSON with 2 spaces of indentation

    res.setHeader('Content-Type', 'application/json');
    res.send(prettyJson);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/memes', async (req, res) => {
  try {
    const response = await axios.get('https://api.imgflip.com/get_memes');
    let data = response.data;
    data = JSON.stringify(data, null, 2); // Prettify JSON
    data = data.replace(/\\\//g, '/'); // Replace \/ with /

    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/peakpx/:query/:page?', async (req, res) => {
    const { query, page = 1 } = req.params;

    peakpx.search(query, page)
        .then(images => {
            res.json(images);
        })
        .catch(error => {
            console.error('Error:', error);
            res.status(500).json({ message: 'An error occurred while fetching peakpx images.' });
        });
});

app.get('/api/pixiv/:query/:page?', async (req, res) => {
    const { query, page } = req.params;
    try {
        const artworks = await scrapePixiv(query, page);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes cache
        res.json(artworks);
    } catch (error) {
        console.error('Pixiv API error:', error);
        res.status(500).json({ 
            error: error.message,
            success: false 
        });
    }
});

app.get('/api/slok/:ch?/:sl?', async (req, res) => {
    const chapter = req.params.ch || '1';
    const sloka = req.params.sl || '1';
    try {
        const response = await axios.get(`https://bhagavadgitaapi.in/slok/${chapter}/${sloka}`);
        const prettyJson = JSON.stringify(response.data, null, 2); // This will format the JSON with 2 spaces of indentation
        res.setHeader('Content-Type', 'application/json');
        res.send(prettyJson);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Server error');
    }
});

app.get('/api/jokes/:query', async (req, res) => {
  try {
    const response = await axios.get(`https://api.chucknorris.io/jokes/search?query=${req.params.query}`);
    const prettyJson = JSON.stringify(response.data, null, 2); // This will format the JSON with 2 spaces of indentation
    res.setHeader('Content-Type', 'application/json');
    res.send(prettyJson);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/ifsc/:ifsc', async (req, res) => {
  try {
    const ifsc = req.params.ifsc;
    const url = `https://bank-apis.justinclicks.com/API/V1/IFSC/${ifsc}`;

    const response = await axios.get(url);
    const prettyJson = JSON.stringify(response.data, null, 2); // This will format the JSON with 2 spaces of indentation

    res.setHeader('Content-Type', 'application/json');
    res.send(prettyJson);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.get('/api/genius/:query', async (req, res) => {
  const { query } = req.params;
  try {
    const response = await fetch(`https://genius.com/api/search/multi?per_page=1&q=${query}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'An error occurred while fetching data from Genius.' });
  }
});

const fetchNews = (category, country, res) => {
  fetch(`https://saurav.tech/NewsAPI/top-headlines/category/${category}/${country}.json`)
    .then(response => response.json())
    .then(data => res.json(data))
    .catch(err => res.status(500).json({ error: err.toString() }));
};

app.get('/api/news/us-tech', (req, res) => {
  fetchNews('technology', 'us', res);
});

app.get('/api/news/in-tech', (req, res) => {
  fetchNews('technology', 'in', res);
});

app.get('/api/news/:source', async (req, res) => {
  const { source } = req.params;
  const { query } = req.query; 

  const sourceToUrlMap = {
    ann: 'https://api.fl-anime.com/news/ann/recent-feeds',
    inshorts: query 
        ? `https://inshorts.vercel.app/news/search?query=${query}&offset=0&limit=10`
        : 'https://inshorts.vercel.app/news/all?offset=0&limit=10'
  };

  if (!sourceToUrlMap.hasOwnProperty(source)) {
    return res.status(400).send('Invalid source');
  }

  try {
    const response = await fetch(sourceToUrlMap[source]);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Server error');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});

module.exports = app;
