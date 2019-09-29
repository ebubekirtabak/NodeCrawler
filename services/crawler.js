const request = require('request');
const cheerio = require('cheerio');
const event = require("events");

const eventEmitter = new event.EventEmitter();
let urlList = [];
let historyUrlList = [];
let foundList = [];
let urlIndex = -1;
let startUrl = '';
let options = {};
class Crawler {

    constructor(startUrl, options) {
        this.options = options;
    }

    refreshParameters() {
        urlIndex = -1;
        foundList = [];
        historyUrlList = [];
        urlList = [];
    }
    startCrawler(url) {
        return new Promise((resolve, reject) => {
            this.refreshParameters();
            startUrl = url;
            this.crawPageByUrl(startUrl);
            eventEmitter.on("crawlerOnSuccess", () => {
                const result = { foundList: foundList, resultCounter: historyUrlList.length };
                resolve(result);
            });
        });
    }

    crawPageByUrl(url) {
        if (urlIndex >= 0 && urlIndex < urlList.length) {
            let path = urlList[urlIndex];
            while (historyUrlList.indexOf(path) >= 0) {
                urlIndex += 1;
                path = urlList[urlIndex];
            }
            url += path
        }

        console.log(urlIndex + ". Loading: " + url + ' / ' + urlList.length);

        this.crawElementFromWebPage(url)
        .then((result) => {
            result.forEach((item) => {
                if (urlList.indexOf(item) === -1) {
                    urlList = [...urlList, item];
                }
            });
            if ((urlIndex + 1) < urlList.length) {
                urlIndex += 1;
                historyUrlList = [...historyUrlList, url];
                this.crawPageByUrl(startUrl);
            } else {
                eventEmitter.emit('crawlerOnSuccess');
            }
        }).catch((error) => {
            console.log(error)
        });
    }

    isSafeContent(contentType) {
        const disabledContentTypes = ['application/pdf'];
        if (disabledContentTypes.indexOf(contentType) < 0) {
            return true;
        } else {
            return false;
        }
    }

    isSafeUrl(url) {
        const filterKeywords = [
            'http://', 'https://', '#', '~/', '/-/', 'mailto:', 'tel:', '.pdf', 'javascript:', null, undefined, 'undefined',
            'https:', 'mailto:' ,'\”mailto:'
        ];
        let isSafe = true;

        for (let i = 0; i < filterKeywords.length; ++i) {
            if (url.startsWith(filterKeywords[i])) {
                isSafe = false;
            }
        }

        return isSafe;
    }

    crawElementFromWebPage(URL) {
        const self = this;
        return new Promise((resolve, reject) => {
            request(URL, function (err, res, body) {
                const { headers } = res;
                if(err) {
                    console.log(err);
                    reject(err);
                } else if (headers !== undefined && self.isSafeContent(headers['content-type'] || '')){
                    let urlList = [];
                    const filterItems = ['#', 'javascript:void(0)', '/', undefined, 'undefined'];
                    let $ = cheerio.load(body);
                    const bodyElement = $('body');
                    self.searchKeywordInElements(URL, bodyElement, $);
                    $('a').each(function(index){
                        const href = $(this).attr('href');
                        urlList = [...urlList, href];
                    });
                    urlList = urlList.map(url => {
                        if (filterItems.indexOf(url) < 0 && new Crawler().isSafeUrl(url)) {
                            return url;
                        }
                    });
                    resolve(urlList);
                } else {
                    resolve([]);
                }
            });
        });
    }

    searchKeywordInElements(URL, bodyElement, $) {
        const self = this;
        bodyElement.each(function (index) {
            const elementText = $(this).textContent || $(this).text();
            const { keyword } = self.options;
            const keywordIndex = elementText.search(keyword) || elementText.toLowerCase().search(keyword.toLowerCase());
            if (keywordIndex >= 0) {
                const foundItemIndex = foundList.findIndex(item => item.url === URL);
                let summary = elementText.substring((keywordIndex - 80), 120);
                summary = summary.replace(/<[^>]*>/g, "")
                    .replace(`/\${keyword}/g`, `<span style="background-color: yellow; color: black;">${keyword}</span>`);
                if (foundItemIndex < 0) {
                    foundList = [...foundList, {
                        url: URL,
                        keyword: keyword,
                        elements: [{
                            html: $(this).html() || '',
                            summary: summary,
                            points: [keywordIndex, (keywordIndex + keyword.length)]
                        }]
                    }];
                } else {
                    const { elements } = foundList[foundItemIndex];
                    foundList[foundItemIndex].elements = [
                        ...elements,
                        {
                            html: $(this).html() || '',
                            summary: summary,
                            points: [keywordIndex, (keywordIndex + keyword.length)]
                        }
                    ];
                }
            }
        });
    }
}

module.exports = { Crawler };
