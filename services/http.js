const http = require('http');
const https = require('https');

class HttpService {

    constructor(){
    }

    getHtmlDocumentByUrl(url) {
        if (url.startsWith('http://'))  {
            const content = this.getHtmlDocumentWithProtocol(http, url);
            console.log(content);
        } else if (url.startsWith('https://')) {
            const content = this.getHtmlDocumentWithProtocol(https, url);
            console.log(content);
        }
    }

    getHtmlDocumentWithProtocol(protocol, url) {
        protocol.get(url, function(res) {
            console.log("Got response: " + res.statusCode);
            var content = '';
            res.on('data', function(chunk) {
                console.log('chunk ' + chunk.length);
                content += chunk;
            });
            res.on('end', function() {
                console.log('end');
                console.log(content.length);
                console.log(content);
            });
            return content;
        }).on('error', function(e) {
            console.log("Got error: " + e.message);
        });
    }
}

module.exports = { HttpService };
