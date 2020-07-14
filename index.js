const axios = require('axios');
const url = process.argv[2]; //'https://we.tl/t-w72OeJEkOs';
const folder = process.argv[3]; //'C:\\Users\\Mithr\\Desktop\\Camgen\\';
const fs = require('fs');
const path = require('path');

console.log(process.argv);
function doRequest(data) {
    return new Promise((resolve, reject) => {
        axios(data).then( ( httpResponse) => {
            resolve(httpResponse);
        })
        .catch(function (error) {
            reject(error);
        });
    });
}

function getDownloadUrl(id){
    return `https://wetransfer.com/api/v4/transfers/${id}/download`
}

function getBody(hash){
    return `{"security_hash":"${hash}","intent":"entire_transfer","domain_user_id":"6d0c4baa-41dd-4afd-839f-321b42922e6b"}`
}

function findClosingBracketMatchIndex(str, pos) {
    if (str[pos] != '{') {
      throw new Error("No '{' at index " + pos);
    }
    let depth = 1;
    for (let i = pos + 1; i < str.length; i++) {
      switch (str[i]) {
      case '{':
        depth++;
        break;
      case '}':
        if (--depth == 0) {
          return i;
        }
        break;
      }
    }
    return -1;    // No matching closing parenthesis
  }

function findImageName(source){
    let objIndex = source.indexOf('_preloaded_transfer_')
    let objOpenBracket = source.indexOf('{', objIndex);
    let objClosingBracket = findClosingBracketMatchIndex(source, objOpenBracket);
    let obj = JSON.parse(source.substring(objOpenBracket, objClosingBracket+1));
    return obj.display_name;
}

async function download(){
    let httpResponse  = await doRequest({
        url: url,
        followRedirect: false,
    });
    
    let fullUrl = httpResponse.request.res.responseUrl;
    let filename = findImageName(httpResponse.data);
    
    let fullSplit = fullUrl.split('/');
    let identificator = fullSplit[fullSplit.length-2];
    let security_hash = fullSplit[fullSplit.length-1];
    
    let data = getBody(security_hash);

    let config = {
    method: 'post',
    url: getDownloadUrl(identificator),
    headers: 
        { 
            'accept': ' application/json, text/plain, */*', 
            'accept-encoding': ' gzip, deflate, br', 
            'accept-language': ' en-US,en;q=0.9,ru-RU;q=0.8,ru;q=0.7', 
            'content-length': data.length, 
            'content-type': ' application/json;charset=UTF-8', 
            'cookie': ' _wt_snowplowses.38f1=*; sp=1c02b2f9-573b-42c3-823e-662697b2bdd1; wt_tandc=20190527%3A1; wt_first_visit=1594712593192; _ga=GA1.2.1682080875.1594712593; _gid=GA1.2.2014471023.1594712593; _fbp=fb.1.1594712593398.677976745; _uetsid=bd5be819-0570-7741-6504-0ee83ab9b1d3; _uetvid=4fa6acc9-cd6a-6566-0486-bcbb6e76ec48; _wt_session=dmx5WDYvL0t2d0dSUmdWVG5zODVONWtFQ3E3UmR6MmVnMWhEOEdldjhVVE1VN0JZNklqd2RYQ2RSazNwV1hsaUNTVzZZTjFjTGxVMXF0MnNJT2NPS1RGK2t6eU5CRzF1SUVmWWM2S0ZLRDRIY0MwWVFYVWNTVVVuUVhtTzBLYkVXRkZvcnI0dCtuZ2R5bkJRUDVrakpnPT0tLTJUYWpHLzZxbTdaaThiMW8xdjhEa1E9PQ%3D%3D--71f76c7b28bda7e5e61a252008077afb9320e226; _wt_snowplowid.38f1=6d0c4baa-41dd-4afd-839f-321b42922e6b.1594712582.1.1594713492.1594712582.d3f86c4d-9ed7-4fa1-8fba-9124f140d825; _wt_session=SFg5MHFFSWt1NVJ5YU45cDBvcDczTTEvNWUxS0V4cXdaclBOeXV4K1RQRzEwWFJzSDlBc1RRZEx5ZlMwRjFlcGFJUmRYN2xFdU9tZVRmRW14ZDVUenhuZ1RkTTRpdVQ4QkJFemZGKzZod1NycHQvRjdQVy85bG9nTE1OcVQ4SDg1QktqNk9BVXM1OGF4TG51cUZjK0VnPT0tLXM4M2F3V3hxSStleXlSTmRWeUgzMGc9PQ%3D%3D--4b6d267edd5ff3a143a8ce958b54b6ce80c1a43d', 
            'origin': ' https://wetransfer.com', 
            'referer': ' https://wetransfer.com/', 
            'sec-fetch-dest': ' empty', 
            'sec-fetch-mode': ' cors', 
            'sec-fetch-site': ' same-origin', 
            'user-agent': ' Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36', 
            'x-csrf-token': ' vrnxwNRZMUk6m7dENHihictPw7WXMT6MmDgSANLhurr31m36Rs661DqHiaWtirge3WO0gvoINhIM90GR4r4lIA=='
        },
    data : data
    };
    

    let dlUrl = await doRequest(config); 
    let direct_link = dlUrl.data.direct_link;
    const writer = fs.createWriteStream(path.resolve(folder, filename));
    config = {
        url: direct_link,
        method: 'GET',
        responseType: 'stream'
    }
    const imageResponse = await doRequest(config); 

    await imageResponse.data.pipe(writer)
}
download();