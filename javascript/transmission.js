/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Class Transmission
 */
 
var Transmission = Class.create();
Transmission.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
    
		/*
		 * Private Constants
		 */
		var _RefreshInterval;
		this._RefreshInterval = 5;
		
        /*
         * Private Variables
         */
		var _filter_visible;
        var _torrent_list;
        var _last_torrent_clicked;
        var _highest_selected;
        var _lowest_selected;
        var _inspector_visible;
		this._filter_visible = true;
		this._inspector_visible = true;
		
        
        this._torrent_list = new Hash({});
        
        // Get the initial list of torrents from the remote app
        this.getTorrentList();
        
        // Observe key presses
        document.addEventListener("keydown", this.keyDown.bindAsEventListener(this),false);

		// Buttons
		Event.observe($('pause_all_link'), 'mousedown', this.click_pause_all_button.bindAsEventListener(this));
		Event.observe($('pause_all_link'), 'mouseup', this.release_pause_all_button.bindAsEventListener(this));
		Event.observe($('pause_all_link'), 'mouseout', this.mouseout_pause_all_button.bindAsEventListener(this));

		Event.observe($('resume_all_link'), 'mousedown', this.click_resume_all_button.bindAsEventListener(this));
		Event.observe($('resume_all_link'), 'mouseup', this.release_resume_all_button.bindAsEventListener(this));
		Event.observe($('resume_all_link'), 'mouseout', this.mouseout_resume_all_button.bindAsEventListener(this));
		
		Event.observe($('filter'), 'mousedown', this.click_filter_button.bindAsEventListener(this));
		Event.observe($('filter'), 'mouseup', this.release_filter_button.bindAsEventListener(this));
		Event.observe($('filter'), 'mouseout', this.mouseout_filter_button.bindAsEventListener(this));

		Event.observe($('pause_selected_link'), 'mousedown', this.click_pause_selected_button.bindAsEventListener(this));
		Event.observe($('pause_selected_link'), 'mouseup', this.release_pause_selected_button.bindAsEventListener(this));
		Event.observe($('pause_selected_link'), 'mouseout', this.mouseout_pause_selected_button.bindAsEventListener(this));

		Event.observe($('resume_selected_link'), 'mousedown', this.click_resume_selected_button.bindAsEventListener(this));
		Event.observe($('resume_selected_link'), 'mouseup', this.release_resume_selected_button.bindAsEventListener(this));
		Event.observe($('resume_selected_link'), 'mouseout', this.mouseout_resume_selected_button.bindAsEventListener(this));

		Event.observe($('open_link'), 'mousedown', this.click_open_button.bindAsEventListener(this));
		Event.observe($('open_link'), 'mouseup', this.release_open_button.bindAsEventListener(this));
		Event.observe($('open_link'), 'mouseout', this.mouseout_open_button.bindAsEventListener(this));

		Event.observe($('remove_link'), 'mousedown', this.click_remove_button.bindAsEventListener(this));
		Event.observe($('remove_link'), 'mouseup', this.release_remove_button.bindAsEventListener(this));
		Event.observe($('remove_link'), 'mouseout', this.mouseout_remove_button.bindAsEventListener(this));

		Event.observe($('filter_link'), 'mousedown', this.click_filter_button.bindAsEventListener(this));
		Event.observe($('filter_link'), 'mouseup', this.release_filter_button.bindAsEventListener(this));
		Event.observe($('filter_link'), 'mouseout', this.mouseout_filter_button.bindAsEventListener(this));

		Event.observe($('inspector_link'), 'mousedown', this.click_inspector_button.bindAsEventListener(this));
		Event.observe($('inspector_link'), 'mouseup', this.release_inspector_button.bindAsEventListener(this));
		Event.observe($('inspector_link'), 'mouseout', this.mouseout_inspector_button.bindAsEventListener(this));

		// Create a periodical executer to refresh the list
		new PeriodicalExecuter(this.reloadTorrents, this._RefreshInterval);
    },
    

    /*--------------------------------------------
     * 
     *  S E T T E R S   /   G E T T E R S
     * 
     *--------------------------------------------*/
    
    /*
     * Return the last torrent clicked
     */
    lastTorrentClicked: function() {
        return this._last_torrent_clicked;
    },
    
    /*
     * Set the last torrent clicked
     */
    setLastTorrentClicked: function(torrent) {
        this._last_torrent_clicked = torrent;
    },
    
    /*
     * Return the highest selected (ie closest to the top) torrent in the list
     */
    highestSelected: function() {
        return this._highest_selected;
    },
    
    /*
     * Set the highest selected (ie closest to the top) torrent in the list
     */
    setHighestSelected: function(torrent) {
        this._highest_selected = torrent;
    },
    
    /*
     * Return the lowest selected (ie closest to the bottom) torrent in the list
     */
    lowestSelected: function() {
        return this._lowest_selected;
    },
    
    /*
     * Set the lowest selected (ie closest to the bottom) torrent in the list
     */
    setLowestSelected: function(torrent) {
        this._lowest_selected = torrent;
    },


    
    /*--------------------------------------------
     * 
     *  E V E N T   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Process key event
     */
    keyDown: function(event) {
        var selected_torrent;
        
        // Down Arrow Key
        if (event.keyCode == 40 && this._lowest_selected != null) {
            selected_torrent = this._lowest_selected;
            if (selected_torrent.nextTorrent() != null) {
                selected_torrent = selected_torrent.nextTorrent();
            }
            this.deselectAll();
            selected_torrent.select();
            this._last_torrent_clicked = selected_torrent;
            
        // Up Arrow key	
        } else if (event.keyCode == 38) {
            selected_torrent = this._highest_selected;
            if (selected_torrent.previousTorrent() != null) {
                selected_torrent = selected_torrent.previousTorrent();
            }
            this.deselectAll();
            selected_torrent.select();
            this._last_torrent_clicked = selected_torrent;
        }
    },

	/*
	 * Process a mouse-down event on the 'pause all' button
	 */
	click_pause_all_button: function(event) {

		Event.stop(event);
			
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'pause all' button
	 */
	release_pause_all_button: function(event) {

		Event.stop(event);
			
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all.png)';
		
		// Send an ajax request to perform the action
		this.remoteRequest('pauseTorrents');
	},

	mouseout_pause_all_button: function(event) {
		Event.stop(event);
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all.png)';
	},

	/*
	 * Process a mouse-down event on the 'resume all' button
	 */
	click_resume_all_button: function(event) {

		Event.stop(event);

		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'resume all' button
	 */
	release_resume_all_button: function(event) {

		Event.stop(event);
			
		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all.png)';
		
		// Send an ajax request to perform the action
		this.remoteRequest('resumeTorrents');
	},

	mouseout_resume_all_button: function(event) {
		Event.stop(event);
		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all.png)';
	},

	/*
	 * Process a mouse-down event on the 'pause selected' button
	 */
	click_pause_selected_button: function(event) {

		Event.stop(event);
			
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'pause selected' button
	 */
	release_pause_selected_button: function(event) {

		Event.stop(event);
			
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected.png)';
		
		// Send an ajax request to perform the action
		//this.remoteRequest('pauseTorrents');
	},

	mouseout_pause_selected_button: function(event) {
		Event.stop(event);
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected.png)';
	},

	/*
	 * Process a mouse-down event on the 'resume selected' button
	 */
	click_resume_selected_button: function(event) {

		Event.stop(event);

		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'resume selected' button
	 */
	release_resume_selected_button: function(event) {

		Event.stop(event);
			
		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected.png)';
		
		// Send an ajax request to perform the action
		//this.remoteRequest('resumeTorrents');
	},

	mouseout_resume_selected_button: function(event) {
		Event.stop(event);
		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected.png)';
	},

	/*
	 * Process a mouse-down event on the 'open' button
	 */
	click_open_button: function(event) {
	
		Event.stop(event);

		$('open_link').style.backgroundImage = 'url(images/buttons/open_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	release_open_button: function(event) {

		Event.stop(event);
		
		$('open_link').style.backgroundImage = 'url(images/buttons/open.png)';
	},

	mouseout_open_button: function(event) {
		Event.stop(event);
		$('open_link').style.backgroundImage = 'url(images/buttons/open.png)';
	},

	/*
	 * Process a mouse-down event on the 'remove' button
	 */
	click_remove_button: function(event) {
	
		Event.stop(event);

		$('remove_link').style.backgroundImage = 'url(images/buttons/remove_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'remove' button
	 */
	release_remove_button: function(event) {

		Event.stop(event);
		
		$('remove_link').style.backgroundImage = 'url(images/buttons/remove.png)';
	},

	mouseout_remove_button: function(event) {
		Event.stop(event);
		$('remove_link').style.backgroundImage = 'url(images/buttons/remove.png)';
	},

	/*
	 * Process a mouse-down event on the 'inspector' button
	 */
	click_inspector_button: function(event) {
	
		Event.stop(event);

		$('inspector_link').style.backgroundImage = 'url(images/buttons/info_toolbar_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'inspector' button
	 */
	release_inspector_button: function(event) {

		Event.stop(event);
		
		$('inspector_link').style.backgroundImage = 'url(images/buttons/info.png)';
		
		// Perform the toggle
		var container_right;
		if (this._inspector_visible) {
			container_right = parseInt($('torrent_container').getStyle('right')) - parseInt($('torrent_inspector').getWidth()) + 1;
			$('torrent_container').style.right = container_right + "px";
			$('torrent_filter_bar').style.right = container_right + "px";
			$('torrent_inspector').hide();
			this._inspector_visible = false;
		} else {
			container_right = parseInt($('torrent_container').getStyle('right')) + parseInt($('torrent_inspector').getWidth());
			$('torrent_container').style.right = container_right + "px";
			$('torrent_filter_bar').style.right = container_right + "px";
			$('torrent_inspector').show();
			this._inspector_visible = true;
		}
	},

	mouseout_inspector_button: function(event) {
		Event.stop(event);
		$('inspector_link').style.backgroundImage = 'url(images/buttons/info.png)';
	},
    /*
     * Change the state of the filter button when clicked
     */
	click_filter_button: function(event) {

		Event.stop(event);

		$('filter_link').style.backgroundImage = 'url(images/buttons/filter_on.png)';	
	},
    
    /*
     * Show/hide the filter button
     */
	release_filter_button: function(event) {

		Event.stop(event);
		
		$('filter_link').style.backgroundImage = 'url(images/buttons/filter.png)';
		
		// Perform the toggle
		var container_top;
		if (this._filter_visible) {
			container_top = parseInt($('torrent_container').getStyle('top')) - parseInt($('torrent_filter_bar').getHeight()) + 1;
			$('torrent_container').style.top = container_top + "px";
			$('torrent_filter_bar').hide();
			this._filter_visible = false;
		} else {
			container_top = parseInt($('torrent_container').getStyle('top')) + parseInt($('torrent_filter_bar').getHeight());
			$('torrent_container').style.top = container_top + "px";
			$('torrent_filter_bar').show();
			this._filter_visible = true;
		}
	},

	mouseout_filter_button: function(event) {
		Event.stop(event);
		$('filter_link').style.backgroundImage = 'url(images/buttons/filter.png)';
	},

    /*--------------------------------------------
     * 
     *  I N T E R F A C E   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Select all torrents in the list
     */
    selectAll: function() {
        this._torrent_list.values().invoke('select');
    },
    
    /*
     * De-select all torrents in the list
     */
    deselectAll: function() {
        this._torrent_list.values().invoke('deselect');
        
        // reset the highest and lowest selected
        this._highest_selected = null;
        this._lowest_selected = null;
    },
    
    /*
     * Select a range from this torrent to the last clicked torrent
     */
    selectRange: function(torrent) {
        var torrent;
        
        // The last clicked torrent is above this one in the list
        if (this._last_torrent_clicked.position() < torrent.position()) {
            // if the last clicked torrent is not selected, walk down the
            // list until we find one that is
            while (!this._last_torrent_clicked.isSelected() && 
                    this._last_torrent_clicked.nextTorrent() != null) {
                this._last_torrent_clicked = this._last_torrent_clicked.nextTorrent();
            }
            
            while (torrent != null && torrent.position() > this._last_torrent_clicked.position()) {
                torrent.select();
                torrent = torrent.previousTorrent();
            }
        
        // The last clicked torrent is below this one in the list
        } else if (this._last_torrent_clicked.position() > torrent.position()) {
            // if the last clicked torrent is not selected, walk up the
            // list until we find one that is
            while (!this._last_torrent_clicked.isSelected() && 
                    this._last_torrent_clicked.previousTorrent() != null) {
                this._last_torrent_clicked = this._last_torrent_clicked.previousTorrent();
            }
            
            while (torrent != null && torrent.position() < this._last_torrent_clicked.position()) {
                torrent.select();
                torrent = torrent.nextTorrent();
            }
        }
    },
    
    /*
     * Load a list of torrents into the application
     */
    addTorrents: function(torrent_list) {
        var torrent_data;
        var torrent;
        var previous_torrent;
        
        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
            torrent_data.position = i+1;
            torrent = new Torrent(torrent_data);
            
            // Set the controller
            torrent.setController(this);
            
            // Set this torrent's neighbours
            if (previous_torrent != null) {
                torrent.setPreviousTorrent(previous_torrent);
                previous_torrent.setNextTorrent(torrent);
            }
            
            // Add to the collection
            this._torrent_list[torrent_data.id] = torrent;
            
            previous_torrent = torrent;
        }
    },
    
    /*
     * Load a list of torrents into the application
     */
    refreshTorrents: function(torrent_list) {
		var global_up_speed = 0;
		var global_down_speed = 0;
		var global_down_speed = 0;
        var torrent_data;
        
        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
			this._torrent_list[torrent_data.id].refresh(torrent_data);
			global_up_speed += torrent_data.upload_speed;
			global_down_speed += torrent_data.download_speed;
        }

		// Update global upload and download speed display
		$('torrent_global_upload').innerHTML = 'Total UL: ' + Math.formatBytes(global_up_speed) + '/s';
		$('torrent_global_download').innerHTML = 'Total DL: ' + Math.formatBytes(global_down_speed) + '/s';
		$('torrent_global_transfer').innerHTML = torrent_list.length + ' Transfers';
    },


    /*--------------------------------------------
     * 
     *  A J A X   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Perform a generic remote request
     */
    remoteRequest: function(action, param) {
		if (param == null) {
			param = '[]';
		}
        new Ajax.Request('remote/?action=' + action + '&param=' + param, {method: 'get'	});
    },
    
    /*
     * Request the list of torrents from the client
     */
    getTorrentList: function() {
        this.remoteRequest('getTorrentList');	
    },
    
    /*
     * Refrsh the torrent data
     */
    reloadTorrents: function() {
        transmission.remoteRequest('reloadTorrents');	
    }



}