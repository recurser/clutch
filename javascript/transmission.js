/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Class Transmission
 */

function Transmission(){
    // Constants
	this._RefreshInterval   = 5000; // Milliseconds
	this._FilterAll         = 'all';
	this._FilterSeeding     = 'seeding';
	this._FilterDownloading = 'downloading';
	this._FilterPaused      = 'paused';
	this._current_filter    = this._FilterAll;

    this.initialize();
} 
 
Transmission.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
		
        /*
         * Private Variables
         */
		this._filter_visible = true;
		this._inspector_visible = false;
		this._speed_limit_active = false;
		
		// Initialise the torrent lists
        this._torrents = new Hash();
        this._selected_torrents = new Hash();
        
        // Get the initial list of torrents from the remote app
        this.getTorrentList();
        
        // Observe key presses
		$(document).bind('keydown', {transmission: this}, this.keyDown);

		// Buttons
		$('#pause_all_link').bind('click', {transmission: this}, this.releasePauseAllButton);
		$('#resume_all_link').bind('click', {transmission: this}, this.releaseResumeAllButton);
		$('#pause_selected_link').bind('click', {transmission: this}, this.releasePauseSelectedButton);
		$('#resume_selected_link').bind('click', {transmission: this}, this.releaseResumeSelectedButton);
		$('#open_link').bind('click', {transmission: this}, this.releaseOpenButton);
		$('#remove_link').bind('click', {transmission: this}, this.releaseRemoveButton);
		$('#filter_toggle_link').bind('click', {transmission: this}, this.releaseFilterToggleButton);
		$('#inspector_link').bind('click', {transmission: this}, this.releaseInspectorButton);
		$('#filter_all_link').bind('click', {transmission: this}, this.releaseFilterAllButton);
		$('#filter_downloading_link').bind('click', {transmission: this}, this.releaseFilterDownloadingButton);
		$('#filter_seeding_link').bind('click', {transmission: this}, this.releaseFilterSeedingButton);
		$('#filter_paused_link').bind('click', {transmission: this}, this.releaseFilterPausedButton);
		$('#upload_confirm_button').bind('click', {transmission: this}, this.releaseUploadConfirmButton);
		$('#upload_cancel_button').bind('click', {transmission: this}, this.releaseUploadCancelButton);
		$('#speed_limit_button').bind('click', {transmission: this}, this.releaseSpeedLimitButton);
		
						
		// Bind the upload iframe's onload event to process uploads
		$('#torrent_upload_frame').load(this.processUpload);
		
		// Inspector tabs
		$('#inspector_tab_info').bind('click', {transmission: this}, this.releaseInspectorTab);
		$('#inspector_tab_activity').bind('click', {transmission: this}, this.releaseInspectorTab);
		
		// Set up the right-click context menu
		this.createContextMenu();
		
		// Setup the footer settings menu
		this.createSettingsMenu();

		// Create a periodical executer to refresh the list
		setInterval('transmission.reloadTorrents()', this._RefreshInterval);
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
    
    /*
     * Return a JSON string of torrent IDs
     */
    jsonTorrentIds: function() {
		var result = $.toJSON(this._torrents.keys());
		if (parseInt(result) == result) {
			result = '[' + result + ']'
		}
		return result;
    },
    
    /*
     * Return a JSON string of torrent IDs
     */
    jsonSelectedTorrentIds: function() {
		var result = $.toJSON(this._selected_torrents.keys());
		if (parseInt(result) == result) {
			result = '[' + result + ']'
		}
		return result;
    },
    
    /*
     * Return the number of selected torrents
     */
    numTorrents: function() {
		return this._torrents.length()
    },
    
    /*
     * Return the number of selected torrents
     */
    numSelectedTorrents: function() {
		return this._selected_torrents.length()
    },
    
    /*
     * Register the specified torrent as selected
     */
    selectTorrent: function(torrent) {
		
		// Figure out if this is the highest selected torrent
		if (this._highestSelected == null || 
			this._highestSelected.position() > torrent.position()) {
			this.setHighestSelected(torrent);
		}
		
		// Figure out if this is the lowest selected torrent
		if (this._lowestSelected == null || 
			this._lowestSelected.position() < torrent.position()) {
			this.setLowestSelected(torrent);
		}	
		
		// Store this in the list of selected torrents	
        if (!this._selected_torrents.hasKey(torrent.id())) {
			this._selected_torrents.set(torrent.id(), torrent);
		}

		// Display in Inspector
		this.updateInspector();
    },
    
    /*
     * Register the specified torrent as de-selected
     */
    deselectTorrent: function(torrent, ignore_inspector_update) {
	
		var temp_torrent;
		var found;
		
		if (ignore_inspector_update == null) {
			ignore_inspector_update = false
		}
		
		// De-select the torrent via css
		torrent.element().removeClass('selected');
		
		// May need to re-calculate the controllers highest selected torrent :
		// work down the list until the next selected torrent
		if (torrent == transmission._highestSelected) {
			temp_torrent = torrent._next_torrent;
			found = false;
			while (found == false && temp_torrent != null) {
				if 	(temp_torrent.isSelected()) {
					found = true;
					transmission._highestSelected = temp_torrent;
				}
				temp_torrent = temp_torrent.nextTorrent();
			}
		}
		
		// May need to re-calculate the controllers lowest selected torrent :
		// work down the list until the next selected torrent
		if (torrent == transmission._lowestSelected) {
			temp_torrent = torrent._previous_torrent;
			found = false;
			while (found == false && temp_torrent != null) {
				if 	(temp_torrent.isSelected()) {
					found = true;
					transmission._lowestSelected = temp_torrent;
				}
				temp_torrent = temp_torrent.previousTorrent();
			}
		}
		
		// Remove this from the list of selected torrents
		transmission._selected_torrents.remove(torrent.id());

		// Display in Inspector
		if (!ignore_inspector_update) {
			transmission.updateInspector();
		}
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
		
		var transmission = event.data.transmission;
        var selected_torrent;

        // Down Arrow Key
        if (event.keyCode == 40 && transmission._lowest_selected != null) {
            selected_torrent = transmission._lowest_selected;
            if (selected_torrent.nextTorrent() != null) {
                selected_torrent = selected_torrent.nextTorrent();
            }
            transmission.deselectAll();
            selected_torrent.select();
            transmission._last_torrent_clicked = selected_torrent;
            
        // Up Arrow key	
        } else if (event.keyCode == 38) {
            selected_torrent = transmission._highest_selected;
            if (selected_torrent.previousTorrent() != null) {
                selected_torrent = selected_torrent.previousTorrent();
            }
            transmission.deselectAll();
            selected_torrent.select();
            transmission._last_torrent_clicked = selected_torrent;
		}
    },

	/*
	 * Process a mouse-up event on the 'pause all' button
	 */
	releasePauseAllButton: function(event) {
		event.data.transmission.pauseTorrents(transmission.jsonTorrentIds());
	},

	/*
	 * Process a mouse-up event on the 'resume all' button
	 */
	releaseResumeAllButton: function(event) {
		event.data.transmission.resumeTorrents(transmission.jsonTorrentIds());
	},

	/*
	 * Process a mouse-up event on the 'pause selected' button
	 */
	releasePauseSelectedButton: function(event) {
		event.data.transmission.pauseSelectedTorrents();
	},

	/*
	 * Process a mouse-up event on the 'resume selected' button
	 */
	releaseResumeSelectedButton: function(event) {
		event.data.transmission.resumeSelectedTorrents();
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseOpenButton: function(event) {
		event.data.transmission.uploadTorrentFile();	
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadCancelButton: function(event) {
		$('#upload_container').hide();
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadConfirmButton: function(event) {
		event.data.transmission.uploadTorrentFile(true);
	},

	/*
	 * Process a mouse-up event on the 'remove' button
	 */
	releaseRemoveButton: function(event) {	
		event.data.transmission.removeSelectedTorrents();
	},

	/*
	 * Process a mouse-up event on the 'inspector' button
	 */
	releaseInspectorButton: function(event) {
		
		// Perform the toggle
		if (event.data.transmission._inspector_visible) {
			event.data.transmission.hideInspector();
		} else {
			event.data.transmission.showInspector();
		}
	},

	/*
	 * Process a mouse-up event on an 'inspector' tab
	 */
	releaseInspectorTab: function(event) {
		
		// Unselect all the tabs, select the clicked tab, and display the appropriate info
		var tab_ids = ['inspector_tab_info', 'inspector_tab_activity'];
        for (i=0; i<tab_ids.length; i++) {
			if (this.id == tab_ids[i]) {
				$('#' + tab_ids[i]).addClass('selected');
				$('#' + tab_ids[i] + '_container').show();
			} else {
				$('#' + tab_ids[i]).removeClass('selected');
				$('#' + tab_ids[i] + '_container').hide();
			}
		}
	},
	
    /*
     * Process a mouse-up event on the 'filter' button
     */
	releaseFilterToggleButton: function(event) {
		
		// Perform the toggle
		var container_top;
		if (event.data.transmission._filter_visible) {
			container_top = parseInt($('#torrent_container').css('top')) - $('#torrent_filter_bar').height();
			$('#torrent_container').css('top', container_top + 'px');
			$('#torrent_filter_bar').hide();
			event.data.transmission._filter_visible = false;
		} else {
			container_top = parseInt($('#torrent_container').css('top')) + $('#torrent_filter_bar').height();
			$('#torrent_container').css('top', container_top + 'px');
			$('#torrent_filter_bar').show();
			event.data.transmission._filter_visible = true;
		}
	},

	/*
	 * Process a mouse-up event on the 'filter all' button
	 */
	releaseFilterAllButton: function(event) {	
		event.data.transmission.filterTorrents(event.data.transmission._FilterAll);
	},

	/*
	 * Process a mouse-up event on the 'filter downloading' button
	 */
	releaseFilterDownloadingButton: function(event) {
		event.data.transmission.filterTorrents(event.data.transmission._FilterDownloading);
	},

	/*
	 * Process a mouse-up event on the 'filter seeding' button
	 */
	releaseFilterSeedingButton: function(event) {	
		event.data.transmission.filterTorrents(event.data.transmission._FilterSeeding);
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseFilterPausedButton: function(event) {
		event.data.transmission.filterTorrents(event.data.transmission._FilterPaused);
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseSpeedLimitButton: function(event) {
		event.data.transmission.toggleSpeedLimit();
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
		this._torrents.invoke('select');
    },
    
    /*
     * De-select all torrents in the list
     */
    deselectAll: function() {
		this._torrents.each(this.deselectTorrent, true);
        
        // reset the highest and lowest selected
        this._highest_selected = null;
        this._lowest_selected = null;
    },
    
    /*
     * Create the torrent right-click menu
     */
	createContextMenu: function() {
		
		var bindings = {
			context_pause_selected:    this.pauseSelectedTorrents,
			context_resume_selected:   this.resumeSelectedTorrents,
			context_remove:            this.removeSelectedTorrents,
			context_toggle_inspector:  this.toggleInspector
		};
		
		// Setup the context menu
		$('ul#torrent_list').contextMenu('torrent_context_menu', {
			bindings:       bindings,
			menuStyle:      Menu.context.menu_style,
			itemStyle:      Menu.context.item_style,
			itemHoverStyle: Menu.context.item_hover_style
		});
	},
    
    /*
     * Create the bottom settings menu
     */
	createSettingsMenu: function() {
		$('#settings_menu').transMenu({
			direction: 'up'
		});
	},
    
    /*
     * Select a range from this torrent to the last clicked torrent
     */
    selectRange: function(torrent) {
        
		if (!this._last_torrent_clicked) {
			torrent.select();
			
        // The last clicked torrent is above this one in the list
        } else if (this._last_torrent_clicked.position() < torrent.position()) {
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
    addTorrents: function(torrent_list, initialise_list) {
        var torrent_data;
        var torrent;
        var previous_torrent;
		var global_up_speed = 0;
		var global_down_speed = 0;
		
		// Clear the inspector
		this.deselectAll();
		this.updateInspector();
		
		if (initialise_list == null) {
			initialise_list = true;
		}
				
		// Initialise the torrent lists (this function gets called for filtering as well as onLoad)
		if (initialise_list) {
			this.removeTorrents(this._torrents.keys());
	        this._last_torrent_clicked = null;
	        this._highest_selected = null;
	        this._lowest_selected = null;
        }
		
		var num_existing_torrents = this._torrents.length();
		var num_new_torrents = torrent_list.length;
        for (i=0; i<num_new_torrents; i++) {
            torrent_data = torrent_list[i];
            torrent_data.position = i+1+num_existing_torrents;
            torrent = new Torrent(torrent_data);
            
			// Set the global up and down speeds 
			global_up_speed += torrent_data.upload_speed;
			global_down_speed += torrent_data.download_speed;
			
            // Set the controller
            torrent.setController(this);
            
            // Set this torrent's neighbours
            if (previous_torrent != null) {
                torrent.setPreviousTorrent(previous_torrent);
                previous_torrent.setNextTorrent(torrent);
            }
            
            // Add to the collection
            this._torrents.set(torrent.id(), torrent);
            
            previous_torrent = torrent;
        }

		// Update global upload and download speed display
		this.setGlobalSpeeds(torrent_list.length, global_up_speed, global_down_speed);
    },

	updateInspector: function() {
		if (this._inspector_visible) {
			var torrent_count = this.numSelectedTorrents();
			
			// If only one torrent is selected, update all fields
			if (torrent_count == 1) {
				torrent = this._selected_torrents.first();
				$('#torrent_inspector_name')[0].innerHTML			= torrent._name;
				$('#torrent_inspector_size')[0].innerHTML			= Math.formatBytes(torrent._size);
				$('#torrent_inspector_tracker')[0].innerHTML		= torrent._tracker['address']+
															  		':'+torrent._tracker['port']+
															  		torrent._tracker['announce'];

				$('#torrent_inspector_hash')[0].innerHTML			= torrent._hash;
				$('#torrent_inspector_state')[0].innerHTML			= torrent._state;
				$('#torrent_inspector_ratio')[0].innerHTML			= torrent.ratio();
				$('#torrent_inspector_uploaded')[0].innerHTML		= Math.formatBytes(torrent._upload_total);
				$('#torrent_inspector_downloaded')[0].innerHTML		= Math.formatBytes(torrent._download_total);
				$('#torrent_inspector_upload_to')[0].innerHTML		= torrent._peers_downloading;
				$('#torrent_inspector_download_from')[0].innerHTML	= torrent._peers_uploading;
				$('#torrent_inspector_swarm_speed')[0].innerHTML	= torrent._swarm_speed;
				$('#torrent_inspector_total_seeders')[0].innerHTML	= torrent._total_seeders;
				$('#torrent_inspector_total_leechers')[0].innerHTML	= torrent._total_leechers;		
		
				if (torrent._error_message && torrent._error_message != '') {
					$('#torrent_inspector_error')[0].innerHTML		= torrent._error_message;
				} else {
					$('#torrent_inspector_error')[0].innerHTML		= 'N/A';
				}
				if (torrent._comment && torrent._comment != '') {
					$('#torrent_inspector_comment')[0].innerHTML	= torrent._comment;
				} else {
					$('#torrent_inspector_comment')[0].innerHTML	= 'N/A';
				}
				if (torrent._creator && torrent._creator != '') {
					$('#torrent_inspector_creator')[0].innerHTML	= torrent._creator;
				} else {
					$('#torrent_inspector_creator')[0].innerHTML	= 'N/A';
				}

				if (torrent._private == 1) {
					$('#torrent_inspector_secure')[0].innerHTML 	= 'Private Torrent';
				} else {
					$('#torrent_inspector_secure')[0].innerHTML		= 'Public Torrent';
				}

				$('#torrent_inspector_creator_date')[0].innerHTML	= Math.formatTimestamp(torrent._creator_date);
			
			// Otherwise, just update up/down totals
			} else {
				var total_upload = 0;
				var total_download = 0;
				for (i=0; i<torrent_count; i++) {
					total_upload += this._selected_torrents.itemByIndex(i)._upload_total;
					total_download += this._selected_torrents.itemByIndex(i)._download_total;
				}
				if (torrent_count == 0) {
					$('#torrent_inspector_name')[0].innerHTML			= 'No Torrent Selected';
				} else {
					$('#torrent_inspector_name')[0].innerHTML			= torrent_count + ' Torrents Selected';
				}
				$('#torrent_inspector_size')[0].innerHTML			= '';
				$('#torrent_inspector_tracker')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_hash')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_state')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_ratio')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_uploaded')[0].innerHTML		= Math.formatBytes(total_upload);
				$('#torrent_inspector_downloaded')[0].innerHTML		= Math.formatBytes(total_download);
				$('#torrent_inspector_upload_to')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_download_from')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_swarm_speed')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_total_seeders')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_total_leechers')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_creator')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_comment')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_creator_date')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_secure')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_error')[0].innerHTML			= 'N/A';
			}
		}
	},
    
    /*
     * Toggle the inspector (used by the context menu)
     */
	toggleInspector: function() {
		if (transmission._inspector_visible) {
			transmission.hideInspector();
		} else {
			transmission.showInspector();
		}
	},
    
    /*
     * Toggle the speed limit switch
     */
	toggleSpeedLimit: function() {
		if (transmission._speed_limit_active) {
			$('#speed_limit_button').css('backgroundImage', "url('/images/buttons/footer_speed_limit_button.png')");
			transmission._speed_limit_active = false;
		} else {
			$('#speed_limit_button').css('backgroundImage', "url('/images/buttons/footer_speed_limit_button_blue.png')");
			transmission._speed_limit_active = true
		}
	},
    
    /*
     * Show the inspector
     */
	showInspector: function() {
		$('#torrent_filter_bar')[0].style.right = $('#torrent_inspector').width() + 'px';
		$('#torrent_container')[0].style.right = $('#torrent_inspector').width() + 'px';
		$('#torrent_inspector').show();
		transmission._inspector_visible = true;
		transmission.updateInspector();
		
		$('ul li#context_toggle_inspector')[0].innerHTML = 'Hide Inspector';
	},
    
    /*
     * Hide the inspector
     */
	hideInspector: function() {
		$('#torrent_filter_bar')[0].style.right = '0px';
		$('#torrent_container')[0].style.right = '0px';
		$('#torrent_inspector').hide();
		transmission._inspector_visible = false;
		
		$('ul li#context_toggle_inspector')[0].innerHTML = 'Show Inspector';
	},

    /*
     * Load a list of torrents into the application
     */
    refreshTorrents: function(torrent_list) {
		var global_up_speed = 0;
		var global_down_speed = 0;
        var torrent_data;
        var torrent_ids = this._torrents.keys().clone();
        var new_torrents = [];

        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
	
			// If this torrent already exists, refresh it & remove this ID from torrent_ids
			if (torrent_ids.inArray(torrent_data.id)) {
				this._torrents.item(torrent_data.id).refresh(torrent_data);
				global_up_speed += torrent_data.upload_speed;
				global_down_speed += torrent_data.download_speed;
				torrent_ids.remove(torrent_data.id);
			
			// Otherwise, this is a new torrent - add it
			} else {
				new_torrents.push(torrent_data);
			}
        }
		
		// Add any torrents that aren't already being displayed
		if (new_torrents.length > 0) {
			transmission.addTorrents(new_torrents, false);
		}
		
		// Remove any torrents that are displayed but not in the refresh list
		// The 'update_only' flag is sent went pausing/resuming torrents
		if (torrent_ids.length > 0) {
			transmission.removeTorrents(torrent_ids);
		}
		
		// Update global upload and download speed display
		this.setGlobalSpeeds(torrent_list.length, global_up_speed, global_down_speed);
		
		// Update the inspector
		this.updateInspector();
    },

    /*
     * Load a list of torrents into the application
     */
    removeTorrents: function(torrent_id_list) {
		if (torrent_id_list.length != 0) {
        	for (i=0; i<torrent_id_list.length; i++) {	
				transmission._torrents.item(torrent_id_list[i]).element().remove();
				transmission._torrents.remove(torrent_id_list[i]);
				transmission._selected_torrents.remove(torrent_id_list[i]);
        	}
		}
		
		// Clear the inspector
		transmission.deselectAll();
		transmission.updateInspector();
		transmission.setGlobalSpeeds(this._torrents.length());
    },
    
    /*
     * Set the global up and down speed in the interface
     */
    setGlobalSpeeds: function(num_torrents, global_up_speed, global_down_speed) {
	
		if (num_torrents) {
			$('#torrent_global_transfer')[0].innerHTML = num_torrents + ' Transfers';
		}
		
		if (global_up_speed) {
			$('#torrent_global_upload')[0].innerHTML = 'Total UL: ' + Math.formatBytes(global_up_speed, true) + '/s';
		}
		
		if (global_down_speed) {
			$('#torrent_global_download')[0].innerHTML = 'Total DL: ' + Math.formatBytes(global_down_speed, true) + '/s';
		}
    },
    
    /*
     * Select a torrent file to upload
     */
    uploadTorrentFile: function(confirmed) {
		// Display the upload dialog
		if (! confirmed) {
			$('#upload_container').show();
		// Submit the upload form			
		} else {
			$('#torrent_upload_form')[0].submit();
		}
    },
    
    /*
     * Pause any currently selected torrents
     */
    pauseSelectedTorrents: function() {
		if (transmission.numSelectedTorrents() > 0) {				
			transmission.pauseTorrents(transmission.jsonSelectedTorrentIds());
		}
    },
    
    /*
     * Resume any currently selected torrents
     */
    resumeSelectedTorrents: function() {
		if (transmission.numSelectedTorrents() > 0) {				
			transmission.resumeTorrents(transmission.jsonSelectedTorrentIds());
		}		
    },

    /*
     * Load an uploaded torrent into the list
     */
    processUpload: function(iframe) {
		if (frames['torrent_upload_frame'].location != 'about:blank') {
			try {
				eval(frames['torrent_upload_frame'].document.body.childNodes[0].innerHTML);
				$('#upload_container').hide();
			} catch(e) {
				dialog.alert('Upload Error', 'An unexpected error occured', 'Dismiss');
			}		
		}
    },


	




    /*--------------------------------------------
     * 
     *  A J A X   F U N C T I O N S
     * 
     *--------------------------------------------*/

	/*
	 * Perform a generic remote request
	 */
	remoteRequest: function(action, param, filter) {
		if (param == null) {
			param = '0';
		}
		if (filter == null) {
			filter = this._current_filter;
		}
		
        $.ajax({
            type: 'GET',
            url: 'remote/?action=' + action + '&param=' + param + '&filter=' + filter,
            dataType: "script"
        });
	},
    
    /*
     * Request the list of torrents from the client
     */
    getTorrentList: function() {
        this.remoteRequest('refreshTorrents', null, this._current_filter);	
    },
    
    /*
     * Refresh the torrent data
     */
    reloadTorrents: function() {
        transmission.remoteRequest('refreshTorrents', null, this._current_filter);
    },
    
    /*
     * Filter the torrent data
     */
    filterTorrents: function(filter_type) {
		if (filter_type != this._current_filter) {	
			this._current_filter = filter_type;
        	transmission.remoteRequest('filterTorrents', null, filter_type);
		}
    },
    
    /*
     * Pause torrents
     */
    pauseTorrents: function(torrent_id_list) {
		if (torrent_id_list != '[]') {
			this.remoteRequest('pauseTorrents', torrent_id_list);
		}
    },
    
    /*
     * Resume torrents
     */
    resumeTorrents: function(torrent_id_list) {
		if (torrent_id_list != '[]') {	
			this.remoteRequest('resumeTorrents', torrent_id_list);
		}
    },
    
    /*
     * Remove selected torrents
     */
    removeSelectedTorrents: function(confirmed) {
		
		var num_torrents = transmission.numSelectedTorrents();
		if (num_torrents > 0) {
			
			if (confirmed !== true) {
				// TODO - proper calculation of active torrents
				var num_active_torrents  = num_torrents;
				var confirm_button_label = 'Remove';
				var dialog_heading       = 'Confirm Removal of ' + num_torrents + ' Transfers';
				var dialog_message = 'There are ' + num_torrents + ' transfers (' + num_active_torrents;
				dialog_message    += ' active). Once Removed,<br />continuing the transfers will require the torrent files.';
				dialog_message    += '<br />Do you really want to remove them?';
				dialog.confirm(dialog_heading, dialog_message, confirm_button_label, 'transmission.removeSelectedTorrents(true)');
			
			} else {	
				// Send an ajax request to perform the action
				transmission.remoteRequest('removeTorrents', transmission.jsonSelectedTorrentIds());			
			}
		}
    }


		



}