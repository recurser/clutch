/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Common javascript
 */

var transmission;
var dialog;

$(document).ready( function() {
	// Initialise a torrent controller to handle events
	transmission = new Transmission();
	
	// Initialise the dialog controller
	dialog = new Dialog();

	if ($.browser.safari) {
		// Hack to move the torrent view to the right spot in safari
		$('#torrent_list').css('marginTop', '-7px');
		
		// Fix div height problem - causes scrollbar flash in
		// firefox so have to be safari-specific
		$('#torrent_inspector').css('height', '100%');

		
		// Set Filter input to type search (nicely styled input field)
		$('#torrent_search')[0].type = 'search';
		$('#torrent_search')[0].placeholder = 'Filter';
	}
});


/**
 *   Array convenience method to clear membership.
 *
 *   @param object element
 *   @returns void
 */
Array.prototype.clear = function () {
    this.length = 0;
};


/*
 * Return true if the given object is in the array
 *
 *   @param object element
 *   @returns boolean
 */
Array.prototype.inArray = function (obj) {
	var i;
	for (i=0; i < this.length; i++) {
		if (this[i] === obj) {
			return true;
		}
	}
	return false;
};


/*
 * Return a copy of the array
 *
 *   @returns array
 */
Array.prototype.clone = function () {
	var a = new Array(); 
	for (var property in this) {
		a[property] = typeof (this[property]) == 'object' ? this[property].clone() : this[property];
	} 
	return a;
}

/**
 *   Array convenience method to remove element.
 *
 *   @param object element
 *   @returns boolean
 */
Array.prototype.remove = function (element) {
	var result = false;
	var array = [];
	for (var i = 0; i < this.length; i++) {
		if (this[i] == element) {
			result = true;
		} else {
			array.push(this[i]);
		}
	}
	this.clear();
	for (var i = 0; i < array.length; i++) {
		this.push(array[i]);
	}
	array = null;
	return result;
};


/*
 * Converts file & folder byte size values to more  
 * readable values (bytes, KB, MB, GB or TB).
 */
Math.formatBytes = function(bytes) {
    var size;
    var unit;
    
    // Terabytes (TB).
    if ( bytes >= 1099511627776 ) { 
        size = Math.roundWithPrecision(bytes / 1099511627776, 2);
		unit = ' TB'; 
    
    // Gigabytes (GB).
    } else if ( bytes >= 1073741824 ) { 
        size = Math.roundWithPrecision(bytes / 1073741824, 2);
		unit = ' GB';

    // Megabytes (MB).
    } else if ( bytes >= 1048576 ) { 
        size = Math.roundWithPrecision(bytes / 1048576, 2);
		unit = ' MB';

    // Kilobytes (KB).
    } else if ( bytes >= 1024 ) { 
        size = Math.roundWithPrecision(bytes / 1024, 2);
		unit = ' KB';

    // The file is less than one KB
    } else {
        size = bytes;
		unit = ' B';
    }
    
	// Add the decimal if this is an integer
	if ((size % 1) == 0 && unit != ' B') {
		size = size +'.0';
	}

    return size + unit;
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
 * Converts a unix timestamp to a human readable value
 */
Math.formatTimestamp = function(seconds) {
	var myDate = new Date(seconds*1000);
	return myDate.toGMTString();
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
