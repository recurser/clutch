
// Initialise a torrent controller to handle events
var transmission;
window.onload=function() { 
	transmission = new Transmission();
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


