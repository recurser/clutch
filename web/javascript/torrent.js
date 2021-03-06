/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class Torrent
 */

function Torrent(data) {
    // Constants
	this._StatusDownloading     = 'downloading';
	this._StatusSeeding         = 'seeding'; 
	this._StatusStopping        = 'stopping'; 
	this._StatusPaused          = 'paused'; 
	this._StatusChecking        = 'checking';
	this._StatusWaitingToCheck  = 'waiting to checking';
	this._InfiniteTimeRemaining = 215784000; // 999 Hours - may as well be infinite
	this._MaxProgressBarWidth   = 100; // reduce this to make the progress bar shorter (%)

    this.initialize(data);
} 

Torrent.prototype = {

    /*
     * Constructor
     */
    initialize: function(data) {
		
		// Create a new <li> element
		var element = $('<li/>');
		element.addClass('torrent');
		element[0].id = 'torrent_' + data.id;
		this._element = element;
		
		// Create the 'name' <div>
		this._name_container = $('<div/>');
		this._name_container.addClass('torrent_name');
		this._name_container[0].innerHTML= data.name;
		this._element.append(this._name_container);
		
		// Create the 'progress details' <div>
		this._progress_details_container = $('<div/>');
		this._progress_details_container.addClass('torrent_progress_details');
		this._element.append(this._progress_details_container);
			
		// Create the 'in progress' bar
		this._progress_complete_container = $('<div/>');
		this._progress_complete_container.addClass('torrent_progress_bar');
		this._progress_complete_container.addClass('incomplete');
		this._progress_complete_container.css('width', '0%');
		this._element.append(this._progress_complete_container);
			
		// Create the 'incomplete' bar (initially hidden)
		this._progress_incomplete_container = $('<div/>');
		this._progress_incomplete_container.addClass('torrent_progress_bar');
		this._progress_incomplete_container.addClass('incomplete');
		this._progress_incomplete_container.hide();
		this._element.append(this._progress_incomplete_container);
		
		// Add the pause/resume button - don't specify the image or alt text until 
		// the 'refresh()' function (depends on torrent state)
		this._pause_resume_button = $('<a/>');
		this._pause_resume_button_image = $('<div/>');
		this._pause_resume_button_image.addClass('torrent_pause');
		this._pause_resume_button.append(this._pause_resume_button_image);
		this._element.append(this._pause_resume_button);
			
		// Set the pause button click observer (not shown on iPhone)
		if (!iPhone) this._pause_resume_button.bind('click', {torrent: this}, this.clickPauseResumeButton);
		
		// Create the 'peer details' <div>
		this._peer_details_container = $('<div/>');
		this._peer_details_container.addClass('torrent_peer_details');
		this._element.append(this._peer_details_container);
			
		// Set the torrent click observer
		this._element.bind('click', {torrent: this}, this.clickTorrent);
		if (!iPhone) this._element.bind('contextmenu', {torrent: this}, this.rightClickTorrent);		
		
		// Safari hack - first torrent needs to be moved down for some reason. Seems to be ok when
		// using <li>'s in straight html, but adding through the DOM gets a bit odd.
		if ($.browser.safari) {
			this._element.css('margin-top', '7px');
		}
		
		// insert the element
		$('#torrent_list').append(this._element);
		
		// Update all the labels etc
		this.refresh(data);
	},



	/*--------------------------------------------
	 * 
	 *  S E T T E R S   /   G E T T E R S
	 * 
	 *--------------------------------------------*/
		
	
	/*
	 * Set the main transmission controller
	 */
	setController: function(controller) {
		this._controller = controller;
	},
	
	/*
	 * Return the id of this torrent
	 */
	id: function() {
		return parseInt(this._id);
	},
	
	/*
	 * Return the DOM element for this torrent (a <LI> element)
	 */
	element: function() {
		return this._element;
	},
	
	/*
	 * Return the torrent before this in the list
	 */
	previousTorrent: function() {
		return this._previous_torrent;
	},
	
	/*
	 * Set the torrent before this in the list
	 */
	setPreviousTorrent: function(torrent) {
		this._previous_torrent = torrent;
	},
	
	/*
	 * Return the torrent after this in the list
	 */
	nextTorrent: function() {
		return this._next_torrent;
	},
	
	/*
	 * Set the torrent after this in the list
	 */
	setNextTorrent: function(torrent) {
		this._next_torrent = torrent;
	},
	
	/*
	 * Return the position of this torrent in the list
	 */
	position: function() {
		return this._position;
	},
	
	/*
	 * Set the position of this torrent in the list
	 */
	setPosition: function(position) {
		return this._position = position;
	},
	
	/*
	 * Return the state of this torrent
	 */
	isActive: function() {
		return this._state == this._StatusSeeding || !(this._state == this._StatusStopping || this._state == this._StatusPaused);
	},
	
	/*
	 * Return the name of this torrent
	 */
	name: function() {
		return this._name;
	},
	
	/*
	 * Return the error message for this torrent
	 */
	errorMessage: function() {
		return this._error_message;
	},
	
	/*
	 * Return the creator of this torrent
	 */
	creator: function() {
		return this._creator;
	},
	
	/*
	 * Return the comment for this torrent
	 */
	comment: function() {
		return this._comment;
	},
	
	/*
	 * Return the swarm speed of this torrent
	 */
	swarmSpeed: function() {
		return this._swarm_speed;
	},
	
	/*
	 * Return the size of this torrent
	 */
	size: function() {
		return this._size;
	},
	
	/*
	 * Return the hash of this torrent
	 */
	hash: function() {
		return this._hash;
	},
	
	/*
	 * Return the state of this torrent
	 */
	state: function() {
		return this._state;
	},
	
	/*
	 * Return the download speed of this torrent
	 */
	downloadSpeed: function() {
		return this._download_speed;
	},
	
	/*
	 * Return the upload speed of this torrent
	 */
	uploadSpeed: function() {
		return this._upload_speed;
	},
	
	/*
	 * Return the download total of this torrent
	 */
	downloadTotal: function() {
		return this._download_total;
	},
	
	/*
	 * Return the bytes completed of this torrent
	 */
	completed: function() {
		return this._completed;
	},
	
	/*
	 * Return the percent completed of this torrent
	 */
	percentCompleted: function() {
		return this._percent_completed;
	},
	
	/*
	 * Return the upload total of this torrent
	 */
	uploadTotal: function() {
		return this._upload_total;
	},
	
	/*
	 * Return the total number of seeders for this torrent
	 */
	totalSeeders: function() {
		return ((this._total_seeders == '') ? 0 : this._total_seeders);
	},
	
	/*
	 * Return the total number of leechers for this torrent
	 */
	totalLeechers: function() {
		return ((this._total_leechers == '') ? 0 : this._total_leechers);
	},
	
	/*
	 * Return the total number of peers downloading for this torrent
	 */
	peersDownloading: function() {
		return ((this._peers_downloading == '') ? 0 : this._peers_downloading);
	},
	
	/*
	 * Return the total number of peers uploading for this torrent
	 */
	peersUploading: function() {
		return ((this._peers_uploading == '') ? 0 : this._peers_uploading);
	},
	
	/*
	 * Return the ratio for this torrent
	 */
	ratio: function() {
		var result = Math.roundWithPrecision((this._upload_total / this._download_total), 2);
	
		// check for special cases
    	if (isNaN(result)) result = 0;
    	if (result=="Infinity") result = "&infin;";

    	// Add the decimals if this is an integer
    	if ((result % 1) == 0) {
    		result = result + '.00';
    	}
    	
    	return result;
	},



	/*--------------------------------------------
	 * 
	 *  E V E N T   F U N C T I O N S
	 * 
	 *--------------------------------------------*/	
	
	/*
	 * Process a right-click event on this torrent
	 */
	rightClickTorrent: function(event) {
		
		var torrent = event.data.torrent;
		
		// Don't stop the event! need it for the right-click menu
		if (!torrent.isSelected()) {
			torrent._controller.deselectAll();
			torrent.select();
		}
	},
	
	/*
	 * Process a click event on this torrent
	 */
	clickTorrent: function(event) {
		// Prevents click carrying to parent element
		// which deselects all on click
		event.stopPropagation();
		var torrent = event.data.torrent;
			
		// 'Apple' button emulation on PC :
		// Need settable meta-key and ctrl-key variables for mac emulation
		var meta_key = event.metaKey
		var ctrl_key = event.ctrlKey
		if (event.ctrlKey && navigator.appVersion.toLowerCase().indexOf("mac") == -1) {
			meta_key = true;
			ctrl_key = false;
		}
		
		// Shift-Click - Highlight a range between this torrent and the last-clicked torrent
		if (iPhone) {
			torrent._controller.deselectAll();
			torrent.select();
		} else if (event.shiftKey) {
			torrent._controller.selectRange(torrent);
			// Need to deselect any selected text
			window.focus();
		
		// Apple-Click, not selected
		} else if (!torrent.isSelected() && meta_key) {
			torrent.select();
			
		// Regular Click, not selected
		} else if (!torrent.isSelected()) {
			torrent._controller.deselectAll();
			torrent.select();
		
		// Apple-Click, selected	
		} else if (torrent.isSelected() && meta_key) {
			torrent.deselect();
			
		// Regular Click, selected
		} else if (torrent.isSelected()) {
			torrent._controller.deselectAll();
			torrent.select();
		}
		
		torrent._controller.setLastTorrentClicked(torrent);
	},
	

	/*
	 * Process a click event on the pause/resume button
	 */
	clickPauseResumeButton: function(event) {
		// Prevents click event resulting in selection of torrent
		event.stopPropagation();
		var torrent = event.data.torrent;
		
		var action;	
		if (torrent._state == torrent._StatusPaused) {
			action = 'resumeTorrents';
			torrent._pause_resume_button_image[0].style.className = "torrent_resume";
		} else {
			action = 'pauseTorrents';
			torrent._pause_resume_button_image[0].style.className = "torrent_pause";
		}
		
		// Send an ajax request to perform the action
		torrent._controller.remote.request(action, $.toJSON([torrent._id]));
	},



	/*--------------------------------------------
	 * 
	 *  I N T E R F A C E   F U N C T I O N S
	 * 
	 *--------------------------------------------*/
	
	/*
	 * Refresh display
	 */
	refresh: function(data) {
		var progress_details;
		var peer_details;
		
		// These variables never change after the inital load	
		if (data.name)		this._name			= data.name;
		if (data.hash)		this._hash			= data.hash;
		if (data.date)		this._date			= data.date;
		if (data.size)		this._size			= data.size;
		if (data.position)	this._position		= data.position;
		if (data.tracker)	this._tracker		= data.tracker;
		if (data.comment)	this._comment		= data.comment;
		if (data.creator)	this._creator		= data.creator;
		if (data.date)		this._creator_date	= data.date;
		if (data.path)		this._torrent_file	= data.path;
		
		// Set the regularly-changing torrent variables
		this._id               	    = data.id;
		this._completed             = data.completed;
		this._percent_completed     = data.percent_completed;
		this._download_total        = data.download_total;
		this._upload_total          = data.upload_total;
		this._download_speed        = data.download_speed;
		this._upload_speed          = data.upload_speed;
		this._peers_downloading     = data.peers_downloading;
		this._peers_uploading       = data.peers_uploading;
		// Don't *think* we need this anywhere
		this._peers_from            = data.peers_from; 
		this._peers_total           = data.peers_total;
		this._error                 = data.error;
		this._error_message         = data.error_message;
		this._state                 = data.state;
		this._eta                   = data.eta;
		this._running               = data.running;	
		this._swarm_speed           = data.swarm_speed;	
		this._total_leechers       	= data.scrape_leechers;	
		this._total_seeders        	= data.scrape_seeders;
    	
		// Get -1 returned sometimes (maybe torrents with errors?)
		if (this._total_leechers < 0) {
			this._total_leechers = 0;
		}
		if (this._total_seeders < 0) {
			this._total_seeders = 0;
		}
		
		// Figure out the percent completed
		var css_percent_completed = Math.floor(this._percent_completed * this._MaxProgressBarWidth / 100);
		var int_percent_completed = Math.floor(this._percent_completed);
		
		// Sometimes get figures greater that the max
		if (css_percent_completed > this._MaxProgressBarWidth) {
		    css_percent_completed = this._MaxProgressBarWidth;
		}
		
		// Add the progress bar
		if (int_percent_completed < 100 && this.state() != "seeding") {
		
    	    // Add the decimals if the percentage is an integer
        	if ((this._percent_completed % 1) == 0) {
        		this._percent_completed = this._percent_completed + '.00';
        	}
			// Create the 'progress details' label
			// Eg: '101 MB of 631 MB (16.02%) - 2 hr 30 min remaining'
			progress_details = Math.formatBytes(this._completed) + ' of ';
			progress_details += Math.formatBytes(this._size) + ' (';
			progress_details += this._percent_completed + '%)';
			if ((this._eta < 0 || this._eta >= this._InfiniteTimeRemaining) && this.isActive()) {
				progress_details += ' - remaining time unknown';
			} else if (this.isActive()) {
				progress_details += ' - ' + Math.formatSeconds(this._eta) + ' remaining';
			}
			
			// Update the 'in progress' bar
			var class_name = (this.isActive()) ? 'in_progress' : 'incomplete_stopped';
			this._progress_complete_container.removeClass();
			this._progress_complete_container.addClass('torrent_progress_bar');
			this._progress_complete_container.addClass(class_name);
			this._progress_complete_container.css('width', css_percent_completed + '%');
			
			// Update the 'incomplete' bar
    		if (! this._progress_incomplete_container.is('.incomplete')) {
				this._progress_incomplete_container.removeClass();
				this._progress_incomplete_container.addClass('torrent_progress_bar');
				this._progress_incomplete_container.addClass('in_progress');
			}
			this._progress_incomplete_container.css('width', (this._MaxProgressBarWidth - css_percent_completed) + '%');
			this._progress_incomplete_container.show();
			
			// Create the 'peer details' label
			// Eg: 'Downloading from 36 of 40 peers - DL: 60.2 KB/s UL: 4.3 KB/s'
			if (this._state == this._StatusChecking) {
				peer_details = 'Checking existing files';
				
			} else if (this._state == this._StatusWaitingToCheck) {
				peer_details = 'Waiting to check existing files';
				
			} else {
				peer_details = 'Downloading from ' + this._peers_downloading + ' of ';
				peer_details += this._peers_total + ' peers - DL: ';
				peer_details += Math.formatBytes(this._download_speed) + '/s UL: ';
				peer_details += Math.formatBytes(this._upload_speed) + '/s';			
			}
			
		} else {
			
			// Update the 'in progress' bar
			var class_name = (this.isActive()) ? 'complete' : 'complete_stopped';
			this._progress_complete_container.removeClass();
			this._progress_complete_container.addClass('torrent_progress_bar');
			this._progress_complete_container.addClass(class_name);
			
			// Create the 'progress details' label
			// Eg: '698.05 MB, uploaded 8.59 GB (Ratio: 12.3)'
			progress_details = Math.formatBytes(this._size) + ', uploaded ';
			progress_details += Math.formatBytes(this._upload_total) + ' (Ratio ';
			progress_details += this.ratio() + ')';
			
		    // Hide the 'incomplete' bar
			this._progress_incomplete_container.hide();
		
			// Set progress to maximum
			this._progress_complete_container.css('width', this._MaxProgressBarWidth + '%');
			
			// Create the 'peer details' label
			// Eg: 'Seeding to 13 of 22 peers - UL: 36.2 KB/s'
			peer_details = 'Seeding to ' + this._peers_uploading + ' of ';
			peer_details += this._peers_total + ' peers - UL: ';
			peer_details += Math.formatBytes(this._upload_speed) + '/s';
		}

		// Update the progress details
		this._progress_details_container[0].innerHTML = progress_details;
		
		// Update the peer details and pause/resume button
		if (this._state == this._StatusPaused || this._state == this._StatusStopping) {
			if (this._state == this._StatusPaused) {
				peer_details = 'Paused';
			} else {
				peer_details = 'Stopping...';
			}
			this._pause_resume_button_image[0].alt = 'Resume';
			this._pause_resume_button_image[0].className = "torrent_resume";
		} else {
			this._pause_resume_button_image[0].alt = 'Pause';
			this._pause_resume_button_image[0].className = "torrent_pause";
		}
		
		if (this._error_message && this._error_message != '' && this._error_message != 'other' ) {
			peer_details = this._error_message;
		}
		
		this._peer_details_container[0].innerHTML = peer_details;
	},
	
	/*
	 * Select this torrent
	 */
	select: function() {
		this._element.addClass('selected');
		
		// skipping height stuff on iPhone lets us omit dimensions.js; needs watching just in case
		if (!iPhone) {
			// Make sure it's visible in the torrent list (i.e. not too far down with the scrollbar all the way up)
			var container = $('#torrent_container'),
			offsetTop = this._element.position().top,
			scrollTop = container.scrollTop(),
			offsetHeight = this._element.outerHeight(),
			innerHeight = container.innerHeight();
			if (offsetTop < scrollTop) { // torrent is too far up
				container.scrollTop(offsetTop);
			} else if (innerHeight + scrollTop < offsetTop + offsetHeight) { // torrent is too far down
				container.scrollTop(offsetTop + offsetHeight - innerHeight);
			}
        }

        // Highlight it as selected
        this._element.addClass('selected');
  
		// Inform the controller
		this._controller.selectTorrent(this);
	},
	
	/*
	 * De-Select this torrent
	 */
	deselect: function() {		
		// Inform the controller
		this._controller.deselectTorrent(this);
	},
	
	/*
	 * Return true if this torrent is selected
	 */
	isSelected: function() {
		return this._element.is('.selected');
	},
	
	/*
	 * Remove this element from the dom
	 */
	remove: function() {
		this._element.remove();
	}
 
 
}



