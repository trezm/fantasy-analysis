
const axios = require('axios');
const cheerio = require('cheerio');
const chartjs = require('chartjs');
const QUERY_TYPE = {
    Passing: 'P',
    Rushing: 'R',
    Scoring: 'S',
    Receiving: 'C'
};
0;

/**
 * @param {number} year - The year four digit year
 * @param {QueryType} queryType - The query type, i.e. Passing, Rushing, etc.
 * @param {number?} limit - The limit, defaults to 100
 * @returns {string} the fully qualified url string to search by
 */
function createUrlString(year, queryType, limit=100) {
    return `https://www.footballdb.com/stats/stats.html?lg=NFL&yr=${year}&type=reg&mode=${queryType}&conf=&limit=${limit}`
}

/**
 * @param {string} html - The html to parse
 * @returns {Data[]} an array of players from the parsed string
 */
function parseHtmlForPlayers(html) {
    const $ = cheerio.load(html);

    // This is the dumbest map function I've ever seen, honestly, index first???
    const keys = $('thead tr th').map((i, el) =>
        /* This is not a link */ el.children[0].data ||
        /* this is a link */ el.children[0].children[0].data);

    const data = [];
    const rows = Array.from($('tbody tr'));

    rows.forEach((row) => {
        const cells = Array.from($('td', row));

        const datum = {};
        cells.forEach((el, i) => {
            datum[keys[i]] =
                /* This is not a link */ el.children[0].data ||
                /* this is a link */ el.children[0].children[0].data ||
                /* honestly, I don't even know */ el.children[0].children[0].children[0].data;
            });

        data.push(datum);
    });

    return data;
}
async function getData(year, queryType) {
    const results = await axios.get(createUrlString(year, queryType));
    return parseHtmlForPlayers(results.data);
}

async function checkReddit(name, searchTerm) {
    const results = await axios.get(`https://www.reddit.com/search/.json?q=${encodeURIComponent(`${name} ${searchTerm}`)}&t=year&limit=100&type=link&sort=new`);

    return results.data.data.dist;
}

async function redditVsPassing(searchTerm, year=2017) {
    const dataPoints = [];

    const passing = await getData(year, QUERY_TYPE.Passing);
    for (let i = 0; i < passing.length; i++) {
        const passer = passing[i];

        const redditCount = await checkReddit(searchTerm, passer.Player);
        dataPoints.push({
            x: passer.TD,
            y: redditCount
        });
    }

    return dataPoints;
}

async function redditVsRushing(searchTerm, year=2017) {
    const dataPoints = [];

    const rushing = await getData(year, QUERY_TYPE.Rushing);
    for (let i = 0; i < rushing.length; i++) {
        const rusher = rushing[i];

        const redditCount = await checkReddit(rusher.Player, searchTerm);
        dataPoints.push({
            x: rusher.TD,
            y: redditCount
        });
    }

    return dataPoints;
}

async function receivingVsPassing(year=2016) {
    const passing = await getData(year, QUERY_TYPE.Passing);
    const receiving = await getData(year, QUERY_TYPE.Receiving);

    const teams = {};
    const dataPoints = [];
    passing.forEach((passer) => {
        const teamBucket = teams[passer.Team] || {};

        if ((teamBucket.passingTD || 0) < Number(passer.TD)) {
            teamBucket.passingTD = passer.TD;
            teamBucket.passerName = passer.Player;
        }

        teams[passer.Team] = teamBucket;
    });

    receiving.forEach((receiver) => {
        const passer = teams[receiver.Team] || {};

        dataPoints.push({ x: Number(receiver.TD), y: Number(passer.passingTD) });
    });

    return dataPoints;
}

async function rushingVsPassing(year=2016) {
    const passing = await getData(year, QUERY_TYPE.Passing);
    const rushing = await getData(year, QUERY_TYPE.Rushing);

    const teams = {};
    const dataPoints = [];
    passing.forEach((passer) => {
        const teamBucket = teams[passer.Team] || {};

        if ((teamBucket.passingTD || 0) < Number(passer.TD)) {
            teamBucket.passingTD = passer.TD;
            teamBucket.passerName = passer.Player;
        }

        teams[passer.Team] = teamBucket;
    });

    rushing.forEach((rusher) => {
        const passer = teams[rusher.Team] || {};

        dataPoints.push({ x: Number(rusher.TD), y: Number(passer.passingTD) });
    });

    return dataPoints;
}

module.exports = {
    receivingVsPassing,
    rushingVsPassing,
    redditVsPassing,
    redditVsRushing
}
