# Node Crawler
 Simple NodeJS Crawler application.
 
 **Run**
 
 ````npm run start````
 
 **How to test ?**
 
 ```http://localhost:3000/search?url=https://www.chevron.com/&keyword=IoT```
 
 **Response:**
 
 ````json
{ "foundlist": [
    {
      "url": "http://www.chevron.com/", 
      "keyword": "IoT",
      "elements": [
        {
          "html": "<html>...</html>",
          "summary": "lorem impum IoT text",
          "points": [
            944,
            949
          ]
        },
      ]   
    }
  ]
}



````
