#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes
Uses commander.js and cheerio. Teaches command line application dev and basic DOM parsing.

References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjhollowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

*/

var fs = require('fs');
var rest = require('restler');
var program = require('commander');
var cheerio = require('cheerio');

//defaults
var HTMLFILE_DEFAULT = 'index.html';
var CHECKSFILE_DEFAULT = 'checks.json';
var URLFILE_DEFAULT = 'http://infinite-inlet-7547.herokuapp.com/index.html';

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if (!fs.existsSync(instr)){
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); 
	//see http://nodejs.com/...
    }
    return instr;
};

var getUrl = function(myurl, checksfile){
    //'complete' event emitted whent the request has completed
    // To get more informative, we should probably handle status codes
    var page = rest.get(myurl).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error: ' + result.message);
	    process.exit(1);
	} else {
	    checkWebFile(result, checksfile);
	}
    });
}

var cheerioHtmlFile = function(htmlfile){
    return cheerio.load(fs.readFileSync(htmlfile));
};

var checkWebFile = function(data, checksfile){
    $ = cheerio.load(data);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks){
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    console.log(JSON.stringify(out, null, 4));
};
    
var loadChecks = function(checksfile){
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile){
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for (var ii in checks){
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    return out;
};

var clone = function(fn) {
    // workaround for commander.js issue
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if (require.main == module) {
    program
      .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
      .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
      .option('-u, --url [url]', 'Url of html file')
      .parse(process.argv);
    
    if (program.url){
	getUrl(program.url, program.checks) //async call
    } else {
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }

} else {
    exports.checkHtmlfile = checkHtmlFile;
}
