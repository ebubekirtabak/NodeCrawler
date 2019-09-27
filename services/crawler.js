const request = require('request');
const cheerio = require('cheerio');
let urlList = [];
let historyUrlList = [];
let urlIndex = 0;
let startUrl = '';
class Crawler {

    constructor(startUrl) {

    }

    startCrawler(url) {
        startUrl = url;
        this.crawPageByUrl(startUrl);
    }

    crawPageByUrl(url) {
        if (urlIndex > 0) {
            let path = urlList[urlIndex];
            do  {
                urlIndex += 1;
                path = urlList[urlIndex];
            } while (historyUrlList.indexOf(path) >= 0);
            url += path
        }

        console.log(urlIndex + ". Loading: " + url);

        new Crawler().crawElementFromWebPage(url)
        .then((result) => {
            result.forEach((item) => {
                if (urlList.indexOf(item) === -1) {
                    urlList = [...urlList, item];
                }
            });
            urlIndex += 1;
            this.crawPageByUrl(startUrl);
        }).catch((error) => {
            console.log(error)
        });
    }

    crawElementFromWebPage(URL) {
        return new Promise((resolve, reject) => {
            request(URL, function (err, res, body) {
                if(err) {
                    console.log(err);
                    reject(err);
                } else {
                    let urlList = [];
                    const filterItems = ['#', 'javascript:void(0)', '/'];
                    let $ = cheerio.load(body);
                    $('a').each(function(index){
                        const href = $(this).attr('href');
                        urlList = [...urlList, href];
                    });
                    urlList = urlList.map(url => {
                        if (url && filterItems.indexOf(url) < 0
                            && !url.startsWith('http://')
                            && !url.startsWith('https://')
                            && !url.startsWith('#')
                            && !url.startsWith('~/')
                            && !url.startsWith('/-/')
                            && !url.startsWith('mailto:')
                            && !url.startsWith('tel:')
                            && !url.endsWith('.pdf')) {
                            return url;
                        }
                    });
                    resolve(urlList);
                }
            });
        });
    }
}

module.exports = { Crawler };
