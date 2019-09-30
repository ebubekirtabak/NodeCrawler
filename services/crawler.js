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
        eventEmitter.setMaxListeners(0);
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
                resolve(JSON.stringify(result));
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

    getFileType(url) {
        try {
            const matches = url.match(/\.\w{3,4}($|\?)/);
            if (matches === null) {
                return '';
            }

            return matches[0];
        } catch(err) {
            console.log(err);
            return '';
        }
    }

    crawElementFromWebPage(URL) {
        const self = this;
        return new Promise((resolve, reject) => {
            request(URL, function (err, res, body) {
                if (!err && res) {
                    const { headers } = res;
                    if (headers !== undefined && self.isSafeContent(headers['content-type'] || '')){
                        let urlList = [];
                        const filterItems = ['#', 'javascript:void(0)', '/', undefined, 'undefined'];
                        const filterFiles = ['.jpg', '.png', '.pdf'];
                        let $ = cheerio.load(body);
                        const bodyElement = $('body');
                        self.searchKeywordInElements(URL, bodyElement, $);
                        $('a').each(function(index){
                            const href = $(this).attr('href');
                            if (href !== undefined) {
                                urlList = [...urlList, href];
                            }
                        });
                        urlList = urlList.filter(url => {
                            if (filterFiles.indexOf(self.getFileType(url)) < 0 &&
                                filterItems.indexOf(url) < 0 && new Crawler().isSafeUrl(url)) {
                                return url;
                            }
                        });
                        resolve(urlList);
                    } else {
                        resolve([]);
                    }
                } else {
                    console.log(err);
                    resolve([]);
                }
            });
        });
    }

    searchKeywordInElements(URL, bodyElement, $) {
        const self = this;
        bodyElement.each(function (index) {
            let elementText = $(this).textContent || $(this).text();
            elementText.replace(/<[^>]*>/g, "")
                .replace(/[\r\n\t]+(.+[\r\n\t]+.+)[\t\r\n]+/g, '');
            const { keyword } = self.options;
            const keywordIndex = elementText.search(keyword) || elementText.toLowerCase().search(keyword.toLowerCase());
            if (keywordIndex >= 0) {
                const foundItemIndex = foundList.findIndex(item => item.url === URL);
                let summary = elementText.substring((keywordIndex - 80), (keywordIndex + 80));
                summary = summary.replace(/<[^>]*>/g, "")
                    .replace(/[\r\n\t]+(.+[\r\n\t]+.+)[\t\r\n]+/g, '')
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
