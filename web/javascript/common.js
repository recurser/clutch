/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Common javascript
 */

var transmission;
var dialog;
// Test for a Webkit build that supports box-shadow: 521+ (release Safari 3 is
// actually 523.10.3). We need 3.1 for CSS animation (dialog sheets) but as it
// degrades gracefully let's not worry too much.
var Safari3 = testSafari3();
var iPhone = RegExp("(iPhone|iPod)").test(navigator.userAgent);
if (iPhone) var scroll_timeout;

function updateLayout()
{
	if (iPhone) {
		switch(window.orientation) {
			case -90:
				$('body').addClass('landscape');
				break;
			case 90:
				$('body').addClass('landscape');
				break;
			default:
				$('body.landscape').removeClass('landscape');
				break;
		} 
		transmission.hideiPhoneAddressbar(0.4);
	}
};

function testSafari3()
{
    var minimum = new Array(521,0);
    var webKitFields = RegExp("( AppleWebKit/)([^ ]+)").exec(navigator.userAgent);
    if (!webKitFields || webKitFields.length < 3) return false;
    var version = webKitFields[2].split(".");
    for (var i = 0; i < minimum.length; i++) {
        var toInt = parseInt(version[i]);
        var versionField = isNaN(toInt) ? 0 : toInt;
        var minimumField = minimum[i];
        
        if (versionField > minimumField) return true;
        if (versionField < minimumField) return false;
    }
    return true;
};

$(document).ready( function() {
	// Initialise a torrent controller to handle events
	
	// Initialise the dialog controller
	dialog = new Dialog();
	
	// Initialise the main Transmission controller
	transmission = new Transmission();

	if ($.browser.safari) {
		
		// Fix div height problem - causes scrollbar flash in
		// firefox so have to be safari-specific
		$('#torrent_inspector').css('height', '100%');
		
		// Set Filter input to type search (nicely styled input field)
		$('#torrent_search')[0].type = 'search';
		$('#torrent_search')[0].placeholder = 'Filter';
		$('#torrent_search').css('margin-top', 3);		
	}
	if (!Safari3 && !iPhone) {
		// Fix for non-Safari-3 browsers: dark borders to replace shadows.
		// Opera messes up the menu if we use a border on .trans_menu
		// div.outerbox so use ul instead
		$('.trans_menu ul, div#jqContextMenu, div.dialog_container div.dialog_window').css('border', '1px solid #777');
		// and this kills the border we used to have
		$('.trans_menu div.outerbox').css('border', 'none');
	} else if (!iPhone) {
		// Used for Safari 3.1 CSS animation. Degrades gracefully (so Safari 3
		// test is good enough) but we delay our hide/unhide to wait for the
		// scrolling - no point making other browsers wait.
		$('div#upload_container div.dialog_window').css('top', '-205px');
		$('div#prefs_container div.dialog_window').css('top', '-425px');
		$('div#dialog_container div.dialog_window').css('top', '-425px');
		$('div.dialog_container div.dialog_window').css('-webkit-transition', 'top 0.3s');
		// -webkit-appearance makes some links into buttons, but needs
		// different padding.
		$('div.dialog_container div.dialog_window a').css('padding', '2px 10px 3px');
	}
	if ($.browser.mozilla) {
		$('div#prefs_container div.preference input').css('height', 'auto');
		$('div#prefs_container div.preference input').css('padding', '1px');
		$('div#prefs_container div.preference input').css('margin-top', '2px');
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
 *   Return true if the given object is in the array
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
 *   Return a copy of the array
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


/*
 *   Return a JSON representation of the array. 
 *   Force single integers to be returned in an array
 *
 *   @returns string
 */
Array.prototype.json = function () {
	var result = $.toJSON(this);
	if (parseInt(result) == result) {
		result = '[' + result + ']'
	}
	return result;
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
 *   Converts file & folder byte size values to more  
 *   readable values (bytes, KB, MB, GB or TB).
 *
 *   @param integer bytes
 *   @returns string
 */
Math.formatBytes = function(bytes) {
    var size;
    var unit;
    
    // Terabytes (TB).
    if ( bytes >= 1099511627776 ) { 
        size = bytes / 1099511627776;
		unit = ' TB'; 
    
    // Gigabytes (GB).
    } else if ( bytes >= 1073741824 ) { 
        size = bytes / 1073741824;
		unit = ' GB';

    // Megabytes (MB).
    } else if ( bytes >= 1048576 ) { 
        size = bytes / 1048576;
		unit = ' MB';

    // Kilobytes (KB).
    } else if ( bytes >= 1024 ) { 
        size = bytes / 1024;
		unit = ' KB';

    // The file is less than one KB
    } else {
        size = bytes;
		unit = ' bytes';
    }
	
	// Single-digit numbers have greater precision
	var precision = 1; 
	if (size < 10) {
	    precision = 2;
	}
	size = Math.roundWithPrecision(size, precision);
    
	// Add the decimal if this is an integer
	if ((size % 1) == 0 && unit != ' bytes') {
		size = size + '.0';
	}

    return size + unit;
}


/*
 *   Converts seconds to more readable units (hours, minutes etc).
 *
 *   @param integer seconds
 *   @returns string
 */
Math.formatSeconds = function(seconds) {
    var result;
    var days;
    var hours;
    var minutes;
    var seconds;
    
    days = Math.floor(seconds / 86400);
    hours = Math.floor((seconds % 86400) / 3600);
    minutes = Math.floor((seconds % 3600) / 60);
    seconds = Math.floor((seconds % 3600) % 60);    
    
    if (days > 0 && hours == 0) {
        result = days + ' days';    
    } else if (days > 0 && hours > 0) {
        result = days + ' days ' + hours + ' hr';
    } else if (hours > 0 && minutes == 0) {
        result = hours + ' hr';   
    } else if (hours > 0 && minutes > 0) {
        result = hours + ' hr ' + minutes + ' min';
    } else if (minutes > 0 && seconds == 0) {
        result = minutes + ' min';
    } else if (minutes > 0 && seconds > 0) {
        result = minutes + ' min ' + seconds + ' seconds';
    } else {
        result = seconds + ' seconds';  
    }
    
    return result;
}


/*
 *   Converts a unix timestamp to a human readable value
 *
 *   @param integer seconds
 *   @returns string
 */
Math.formatTimestamp = function(seconds) {
	var myDate = new Date(seconds*1000);
	return myDate.toGMTString();
}

/*
 *   Round a float to a specified number of decimal 
 *   places, stripping trailing zeroes
 *
 *   @param float floatnum
 *   @param integer precision
 *   @returns float
 */
Math.roundWithPrecision = function(floatnum, precision) {
    return Math.round ( floatnum * Math.pow ( 10, precision ) ) / Math.pow ( 10, precision );
}

/*
 * Trim whitespace from a string
 */
String.prototype.trim = function () {
    return this.replace(/^\s*/, "").replace(/\s*$/, "");
}
