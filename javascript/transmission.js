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
		var _FilterAll;
		var _FilterSeeding;
		var _FilterDownloading;
		var _FilterPaused;
		this._RefreshInterval   = 8;
		this._FilterAll         = 'all';
		this._FilterSeeding     = 'seeding';
		this._FilterDownloading = 'downloading';
		this._FilterPaused      = 'paused';
		this._current_filter    = this._FilterAll;
		
        /*
         * Private Variables
         */
		var _filter_visible;
        var _torrents;
        var _selected_torrents;
        var _last_torrent_clicked;
        var _highest_selected;
        var _lowest_selected;
        var _inspector_visible;
		this._filter_visible = true;
		this._inspector_visible = true;
		
		// Initialise the torrent lists
        this._torrents = new Hash({});
        this._selected_torrents = new Hash({});
        
        // Get the initial list of torrents from the remote app
        this.getTorrentList();
        
        // Observe key presses
        document.addEventListener("keydown", this.keyDown.bindAsEventListener(this),false);

		// Buttons
		Event.observe($('pause_all_link'), 'mouseup', this.releasePauseAllButton.bindAsEventListener(this));
		Event.observe($('resume_all_link'), 'mouseup', this.releaseResumeAllButton.bindAsEventListener(this));
		Event.observe($('pause_selected_link'), 'mouseup', this.releasePauseSelectedButton.bindAsEventListener(this));
		Event.observe($('resume_selected_link'), 'mouseup', this.releaseResumeSelectedButton.bindAsEventListener(this));
		Event.observe($('open_link'), 'mouseup', this.releaseOpenButton.bindAsEventListener(this));
		Event.observe($('remove_link'), 'mouseup', this.releaseRemoveButton.bindAsEventListener(this));
		Event.observe($('filter_toggle_link'), 'mouseup', this.releaseFilterToggleButton.bindAsEventListener(this));
		Event.observe($('inspector_link'), 'mouseup', this.releaseInspectorButton.bindAsEventListener(this));		
		Event.observe($('filter_all_link'), 'mouseup', this.releaseFilterAllButton.bindAsEventListener(this));
		Event.observe($('filter_downloading_link'), 'mouseup', this.releaseFilterDownloadingButton.bindAsEventListener(this));
		Event.observe($('filter_seeding_link'), 'mouseup', this.releaseFilterSeedingButton.bindAsEventListener(this));
		Event.observe($('filter_paused_link'), 'mouseup', this.releaseFilterPausedButton.bindAsEventListener(this));
		Event.observe($('upload_confirm_button'), 'mouseup', this.releaseUploadConfirmButton.bindAsEventListener(this));
		Event.observe($('upload_cancel_button'), 'mouseup', this.releaseUploadCancelButton.bindAsEventListener(this));
		
		// Need to make an iframe for uploading torrents
		var upload_container = document.createElement('div');
		Element.setStyle(upload_container, {display: 'none'});
		upload_container.innerHTML = "<iframe name='torrent_upload_frame' " +
			"id='torrent_upload_frame' style='border:2px dashed #CC0000;position:absolute;z-index:1000;bottom:0px;right:0px;' " +
			"src='about:blank' onload='transmission.processUpload(this);'/>";
		$('transmission_body').appendChild(upload_container);
		
		
		// Inspector tabs
		Event.observe($('inspector_tab_info'), 'mouseup', this.releaseInspectorTab.bindAsEventListener(this));
		Event.observe($('inspector_tab_activity'), 'mouseup', this.releaseInspectorTab.bindAsEventListener(this));

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
    
    /*
     * Return a JSON string of torrent IDs
     */
    jsonTorrentIds: function() {
		return this._torrents.keys().collect(function(s) {return parseInt(s)}).toJSON().replace(/ /g, '');
    },
    
    /*
     * Return a JSON string of torrent IDs
     */
    jsonSelectedTorrentIds: function() {
		return this._selected_torrents.keys().collect(function(s) {return parseInt(s)}).toJSON().replace(/ /g, '');
    },
    
    /*
     * Return the number of selected torrents
     */
    numTorrents: function() {
		return this._torrents.keys().length
    },
    
    /*
     * Return the number of selected torrents
     */
    numSelectedTorrents: function() {
		return this._selected_torrents.keys().length
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
        if (!this._selected_torrents[torrent.id()]) {
			this._selected_torrents[torrent.id()] = torrent;
		}

		// Display in Inspector
		this.updateInspector();
    },
    
    /*
     * Register the specified torrent as de-selected
     */
    deselectTorrent: function(torrent) {
		var temp_torrent;
		var found;
		
		// May need to re-calculate the controllers highest selected torrent :
		// work down the list until the next selected torrent
		if (torrent == this._highestSelected) {
			temp_torrent = torrent._next_torrent;
			found = false;
			while (found == false && temp_torrent != null) {
				if 	(temp_torrent.isSelected()) {
					found = true;
					this._highestSelected = temp_torrent;
				}
				temp_torrent = temp_torrent.nextTorrent();
			}
		}
		
		// May need to re-calculate the controllers lowest selected torrent :
		// work down the list until the next selected torrent
		if (torrent == this._lowestSelected) {
			temp_torrent = torrent._previous_torrent;
			found = false;
			while (found == false && temp_torrent != null) {
				if 	(temp_torrent.isSelected()) {
					found = true;
					this._lowestSelected = temp_torrent;
				}
				temp_torrent = temp_torrent.previousTorrent();
			}
		}
		
		// Remove this from the list of selected torrents	
        if (this._selected_torrents[torrent.id()]) {
			this._selected_torrents.remove(torrent.id());
		}

		// Display in Inspector
		this.updateInspector();

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
	 * Process a mouse-up event on the 'pause all' button
	 */
	releasePauseAllButton: function(event) {
		Event.stop(event);	
		this.pauseTorrents(transmission.jsonTorrentIds());
	},

	/*
	 * Process a mouse-up event on the 'resume all' button
	 */
	releaseResumeAllButton: function(event) {
		Event.stop(event);
		this.resumeTorrents(transmission.jsonTorrentIds());
	},

	/*
	 * Process a mouse-up event on the 'pause selected' button
	 */
	releasePauseSelectedButton: function(event) {
		Event.stop(event);
		if (transmission.numSelectedTorrents() > 0) {
			this.pauseTorrents(transmission.jsonSelectedTorrentIds());
		}
	},

	/*
	 * Process a mouse-up event on the 'resume selected' button
	 */
	releaseResumeSelectedButton: function(event) {
		Event.stop(event);	
		if (transmission.numSelectedTorrents() > 0) {				
			this.resumeTorrents(transmission.jsonSelectedTorrentIds());
		}
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseOpenButton: function(event) {
		Event.stop(event);	
		this.uploadTorrentFile();	
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadCancelButton: function(event) {
		Event.stop(event);	
		$('upload_container').hide();
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadConfirmButton: function(event) {
		Event.stop(event);	
		this.uploadTorrentFile(true);
	},

	/*
	 * Process a mouse-up event on the 'remove' button
	 */
	releaseRemoveButton: function(event) {
		Event.stop(event);		
		this.removeSelectedTorrents();
	},

	/*
	 * Process a mouse-up event on the 'inspector' button
	 */
	releaseInspectorButton: function(event) {
		Event.stop(event);		
		
		// Perform the toggle
		if (this._inspector_visible) {
			this.hideInspector();
		} else {
			this.showInspector();
		}
	},

	/*
	 * Process a mouse-up event on an 'inspector' tab
	 */
	releaseInspectorTab: function(event) {
		Event.stop(event);
		
		// Unselect all the tabs, select the clicked tab, and display the appropriate info
		var tab_ids = ['inspector_tab_info', 'inspector_tab_activity'];
        for (i=0; i<tab_ids.length; i++) {
			if (Event.element(event).id == tab_ids[i]) {
				$(tab_ids[i]).addClassName('selected');
				$(tab_ids[i] + '_container').show();
			} else {
				$(tab_ids[i]).removeClassName('selected');
				$(tab_ids[i] + '_container').hide();
			}
		}
	},
	
    /*
     * Process a mouse-up event on the 'filter' button
     */
	releaseFilterToggleButton: function(event) {
		Event.stop(event);		
		
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

	/*
	 * Process a mouse-up event on the 'filter all' button
	 */
	releaseFilterAllButton: function(event) {
		Event.stop(event);		
		this.filterTorrents(this._FilterAll);
	},

	/*
	 * Process a mouse-up event on the 'filter downloading' button
	 */
	releaseFilterDownloadingButton: function(event) {
		Event.stop(event);	
		this.filterTorrents(this._FilterDownloading);
	},

	/*
	 * Process a mouse-up event on the 'filter seeding' button
	 */
	releaseFilterSeedingButton: function(event) {
		Event.stop(event);		
		this.filterTorrents(this._FilterSeeding);
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseFilterPausedButton: function(event) {
		Event.stop(event);	
		this.filterTorrents(this._FilterPaused);
	},
	
    /*
     * Process a torrent right-click-menu event
     */
	releaseTorrentRightClickMenu: function(event) {		
		Event.stop(event);
		
		// Lower-case and replace spaces with underscores and delete periods to keep the args regular
		var command = Event.element(event).innerHTML.toLowerCase().replace(/ /g,'_');
		var command = command.replace(/\./g,'');
		
		switch (command) {
			case 'pause_selected':
				this.pauseTorrents(this.jsonSelectedTorrentIds());
				break;				
			case 'resume_selected':
				this.resumeTorrents(this.jsonSelectedTorrentIds());
				break;	
			case 'remove_from_list':
				this.removeSelectedTorrents();
				break;				
			case 'show_inspector':	
			case 'hide_inspector':
				if (this._inspector_visible) {
					this.hideInspector();
				} else {
					this.showInspector();
				}
				break;
			default:
				break;
		}
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
        this._torrents.values().invoke('select');
    },
    
    /*
     * De-select all torrents in the list
     */
    deselectAll: function() {
        this._torrents.values().invoke('deselect');
        
        // reset the highest and lowest selected
        this._highest_selected = null;
        this._lowest_selected = null;
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
	        this._torrents.values().invoke('remove');
	        this._torrents = new Hash({});
	        this._selected_torrents = new Hash({});
	        this._last_torrent_clicked = null;
	        this._highest_selected = null;
	        this._lowest_selected = null;
        }
		
		var num_existing_torrents = this._torrents.keys().length;
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
            this._torrents[torrent_data.id] = torrent;
            
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
				torrent = this._selected_torrents[this._selected_torrents.keys()[0]];
				$('torrent_inspector_name').innerHTML			= torrent._name;
				$('torrent_inspector_size').innerHTML			= Math.formatBytes(torrent._size);
				$('torrent_inspector_tracker').innerHTML		= torrent._tracker['address']+
															  	':'+torrent._tracker['port']+
															  	torrent._tracker['announce'];

				$('torrent_inspector_hash').innerHTML			= torrent._hash;
				$('torrent_inspector_state').innerHTML			= torrent._state;
				$('torrent_inspector_ratio').innerHTML			= torrent.ratio();
				$('torrent_inspector_uploaded').innerHTML		= Math.formatBytes(torrent._upload_total);
				$('torrent_inspector_downloaded').innerHTML		= Math.formatBytes(torrent._download_total);
				$('torrent_inspector_upload_to').innerHTML		= torrent._peers_downloading;
				$('torrent_inspector_download_from').innerHTML	= torrent._peers_uploading;
				$('torrent_inspector_swarm_speed').innerHTML	= torrent._swarm_speed;
				$('torrent_inspector_total_seeders').innerHTML	= torrent._total_seeders;
				$('torrent_inspector_total_leechers').innerHTML	= torrent._total_leechers;		
		
				if (torrent._error_message && torrent._error_message != '') {
					$('torrent_inspector_error').innerHTML		= torrent._error_message;
				} else {
					$('torrent_inspector_error').innerHTML		= 'N/A';
				}
				if (torrent._comment && torrent._comment != '') {
					$('torrent_inspector_comment').innerHTML	= torrent._comment;
				} else {
					$('torrent_inspector_comment').innerHTML	= 'N/A';
				}
				if (torrent._creator && torrent._creator != '') {
					$('torrent_inspector_creator').innerHTML	= torrent._creator;
				} else {
					$('torrent_inspector_creator').innerHTML		= 'N/A';
				}

				if (torrent._private == 1) {
					$('torrent_inspector_secure').innerHTML = 'Private Torrent';
				} else {
					$('torrent_inspector_secure').innerHTML	= 'Public Torrent';
				}

				$('torrent_inspector_creator_date').innerHTML	= Math.formatTimestamp(torrent._creator_date);
			
			// Otherwise, just update up/down totals
			} else {
				var total_upload = 0;
				var total_download = 0;
				for (i=0; i<torrent_count; i++) {
					total_upload += this._selected_torrents[this._selected_torrents.keys()[i]]._upload_total;
					total_download += this._selected_torrents[this._selected_torrents.keys()[i]]._download_total;
				}
				if (torrent_count == 0) {
					$('torrent_inspector_name').innerHTML			= 'No Torrent Selected';
				} else {
					$('torrent_inspector_name').innerHTML			= torrent_count + ' Torrents Selected';
				}
				$('torrent_inspector_size').innerHTML			= '';
				$('torrent_inspector_tracker').innerHTML		= 'N/A';
				$('torrent_inspector_hash').innerHTML			= 'N/A';
				$('torrent_inspector_state').innerHTML			= 'N/A';
				$('torrent_inspector_ratio').innerHTML			= 'N/A';
				$('torrent_inspector_uploaded').innerHTML		= Math.formatBytes(total_upload);
				$('torrent_inspector_downloaded').innerHTML		= Math.formatBytes(total_download);
				$('torrent_inspector_upload_to').innerHTML		= 'N/A';
				$('torrent_inspector_download_from').innerHTML	= 'N/A';
				$('torrent_inspector_swarm_speed').innerHTML	= 'N/A';
				$('torrent_inspector_total_seeders').innerHTML	= 'N/A';
				$('torrent_inspector_total_leechers').innerHTML	= 'N/A';
				$('torrent_inspector_creator').innerHTML		= 'N/A';
				$('torrent_inspector_comment').innerHTML		= 'N/A';
				$('torrent_inspector_creator_date').innerHTML	= 'N/A';
				$('torrent_inspector_secure').innerHTML			= 'N/A';
				$('torrent_inspector_error').innerHTML			= 'N/A';
			}
		}
	},

	destroyInspector: function() {
		$('torrent_inspector_name').innerHTML = 'No Torrent Selected';
		$('torrent_inspector_size').innerHTML = '';
		$('torrent_inspector_tracker').innerHTML = 'N/A';
		$('torrent_inspector_hash').innerHTML = 'N/A';
		$('torrent_inspector_secure').innerHTML = 'N/A';

		$('torrent_inspector_creator').innerHTML = 'N/A';
		$('torrent_inspector_creator_date').innerHTML = 'N/A';
		$('torrent_inspector_torrent_file').value = 'N/A';
	},
    
    /*
     * Show the inspector
     */
	showInspector: function() {
		var container_right;
		container_right = parseInt($('torrent_container').getStyle('right')) + parseInt($('torrent_inspector').getWidth());
		$('torrent_container').style.right = container_right + "px";
		$('torrent_filter_bar').style.right = container_right + "px";
		$('torrent_inspector').show();
		this._inspector_visible = true;
		$('torrent_context_menu').descendants().last().innerHTML = 'Hide Inspector';
	},
    
    /*
     * Hide the inspector
     */
	hideInspector: function() {
		var container_right;
		container_right = parseInt($('torrent_container').getStyle('right')) - parseInt($('torrent_inspector').getWidth()) + 1;
		$('torrent_container').style.right = container_right + "px";
		$('torrent_filter_bar').style.right = container_right + "px";
		$('torrent_inspector').hide();
		this._inspector_visible = false;
		$('torrent_context_menu').descendants().last().innerHTML = 'Show Inspector';
	},

    /*
     * Load a list of torrents into the application
     */
    refreshTorrents: function(torrent_list) {
		var global_up_speed = 0;
		var global_down_speed = 0;
        var torrent_data;
        
        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
			this._torrents[torrent_data.id].refresh(torrent_data);
			global_up_speed += torrent_data.upload_speed;
			global_down_speed += torrent_data.download_speed;
        }

		// Update global upload and download speed display
		this.setGlobalSpeeds(torrent_list.length, global_up_speed, global_down_speed);
		
		// Update the inspector
		this.updateInspector();
    },

    /*
     * Load a list of torrents into the application
     */
    removeTorrents: function(torrent_list) {
		
		// Clear the inspector
		this.deselectAll();
		this.updateInspector();
		
		if (torrent_list.length != 0) {
        	for (i=0; i<torrent_list.length; i++) {	
				Element.remove(this._torrents[torrent_list[i]].element());
        	}
		}
    },
    
    /*
     * Set the global up and down speed in the interface
     */
    setGlobalSpeeds: function(num_torrents, global_up_speed, global_down_speed) {
	
		// Update global upload and download speed display
		$('torrent_global_upload').innerHTML = 'Total UL: ' + Math.formatBytes(global_up_speed, true) + '/s';
		$('torrent_global_download').innerHTML = 'Total DL: ' + Math.formatBytes(global_down_speed, true) + '/s';
		$('torrent_global_transfer').innerHTML = num_torrents + ' Transfers';
    },
    
    /*
     * Select a torrent file to upload
     */
    uploadTorrentFile: function(confirmed) {
		// Display the upload dialog
		if (! confirmed) {
			$('upload_container').show();
		// Submit the upload form			
		} else {	
			$('torrent_upload_form').submit();
		}
    },

    /*
     * Load an uploaded torrent into the list
     */
    processUpload: function(iframe) {
		if (frames['torrent_upload_frame'].location != 'about:blank') {
			try {
				eval(frames['torrent_upload_frame'].document.body.childNodes[0].innerHTML);
				$('upload_container').hide();
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
     * Refresh the torrent data
     */
    reloadTorrents: function() {
        transmission.remoteRequest('reloadTorrents', transmission.jsonTorrentIds());	
    },
    
    /*
     * Filter the torrent data
     */
    filterTorrents: function(filter_type) {
		if (filter_type != this._current_filter) {	
			this._current_filter = filter_type;
        	transmission.remoteRequest('filterTorrents', filter_type);
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
		var num_torrents = this.numSelectedTorrents();
		if (num_torrents > 0) {
			
			if (! confirmed) {
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
				this.remoteRequest('removeTorrents', transmission.jsonSelectedTorrentIds());			
			}
		}
    }


		



}