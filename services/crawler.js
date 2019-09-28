const request = require('request');
const cheerio = require('cheerio');
let urlList = [];
let historyUrlList = [];
let foundList = [];
let urlIndex = -1;
let startUrl = '';
class Crawler {

    constructor(startUrl) {

    }

    startCrawler(url) {
        startUrl = url;
        this.crawPageByUrl(startUrl);
    }

    crawPageByUrl(url) {
        if (urlIndex >= 0 && urlIndex < urlList.length) {
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
                historyUrlList = [...historyUrlList, url];
            this.crawPageByUrl(startUrl);
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
        const filterKeywords = ['http://', 'https://', '#', '~/', '/-/', 'mailto:', 'tel:', '.pdf', 'javascript:', undefined, 'undefined'];
        let isSafe = true;
        if (!url) {
            return false;
        }

        for (let i = 0; i < filterKeywords.length; ++i) {
            if (url.startsWith(filterKeywords[i])) {
                isSafe = false;
        }
        }

        return isSafe;
    }

    crawElementFromWebPage(URL) {
        return new Promise((resolve, reject) => {
            request(URL, function (err, res, body) {
                const { headers } = res;
                if(err) {
                    console.log(err);
                    reject(err);
                } else if (headers !== undefined && new Crawler().isSafeContent(headers['content-type'] || '')){
                    let urlList = [];
                    const filterItems = ['#', 'javascript:void(0)', '/', undefined, 'undefined'];
                    let $ = cheerio.load(body);
                    $("*").each(function (index) {
                        const elementText = $(this).text();
                        const keywordIndex = elementText.toString().toLowerCase().search('IoT');
                        if (keywordIndex >= 0) {
                            foundList = [...foundList, {
                                url: URL,
                                element: $(this),
                                startIndex: keywordIndex
                            }];
                        }
                    });
                    $('a').each(function(index){
                        const href = $(this).attr('href');
                        urlList = [...urlList, href];
                    });
                    urlList = urlList.map(url => {
                        if (new Crawler().isSafeUrl(url) && filterItems.indexOf(url) < 0) {
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

}

module.exports = { Crawler };
