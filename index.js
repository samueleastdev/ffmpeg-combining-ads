var fs = require('fs');

var path = require('path');

const { exec } = require("child_process");

const { FFMpegProgress } = require('ffmpeg-progress-wrapper');

var video = './trailer.mov';

var video_time = 147; // video time in seconds

var output = './combined_ouptut.mkv';

var folder = './clipped';

var times = [{
        start: 0,
        end: 10000, // Time for ad to play
        ad_time: 15, // Add time in seconds
        ad: './ads/ForBiggerBlazes2.mp4'
    },
    {
        start: 10000,
        end: 40000, // Time for ad to play
        ad_time: 15, // Add time in seconds
        ad: './ads/ForBiggerJoyrides2.mp4'
    },
    {
        start: 40000,
        end: 60000, // Time for ad to play
        ad_time: 15, // Add time in seconds
        ad: './ads/ForBiggerBlazes2.mp4'
    },
    {
        start: 60000,
        ad_time: 0, // Add time in seconds
        end: 3600000,
        ad: null
    }
];


fs.mkdirSync(folder, {
    recursive: true
});

// Split the video into time based sections
var cmd = '';

var duration = 0;

for (var i = 0; i < times.length; i++) {

	var and = '&& ';

	if((i+1) === times.length){

		and = '';
	}

	duration += parseInt(times[i].ad_time);

    cmd += 'ffmpeg -y -ss ' + times[i].start + 'ms -i ' + video + ' -t ' + (times[i].end - times[i].start) + 'ms -c copy -c:a aac ' + folder + '/' + i + '_cut.mp4 ' + and;

}

exec(cmd, (error, stdout, stderr) => {

    var media = [];

	var count = 0;

	// Loop through cuts and create an array with the ads for next command
	fs.readdir(folder, function(err, files) {

	    if (err) {

	        console.error("Could not list the directory.", err);

	        process.exit(1);

	    }

	    files.forEach(function(file, index) {

	    	if(file.split('.').pop() === 'mp4'){

	    		media.push(folder + '/' + file);

		        if(times[count].ad){

		        	media.push(times[count].ad);

		        }

		        count++;

	    	}

	    });

	 	(async () => {

	 		console.log('media', media);

		  	let length = media.length;

		  	let filterStepHeader = '';

		  	let args = [];

		  	for (let a = 0; a < media.length; a++) {

		    	args.push('-i');

		    	args.push(media[a]);

		    	filterStepHeader += '[' + a + ':v:0][' + a + ':a:0]';
		  	
		  	}

		  	args.push('-filter_complex');

		  	args.push(`${filterStepHeader} concat=n=${length}:v=1:a=1 [outv][outa]`);

		  	args.push('-map');

		  	args.push('[outv]');

		  	args.push('-map');

		  	args.push('[outa]');

		  	args.push(output);

		  	args.push('-y');

		  	try {

		    	const process = new FFMpegProgress(args, {
		      		cmd: '/usr/local/bin/ffmpeg',
		      		duration: (duration+video_time)
		    	});	

		    	process.on('progress', (data) => {

		      		console.log('progress', (data.progress * 100).toFixed(2) + '%');
		    	
		    	});

		    	await process.onDone();

		    	console.log('Finished');

		    	exec('ffmpeg -y -i ' + output + ' -c copy -c:a aac -movflags +faststart ./full.mp4', (error, stdout, stderr) => {

		    		console.log('Finalized');

		    	});

		  	} catch (error) {
		    	
		    	console.log(error)
		  	
		  	}

		})().then(console.log).catch(console.error);

	});

});