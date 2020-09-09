var fs = require('fs'); 
var parse = require('csv-parse');

var req_file_path = "./data/Book3-idioms.csv";
var csvData=[];

fs.createReadStream(req_file_path)
    .pipe(parse({delimiter: ',', escape: '\\'}))
    .on('data', function(csvrow) {
        // console.log(csvrow);
        //do something with csvrow
        csvData.push(csvrow);        
    })
    .on('end',function() {
      //do something with csvData
      console.log(csvData);
    });
