/*
 *	Copyright © Malcolm Jarvis and Kendall Hopkins
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Class Torrent
 */
 
var Torrent = Class.create();
Torrent.prototype = {

    /*
     * Constructor
     */
    initialize: function(data) {
    
		/*
		 * Private Constants
		 */
		var _StatusDownloading;
		var _StatusSeeding; 
		var _StatusPaused; 
		var _MaxDownloadPercent;
		var _InfiniteTimeRemaining;
		this._StatusDownloading     = 'downloading';
		this._StatusSeeding         = 'seeding'; 
		this._StatusPaused          = 'paused'; 
		this._InfiniteTimeRemaining = 2147483647;
		
		this._MaxDownloadPercent  = 99; // reduce this to make the progress bar shorter
		
		/*
		 * Private Interface Variables
		 */
		var _controller;
		var _element;
		var _previous_torrent;
		var _next_torrent;
		var _position;
		var _name_container;
		var _progress_details_container;
		var _progress_complete_container;
		var _progress_incomplete_container;
		var _peer_details_container;
		
		/*
		 * Private Torrent Variables
		 */
		var _id;
		var _name;
		var _hash;
		var _date;
		var _size;
		var _completed;
		var _download_total;
		var _upload_total;
		var _download_speed;
		var _upload_speed;
		var _peers_downloading;
		var _peers_uploading;
		var _peers_from;
		var _peers_total;
		var _error;
		var _state;
		var _eta;
		var _running;
			
		// Initialise the torrent variables
		this._position          = data.position;
		this._id                = data.id;
		this._name              = data.name;
		this._hash              = data.hash;
		this._date              = data.date;
		this._size              = data.size;
		this._completed         = data.completed;
		this._download_total    = data.download_total;
		this._upload_total      = data.upload_total;
		this._download_speed    = data.download_speed;
		this._upload_speed      = data.upload_speed;
		this._peers_downloading = data.peers_downloading;
		this._peers_uploading   = data.peers_uploading;
		this._peers_from        = data.peers_from;
		this._peers_total       = data.peers_total;
		this._error             = data.error;
		this._state             = data.state;
		this._eta               = data.eta;
		this._running           = data.running;		
		
		// Create a new <li> element
		var element = document.createElement('li');
		Element.extend(element);
		element.addClassName('torrent');
		element.id = 'torrent_' + this._id;
		this._element = element;
		
		// Create the 'name' <div>
		this._name_container = document.createElement('div');
		Element.extend(this._name_container);
		this._name_container.addClassName('torrent_name');
		this._name_container.innerHTML= this._name;
		element.appendChild(this._name_container);
		
		// Create the 'progress details' <div>
		this._progress_details_container = document.createElement('div');
		Element.extend(this._progress_details_container);
		this._progress_details_container.addClassName('torrent_progress_details');
		this._progress_details_container.innerHTML= '&nbsp;'; // need this to push the rest down
		element.appendChild(this._progress_details_container);
			
		// Create the 'in progress' bar
		this._progress_complete_container = document.createElement('div');
		Element.extend(this._progress_complete_container);
		this._progress_complete_container.addClassName('torrent_progress_bar');
		this._progress_complete_container.addClassName('incomplete');
		this._progress_complete_container.style.width = '0%';
		element.appendChild(this._progress_complete_container);
			
		// Create the 'incomplete' bar (initially hidden)
		this._progress_incomplete_container = document.createElement('div');
		Element.extend(this._progress_incomplete_container);
		this._progress_incomplete_container.addClassName('torrent_progress_bar');
		this._progress_incomplete_container.addClassName('incomplete');
		this._progress_incomplete_container.style.display = 'none';
		element.appendChild(this._progress_incomplete_container);
		
		// Create the 'peer details' <div>
		this._peer_details_container = document.createElement('div');
		Element.extend(this._peer_details_container);
		this._peer_details_container.addClassName('torrent_peer_details');
		this._peer_details_container.innerHTML= '&nbsp;'; // need this to push the rest down
		element.appendChild(this._peer_details_container);
			
		// Set the click observer
		Event.observe(this._element, 'click', this.click.bindAsEventListener(this));
		
		// insert the element
		$('torrent_container').appendChild(element);
		
		// Update all the labels etc
		this.refresh();
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



	/*--------------------------------------------
	 * 
	 *  E V E N T   F U N C T I O N S
	 * 
	 *--------------------------------------------*/
	
	/*
	 * Process a click event on this torrent
	 */
	click: function(event) {
		
		Event.stop(event);
		// console.log($H(event).keys());
			
		// 'Apple' button emulation on PC :
		// Need settable meta-key and ctrl-key variables for mac emulation
		var meta_key = event.metaKey
		var ctrl_key = event.ctrlKey
		if (event.ctrlKey && navigator.appVersion.toLowerCase().indexOf("mac") == -1) {
			meta_key = true;
			ctrl_key = false;
		}
		
		// Shift-Click - Highlight a range between this torrent and the last-clicked torrent
		if (event.shiftKey) {
			this._controller.selectRange(this);
			// Need to deselect any selected text
			window.focus();
		
		// Apple-Click, not selected
		} else if (!this.isSelected() && meta_key) {
			this.select();
			
		// Regular Click, not selected
		} else if (!this.isSelected()) {
			this._controller.deselectAll();
			this.select();
		
		// Apple-Click, selected	
		} else if (this.isSelected() && meta_key) {
			this.deselect();
			
		// Regular Click, selected
		} else if (this.isSelected()) {
			this._controller.deselectAll();
			this.select();
		}
		
		this._controller.setLastTorrentClicked(this);
	},



	/*--------------------------------------------
	 * 
	 *  I N T E R F A C E   F U N C T I O N S
	 * 
	 *--------------------------------------------*/
	
	/*
	 * Refresh display
	 */
	refresh: function() {
		var progress_details;
		var peer_details;
		
		// Figure out the percent completed
		var float_percent_complete = this._completed / this._size * this._MaxDownloadPercent;
		var int_percent_complete = Math.ceil(float_percent_complete);

		// Add the progress bar
		if (int_percent_complete < this._MaxDownloadPercent) {
			
			// Create the 'progress details' label
			// Eg: '101 MB of 631 MB (16.02%) - 2 hr 30 min remaining'
			progress_details = Math.formatBytes(this._completed) + ' of ';
			progress_details += Math.formatBytes(this._size) + ' (';
			progress_details += Math.roundWithPrecision(float_percent_complete, 2) + '%) - ';
			if (this._eta == this._InfiniteTimeRemaining) {
				progress_details += 'remaining time unknown';
			} else {
				progress_details += Math.formatSeconds(this._eta) + ' remaining';
			}
			
			// Update the 'in progress' bar
			if (! this._progress_complete_container.hasClassName('in_progress')) {
				var class_name = (this._running) ? 'in_progress' : 'incomplete_stopped';
				this._progress_complete_container.className = '';
				this._progress_complete_container.addClassName('torrent_progress_bar');
				this._progress_complete_container.addClassName(class_name);
			}
			this._progress_complete_container.style.width = int_percent_complete + '%';
			
			// Update the 'in progress' bar
			if (! this._progress_incomplete_container.hasClassName('incomplete')) {
				this._progress_incomplete_container.className = '';
				this._progress_incomplete_container.addClassName('torrent_progress_bar');
				this._progress_incomplete_container.addClassName('in_progress');
			}
			this._progress_incomplete_container.style.width = (this._MaxDownloadPercent - int_percent_complete) + '%';
			this._progress_incomplete_container.style.display = 'block';
			
			// Create the 'peer details' label
			// Eg: 'Downloading from 36 of 40 peers - DL: 60.2 KB/s UL: 4.3 KB/s'
			peer_details = 'Downloading from ' + this._peers_uploading + ' of ';
			peer_details += this._peers_total + ' peers - DL: ';
			peer_details += Math.formatBytes(this._download_speed) + '/s UL: ';
			peer_details += Math.formatBytes(this._upload_speed) + '/s';
			
			
		} else {
			
			// Update the 'in progress' bar
			if (! this._progress_complete_container.hasClassName('complete')) {
				var class_name = (this._running) ? 'complete' : 'complete_stopped';
				this._progress_complete_container.className = '';
				this._progress_complete_container.addClassName('torrent_progress_bar');
				this._progress_complete_container.addClassName(class_name);
			}
			
			// Create the 'progress details' label
			// Eg: '698.05 MB, uploaded 8.59 GB (Ratio: 12.3)'
			var ratio = Math.roundWithPrecision((this._upload_total / this._size), 2);
			progress_details = Math.formatBytes(this._size) + ', uploaded ';
			progress_details += Math.formatBytes(this._upload_total) + ' (Ratio ';
			progress_details += ratio + ')';
			
			// Hide the 'incomplete' bar
			this._progress_incomplete_container.style.display = 'none';
			
			// Set progress to maximum
			this._progress_complete_container.style.width = this._MaxDownloadPercent + '%';
			
			// Create the 'peer details' label
			// Eg: 'Seeding to 13 of 22 peers - UL: 36.2 KB/s'
			peer_details = 'Seeding to ' + this._peers_downloading + ' of ';
			peer_details += this._peers_total + ' peers - UL: ';
			peer_details += Math.formatBytes(this._upload_speed) + '/s';
		}
		
		// Update the progress details
		this._progress_details_container.innerHTML = progress_details;
		
		// Update the peer details
		if (this._state == this._StatusPaused) {
			peer_details = 'Paused';
		}
		this._peer_details_container.innerHTML = peer_details;
	},
	
	/*
	 * Select this torrent
	 */
	select: function() {
		this._element.addClassName('selected');
		
		// Figure out if this is the highest selected torrent
		if (this._controller.highestSelected() == null || 
			this._controller.highestSelected().position() > this._position) {
			this._controller.setHighestSelected(this);
		}
		
		// Figure out if this is the lowest selected torrent
		if (this._controller.lowestSelected() == null || 
			this._controller.lowestSelected().position() < this._position) {
			this._controller.setLowestSelected(this);
		}
	},
	
	/*
	 * De-Select this torrent
	 */
	deselect: function() {
		this._element.removeClassName('selected');
		
		// May need to re-calculate the controllers highest selected torrent :
		// work down the list until the next selected torrent
		if (this == this._controller.highestSelected()) {
			var torrent = this._next_torrent;
			var found = false;
			while (found == false && torrent != null) {
				if 	(torrent.isSelected()) {
					found = true;
					this._controller.setHighestSelected(torrent)
				}
				torrent = torrent.nextTorrent();
			}
		}
		
		// May need to re-calculate the controllers lowest selected torrent :
		// work down the list until the next selected torrent
		if (this == this._controller.lowestSelected()) {
			torrent = this._previous_torrent;
			found = false;
			while (found == false && torrent != null) {
				if 	(torrent.isSelected()) {
					found = true;
					this._controller.setLowestSelected(torrent)
				}
				torrent = torrent.previousTorrent();
			}
		}
	},
	
	/*
	 * Return true if this torrent is selected
	 */
	isSelected: function() {
		return this._element.hasClassName('selected');
	}
 
 
}



