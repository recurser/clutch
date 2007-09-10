/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class Transmission
 */

function Transmission(){
    // Constants
	this._RefreshInterval        = 5000; // Milliseconds
	this._FilterAll              = 'all';
	this._FilterSeeding          = 'seeding';
	this._FilterDownloading      = 'downloading';
	this._FilterPaused           = 'paused';
	this._SortAscending          = 'ascending';
	this._SortDescending         = 'descending';
	this._current_filter         = this._FilterAll;
	this._current_sort_method    = 'queue_order';
	this._current_sort_direction = this._SortAscending;
	this._current_search         = '';

    this.initialize();
} 
 
Transmission.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
	
		// Before we do anything, browser compatability test
		if ($.browser.msie) {
			$('div#unsupported_browser').show();
			return;
		}
		
        /*
         * Private Variables
         */
		this._filter_visible = false;
		this._inspector_visible = false;
		this._speed_limit_active = false;
		
		// Initialise the torrent lists
        this._torrents = new Hash();
        this._selected_torrents = new Hash();
        
        // Get the initial settings from the remote server
        this.requestSettings();
        
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
		$('#prefs_save_button').bind('click', {transmission: this}, this.releasePrefsSaveButton);
		$('#prefs_cancel_button').bind('click', {transmission: this}, this.releasePrefsCancelButton);
		$('#speed_limit_button').bind('click', {transmission: this}, this.releaseSpeedLimitButton);
		
		// Inspector tabs
		$('#inspector_tab_info').bind('click', {transmission: this}, this.releaseInspectorTab);
		$('#inspector_tab_activity').bind('click', {transmission: this}, this.releaseInspectorTab);
		
		// Setup the search box
		this.setupSearchBox();
		
		// Set up the right-click context menu
		this.createContextMenu();
		
		// Setup the footer settings menu
		this.createSettingsMenu();
		
		// Setup the search box
		this.setupPrefs();
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
	 * Process a mouse-up event on the 'cancel' button in the preferences dialog
	 */
	releasePrefsCancelButton: function(event) {
		$('#prefs_container').hide();
		
		// Reset all the settings
		transmission.remoteRequest('resetPrefs');
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releasePrefsSaveButton: function(event) {
		event.data.transmission.savePrefs();
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
		event.data.transmission.toggleInspector();
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
		event.data.transmission.toggleFilter();
	},

	/*
	 * Process a mouse-up event on the 'filter all' button
	 */
	releaseFilterAllButton: function(event) {	
		event.data.transmission.filterTorrents(event.data.transmission._FilterAll);
		$(this).parent().siblings().removeClass('selected');
		$(this).parent().addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter downloading' button
	 */
	releaseFilterDownloadingButton: function(event) {
		event.data.transmission.filterTorrents(event.data.transmission._FilterDownloading);
		$(this).parent().siblings().removeClass('selected');
		$(this).parent().addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter seeding' button
	 */
	releaseFilterSeedingButton: function(event) {	
		event.data.transmission.filterTorrents(event.data.transmission._FilterSeeding);
		$(this).parent().siblings().removeClass('selected');
		$(this).parent().addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseFilterPausedButton: function(event) {
		event.data.transmission.filterTorrents(event.data.transmission._FilterPaused);
		$(this).parent().siblings().removeClass('selected');
		$(this).parent().addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseSpeedLimitButton: function(event) {
		event.data.transmission.toggleSpeedLimit();
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	togglePeriodicRefresh: function(state) {
		if (state && this._periodic_refresh == null) {
			this._periodic_refresh = setInterval('transmission.reloadTorrents()', this._RefreshInterval);
		} else {
			clearInterval(this._periodic_refresh);
			this._periodic_refresh = null;
		}
	},

	/*
	 * Do nothing - used for ajax calls that don't need to do anything on return
	 */
	ignore: function() {},
	
	

    /*--------------------------------------------
     * 
     *  I N T E R F A C E   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Setup the initial settings, and request the list of torrents from the server
     */
	initializeSettings: function(settings) {
		
		// Set the filter
		this._current_filter = settings.filter;	
		$('#filter_' + settings.filter + '_link').parent().addClass('selected');
		
		// Set the sort_method
		this._current_sort_method = settings.sort_method;
		$('#sort_by_' + settings.sort_method).selectMenuItem();
		
		// Set the sort_direction
		this._current_sort_direction = settings.sort_direction;
		if (settings.sort_direction == this._SortDescending) {
			$('#reverse_sort_order').selectMenuItem();
		}
		
		// Update the preferences
		this.updatePrefs(settings);		
		
		// Show the filter if necessary
		if (settings.show_filter) {
			this.showFilter(true);
		}
		
		// Show the inspector if necessary
		if (settings.show_inspector) {
			this.showInspector(true);
		}

		// Request the list of torrents from the server
		this.remoteRequest('refreshTorrents', null, this._current_filter);

		// Create a periodical executer to refresh the list
		this.togglePeriodicRefresh(true);
    },
    
    /*
     * Set up the preference validation
     */
    setupPrefs: function() {
		// Make sure only integers are input for speed limit & port options		
		$('div.preference input[@type=text]:not(#download_location)').blur( function() {
			this.value = this.value.replace(/[^0-9]/gi, '');
			if (this.value == '') {
				this.value = 0;
			}
		});
    },
    
    /*
     * Process the preferences window with the provided values
     */
	updatePrefs: function(settings) {
		
		$('div#download_location input')[0].value      = settings.download_location;
		$('div#port input')[0].value                   = settings.port;
		$('div#auto_start input')[0].checked           = settings.auto_start;
		$('input#limit_download')[0].checked           = settings.limit_download;
		$('input#download_rate')[0].value              = settings.download_rate;
		$('input#limit_upload')[0].checked             = settings.limit_upload;
		$('input#upload_rate')[0].value                = settings.upload_rate;
		$('form#prefs_form input#over_ride_rate')[0].value             = settings.over_ride_rate;
		$('input#over_ride_download_rate')[0].value    = settings.over_ride_download_rate;
		$('input#over_ride_upload_rate')[0].value      = settings.over_ride_upload_rate;
		
		// Set the download rate
		$('#limited_download_rate')[0].innerHTML = 'Limit (' + settings.download_rate + ' KB/s)';
		if (settings.limit_download) {
			$('#limited_download_rate').deselectMenuSiblings().selectMenuItem();			
		} else {
			$('#unlimited_download_rate').deselectMenuSiblings().selectMenuItem();
		}
		
		// Set the upload rate
		$('#limited_upload_rate')[0].innerHTML = 'Limit (' + settings.upload_rate + ' KB/s)';
		if (settings.limit_upload) {
			$('#limited_upload_rate').deselectMenuSiblings().selectMenuItem();			
		} else {
			$('#unlimited_upload_rate').deselectMenuSiblings().selectMenuItem();
		}
		
		// Turn on speed-limit over-ride if necessary
		if (settings.over_ride_rate) {
			transmission.activateSpeedLimit(false);
		} else {
			transmission.deactivateSpeedLimit(false);
		}
		
		$('#prefs_container').hide();	
	},
    
    /*
     * Display an error if an ajax request fails, and stop sending requests
     */
    ajaxError: function(request, error_string, exception) {
		dialog.alert('Connection Failed', 'Could not connect to the server. You may need to reload the page to reconnect.', 'Dismiss');
		transmission.togglePeriodicRefresh(false);
	},
    
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
     * Set up the search box
     */
    setupSearchBox: function() {
		var search_box = $('#torrent_search');
		search_box[0].value = '';
		search_box.bind('keyup', {transmission: this}, function(event) {
			var transmission = event.data.transmission;
			transmission._current_search = this.value.trim();
		});
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
     * Create the footer settings menu
     */
	createSettingsMenu: function() {
		$('#settings_menu').transMenu({
			direction: 'up',
			onClick: this.processSettingsMenuEvent
		});
		
		// Make initial menu selections (TODO - do this with data from the daemon?)
		$('#unlimited_download_rate').selectMenuItem();
		$('#unlimited_upload_rate').selectMenuItem();
	},
    
    /*
     * Process an event in the footer-menu
     */
	processSettingsMenuEvent: function(event) {
		// Don't use 'this' in the function to avoid confusion (this != transmission instance)
		var element = this;
		
		// Figure out which menu has been clicked
		switch ($(element).parent()[0].id) {
			
			// Display the preferences dialog
			case 'footer_super_menu':
				if ($(element)[0].id == 'preferences') {
					$('#prefs_container').show();
				}
				break;
			
			// Limit the download rate
			case 'footer_download_rate_menu':
				var rate = (this.innerHTML).replace(/[^0-9]/ig, '');
				if ($(this).is('#unlimited_download_rate')) {
					$(this).deselectMenuSiblings().selectMenuItem();
					$('div.preference input#limit_download')[0].checked = false;
					rate = -1;
				} else {
					$('#limited_download_rate')[0].innerHTML = 'Limit (' + rate + ' KB/s)';
					$('#limited_download_rate').deselectMenuSiblings().selectMenuItem();
					$('div.preference input#download_rate')[0].value = rate;
					$('div.preference input#limit_download')[0].checked = true;
				}
				transmission.remoteRequest('setDownloadRate', rate);
				break;
			
			// Limit the upload rate
			case 'footer_upload_rate_menu':
				var rate = (this.innerHTML).replace(/[^0-9]/ig, '');
				if ($(this).is('#unlimited_upload_rate')) {
					$(this).deselectMenuSiblings().selectMenuItem();
					$('div.preference input#limit_upload')[0].checked = false;
					rate = -1;
				} else {
					$('#limited_upload_rate')[0].innerHTML = 'Limit (' + rate + ' KB/s)';
					$('#limited_upload_rate').deselectMenuSiblings().selectMenuItem();
					$('div.preference input#upload_rate')[0].value = rate;
					$('div.preference input#limit_upload')[0].checked = true;
				}
				transmission.remoteRequest('setUploadRate', rate);
				break;
			
			// Sort the torrent list 
			case 'footer_sort_menu':
				var sort_method = transmission._current_sort_method;
				var sort_direction = transmission._current_sort_direction;
				
				// The 'reverse sort' option state can be toggled on/off independant of the other options
				if ($(this).is('#reverse_sort_order')) {
					if ($(this).menuItemIsSelected()) {
						$(this).deselectMenuItem();
						sort_direction = transmission._SortAscending;
					} else {
						$(this).selectMenuItem();
						sort_direction = transmission._SortDescending;
					}	
				// Otherwise, deselect all other options (except reverse-sort) and select this one				
				} else {
					$(this).parent().find('span.selected').each( function() {
						if (! $(this).parent().is('#reverse_sort_order')) {
							$(this).parent().deselectMenuItem();
						}
					});
					$(this).selectMenuItem();
					sort_method = $(this)[0].id.replace(/sort_by_/, '');
				}
				transmission.sortTorrents(sort_method, sort_direction);
				break;
		}
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
    
    /*
     * Update the inspector with the latest data for the curently selected torrents
     */
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
     * Toggle the visibility of the inspector (used by the context menu)
     */
	toggleInspector: function() {
		if (transmission._inspector_visible) {
			transmission.hideInspector();
		} else {
			transmission.showInspector();
		}
	},
    
    /*
     * Show the inspector
	 * dont_inform_server is used when the filter is setup initially on startup
     */
	showInspector: function(dont_inform_server) {
		$('#torrent_filter_bar')[0].style.right = $('#torrent_inspector').width() + 'px';
		$('#torrent_container')[0].style.right = $('#torrent_inspector').width() + 'px';
		$('#torrent_inspector').show();
		transmission._inspector_visible = true;
		transmission.updateInspector();
		
		$('ul li#context_toggle_inspector')[0].innerHTML = 'Hide Inspector';

		// Tell the server about this action
		if (! dont_inform_server) {
			transmission.setPreferences('show_inspector', true);
		}
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

		// Tell the server about this action
		transmission.setPreferences('show_inspector', false);
	},
    
    /*
     * Toggle the speed limit switch
     */
	toggleSpeedLimit: function() {
		if (transmission._speed_limit_active) {
			transmission.deactivateSpeedLimit(true);
		} else {
			transmission.activateSpeedLimit(true);
		}
	},
    
    /*
     * Turn the speed limit on
     */
	activateSpeedLimit: function(informServer) {
		$('#speed_limit_button').css('backgroundImage', "url('/images/buttons/footer_speed_limit_button_blue.png')");
		transmission._speed_limit_active = true;
		$('form#prefs_form input#over_ride_rate')[0].value = 1;
		
		if (informServer) {
        	transmission.remoteRequest('setOverRide', 1);
		}
	},
    
    /*
     * Turn the speed limit off
     */
	deactivateSpeedLimit: function(informServer) {
		$('#speed_limit_button').css('backgroundImage', "url('/images/buttons/footer_speed_limit_button.png')");
		transmission._speed_limit_active = false;
		$('form#prefs_form input#over_ride_rate')[0].value = 0;
		
		if (informServer) {
        	transmission.remoteRequest('setOverRide', 0);
		}
	},
	
    /*
     * Toggle the visibility of the filter bar
     */
	toggleFilter: function() {		
		if (transmission._filter_visible) {
			transmission.hideFilter();
		} else {
			transmission.showFilter();
		}
	},
	
    /*
     * Show the filter bar
	 * dont_inform_server is used when the filter is setup initially on startup
     */
	showFilter: function(dont_inform_server) {
		var container_top = parseInt($('#torrent_container').css('top')) + $('#torrent_filter_bar').height();
		$('#torrent_container').css('top', container_top + 'px');
		$('#torrent_filter_bar').show();
		transmission._filter_visible = true;
		if (! dont_inform_server) {
			transmission.setPreferences('show_filter', true);
		}
	},
	
    /*
     * Hide the filter bar
     */
	hideFilter: function() {
		var container_top = parseInt($('#torrent_container').css('top')) - $('#torrent_filter_bar').height();
		$('#torrent_container').css('top', container_top + 'px');
		$('#torrent_filter_bar').hide();
		transmission._filter_visible = false;
		transmission.setPreferences('show_filter', false);
	},

    /*
     * Remove all the torrents from the interface to force a re-sort
     */
    refreshAndSortTorrents: function(torrent_list) {
		$('#upload_container').hide();
		transmission.removeTorrents(transmission._torrents.keys().clone());
		transmission.refreshTorrents(torrent_list);
	},

    /*
     * Load a list of torrents into the application
     */
    refreshTorrents: function(torrent_list) {
		var global_up_speed = 0;
		var global_down_speed = 0;
        var torrent_data;
        var torrent_ids = transmission._torrents.keys().clone();
        var new_torrents = [];

		// If the length of the new torrent_list isn't equal to the number of torrents in
		// the browser (if a torrent has been added/deleted/filtered for example), we
		// need to clear the list & force a re-sort
		if (torrent_ids.length > 0 && torrent_ids.length != torrent_list.length) {
			transmission.removeTorrents(transmission._torrents.keys().clone());
			torrent_ids = [];
		}

        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
	
			// If this torrent already exists, refresh it & remove this ID from torrent_ids
			if (torrent_ids.inArray(torrent_data.id)) {
				transmission._torrents.item(torrent_data.id).refresh(torrent_data);
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
		
		// Update the alternating torrent background colors
		transmission.setTorrentBgColors();
		
		// Update global upload and download speed display
		transmission.setGlobalSpeeds(torrent_list.length, global_up_speed, global_down_speed);
		
		// Update the inspector
		transmission.updateInspector();
    },

    /*
     * Load a list of torrents into the application
     */
    removeTorrents: function(torrent_id_list) {
		var torrent;
		
		if (torrent_id_list.length != 0) {
        	for (i=0; i<torrent_id_list.length; i++) {	
				torrent = transmission._torrents.item(torrent_id_list[i]);
				
				// Keep the torrent chain intact
				if (torrent.previousTorrent()) {
					torrent.previousTorrent().setNextTorrent(torrent.nextTorrent());
				}
				if (torrent.nextTorrent()) {
					torrent.nextTorrent().setPreviousTorrent(torrent.previousTorrent());
				}
				
				// Remove the torrent from the list
				torrent.element().remove();
				transmission._torrents.remove(torrent_id_list[i]);
				transmission._selected_torrents.remove(torrent_id_list[i]);
        	}
		}
		
		// Set the background colors
		transmission.setTorrentBgColors();
		
		// Clear the inspector
		transmission.deselectAll();
		transmission.updateInspector();
		transmission.setGlobalSpeeds(this._torrents.length());
    },
    
    /*
     * Set the alternating background colors for torrents
     */
    setTorrentBgColors: function() {
		for (i=0; i<this._torrents.length(); i++) {	
			torrent = this._torrents.itemByIndex(i);
			if ((i+1) % 2 == 0) {
				torrent.element().addClass('even');
			} else {
				torrent.element().removeClass('even');
			}
		}
    },
    
    /*
     * Set the global up and down speed in the interface
     */
    setGlobalSpeeds: function(num_torrents, global_up_speed, global_down_speed) {
		$('#torrent_global_transfer')[0].innerHTML = num_torrents + ' Transfers';
		$('#torrent_global_upload')[0].innerHTML = 'Total UL: ' + Math.formatBytes(global_up_speed, true) + '/s';
		$('#torrent_global_download')[0].innerHTML = 'Total DL: ' + Math.formatBytes(global_down_speed, true) + '/s';
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
			// Set the form action with the appropriate params
			$('#torrent_upload_form')[0].action = 'remote/?action=uploadTorrent&param=[]' + 
					'&filter=' + transmission._current_filter +
					'&sort_method=' + transmission._current_sort_method +
					'&sort_direction=' + transmission._current_sort_direction +
					'&search=' + transmission._current_search;
			
			// Submit the form
			$('#torrent_upload_form')[0].submit();
			
			// Disable the periodic refresh call
			transmission.togglePeriodicRefresh(false);
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




    /*--------------------------------------------
     * 
     *  A J A X   F U N C T I O N S
     * 
     *--------------------------------------------*/

	/*
	 * Perform a generic remote request
	 */
	remoteRequest: function(action, param, filter, sort_method, sort_direction, search) {
		if (param == null) {
			param = '0';
		}
		
		if (filter == null) {
			filter = this._current_filter;
		}
		
		if (sort_method == null) {
			sort_method = this._current_sort_method;
		}
		
		if (sort_direction == null) {
			sort_direction = this._current_sort_direction;
		}
		
		if (search == null) {
			search = this._current_search;
		}
		
        $.ajax({
            type: 'GET',
            url: 'remote/?action=' + action + 
				'&param=' + param + 
				'&filter=' + filter + 
				'&sort_method=' + sort_method + 
				'&sort_direction=' + sort_direction + 
				'&search=' + search,
            dataType: "script",
			error: this.ajaxError
        });
	},
    
    /*
     * Request the initial settings for the web client (up/down speed etc)
     */
	setPreferences: function(key, value) {
        this.remoteRequest('setPreferences', '{"'+key+'":'+value+'}');	
    },
    
    /*
     * Request the initial settings for the web client (up/down speed etc)
     */
	requestSettings: function() {
        this.remoteRequest('requestSettings');	
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
     * Sort the torrent data
     */
    sortTorrents: function(sort_method, sort_direction) {
	
		if (sort_method != this._current_sort_method) {	
			this._current_sort_method = sort_method;
		}
	
		if (sort_direction != this._current_sort_direction) {	
			this._current_sort_direction = sort_direction;
		}
		
       	transmission.remoteRequest('sortTorrents', null, this._current_filter, sort_method, sort_direction);
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
     * Save preferences
     */
    savePrefs: function() {	
		// Set the form action with the appropriate params
		$('#prefs_form')[0].action = 'remote/?action=savePrefs&param=[]' + 
				'&filter=' + transmission._current_filter +
				'&sort_method=' + transmission._current_sort_method +
				'&sort_direction=' + transmission._current_sort_direction +
				'&search=' + transmission._current_search;
		$('#prefs_form').ajaxSubmit({dataType: 'script', type: 'POST'});
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