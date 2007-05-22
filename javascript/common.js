
// Initialise a torrent controller to handle events
var transmission;
window.onload=function() { 
	transmission = new Transmission();

	// Hack to move the torrent view to the right spot in safari
	if (BrowserDetect.browser == 'Safari')
		$('torrent_container').style.marginTop = '-7px';
}


/*
 * Converts file & folder byte size values to more  
 * readable values (bytes, KB, MB, GB or TB).
 */
Math.formatBytes = function(bytes) {
    var result;
    
    // Terabytes (TB).
    if ( bytes >= 1099511627776 ) { 
        result = Math.roundWithPrecision(bytes / 1099511627776, 2) + ' TB'; 
    
    // Gigabytes (GB).
    } else if ( bytes >= 1073741824 ) { 
        result = Math.roundWithPrecision(bytes / 1073741824, 2) + ' GB';

    // Megabytes (MB).
    } else if ( bytes >= 1048576 ) { 
        result = Math.roundWithPrecision(bytes / 1048576, 2) + ' MB';

    // Kilobytes (KB).
    } else if ( bytes >= 1024 ) { 
        result = Math.roundWithPrecision(bytes / 1024, 2) + ' KB';

    // The file is less than one KB
    } else {
        result = bytes + ' B';
    }
    
    return result;
}


/*
 * Converts file & folder byte size values to more  
 * readable values (bytes, KB, MB, GB or TB).
 */
Math.formatSeconds = function(seconds) {
    var result;
    var hours;
    var minutes;
    var seconds;
    
    hours = Math.floor(seconds / 3600);
    minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor((seconds % 3600) % 60);
    
    // Only show seconds if hours and minutes are zero
    if (minutes == 0 && hours == 0) {
        result = seconds + ' seconds';    
    } else {
        result = hours + ' hr ' + minutes + ' min';
    }
    
    return result;
}


/*
 * Round a float to a specified number of decimal 
 * places, stripping trailing zeroes
 */
Math.roundWithPrecision = function(floatnum, precision) {
    
    // Round float to desired precision and
    var result = floatnum.toFixed(precision).toString();
    
    // Strip trailing zeros
    var last_char = result.substr(result.length-1, 1);
    while (result.length > 1 && (last_char == '0' || last_char == '.')) {
        result = result.substr(0, result.length-1);
        last_char = result.substr(result.length-1, 1);
    }
    
    return result;
}


/*
 * Browser detection
 * Courtesy of http://www.quirksmode.org/js/detect.html
 *
 * TODO - store this in a cookie or something? seems like wasted 
 * overhead every page load, although since everything is ajax the
 * page hopefully won't need to be reloaded too often. Possibly a cookie
 * might have similar overhead. (?)
 */
var BrowserDetect = {
	init: function () {
		this.browser = this.searchString(this.dataBrowser) || "An unknown browser";
		this.version = this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version";
		this.OS = this.searchString(this.dataOS) || "an unknown OS";
	},
	searchString: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i].identity;
			}
			else if (dataProp)
				return data[i].identity;
		}
	},
	searchVersion: function (dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1) return;
		return parseFloat(dataString.substring(index+this.versionSearchString.length+1));
	},
	dataBrowser: [
		{ 	string: navigator.userAgent,
			subString: "OmniWeb",
			versionSearch: "OmniWeb/",
			identity: "OmniWeb"
		},
		{
			string: navigator.vendor,
			subString: "Apple",
			identity: "Safari"
		},
		{
			prop: window.opera,
			identity: "Opera"
		},
		{
			string: navigator.vendor,
			subString: "iCab",
			identity: "iCab"
		},
		{
			string: navigator.vendor,
			subString: "KDE",
			identity: "Konqueror"
		},
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "Firefox"
		},
		{
			string: navigator.vendor,
			subString: "Camino",
			identity: "Camino"
		},
		{		// for newer Netscapes (6+)
			string: navigator.userAgent,
			subString: "Netscape",
			identity: "Netscape"
		},
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "Explorer",
			versionSearch: "MSIE"
		},
		{
			string: navigator.userAgent,
			subString: "Gecko",
			identity: "Mozilla",
			versionSearch: "rv"
		},
		{ 		// for older Netscapes (4-)
			string: navigator.userAgent,
			subString: "Mozilla",
			identity: "Netscape",
			versionSearch: "Mozilla"
		}
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]

};
BrowserDetect.init();