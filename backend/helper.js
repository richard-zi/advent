const fs = require('fs')
const path = require('path');
const timing =require('./timing');

function categorize(fp, message, number){
    const extension = path.extname(fp).toLowerCase();
    var ft;
    switch(extension) { // quick WIP
        case '.png':
        case '.jpg':
        case '.jpeg':
            ft = 'image';
            break; 
        case '.mp4':
        case '.m4a':
        case '.mov':
            ft = 'video';
            break;
        case '.mp3':
        case '.ogg':
        case '.wav':
            ft = 'audio';
            break;
        default:
            ft = 'unknown';
    }
    const data = {
        link : fp, 
        fileType : ft,
        message: message
    };
    const jsonString = JSON.stringify(data, null, 2); // Pretty print with 2 spaces
    console.log(jsonString)
    // Write the JSON string to a file
    fs.writeFile(path.join(__dirname, 'jsons', String(number) + '.json'), jsonString, (err) => {
    if (err) {
        console.error('Error writing file:', err);
    } else {
        console.log('JSON file has been written successfully!');
    }
    });
    console.log("Data written");
    return;
}

// categorize(path.join(__dirname, 'media', '1.mp4'), "Testing message", 1);
// console.log(timing.dateCheck(0));

test = {
    "1" : "test"
}

console.log(test["2"])