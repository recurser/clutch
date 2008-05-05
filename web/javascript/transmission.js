/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class Transmission
 */
 
function Transmission(){
    // Constants
	this._FilterAll              = 'all';
	this._FilterSeeding          = 'seeding';
	this._FilterDownloading      = 'downloading';
	this._FilterPaused           = 'paused';
	this._SortAscending          = 'ascending';
	this._SortDescending         = 'descending';
	this._EncryptionPreferred    = 'preferred';
	this._EncryptionRequired     = 'required';
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
			$('div.torrent_footer').hide();
			$('div#unsupported_browser').show();
			return;
		}
		
		// Initialize the helper classes
		this.remote = new TransmissionRemote(this);
		
        /*
         * Private Variables
         */
		this._filter_visible     = false;
		this._inspector_visible  = false;
		
		// Initialise the torrent lists
        this._torrents            = new Hash();
        this._selected_torrents   = new Hash();
        this._num_paused_torrents = 0;
        this._num_active_torrents = 0;
        this._num_selected_paused_torrents = 0;
        this._num_selected_active_torrents = 0;
        this._global_active_torrents = false;
        this._global_paused_torrents = false;
        this._total_torrents = 0;
		
		// Pre-load the images
		this.preloadImages();
        
        // Get the initial settings from the remote server
        this.remote.request('requestSettings');
        
        // Observe key presses
		if (!iPhone) $(document).bind('keydown', {transmission: this}, this.keyDown);

		// Buttons
		if (!iPhone) $('#torrent_container').bind('click', {transmission: this}, this.deselectAll);
		$('#pause_all_link').bind('click', {transmission: this}, this.releasePauseAllButton);
		$('#resume_all_link').bind('click', {transmission: this}, this.releaseResumeAllButton);
		$('#pause_selected_link').bind('click', {transmission: this}, this.releasePauseSelectedButton);
		$('#resume_selected_link').bind('click', {transmission: this}, this.releaseResumeSelectedButton);
		if (!iPhone) $('#open_link').bind('click', {transmission: this}, this.releaseOpenButton);
		$('#remove_link').bind('click', {transmission: this}, this.releaseRemoveButton);
		if (!iPhone) $('#filter_toggle_link').bind('click', {transmission: this}, this.releaseFilterToggleButton);
		if (!iPhone) $('#inspector_link').bind('click', {transmission: this}, this.releaseInspectorButton);
		$('#filter_all_link').parent().bind('click', {transmission: this}, this.releaseFilterAllButton);
		$('#filter_downloading_link').parent().bind('click', {transmission: this}, this.releaseFilterDownloadingButton);
		$('#filter_seeding_link').parent().bind('click', {transmission: this}, this.releaseFilterSeedingButton);
		$('#filter_paused_link').parent().bind('click', {transmission: this}, this.releaseFilterPausedButton);
		if (!iPhone) $('#upload_confirm_button').bind('click', {transmission: this}, this.releaseUploadConfirmButton);
		if (!iPhone) $('#upload_cancel_button').bind('click', {transmission: this}, this.releaseUploadCancelButton);
		if (iPhone) $('#preferences_link').bind('click', {transmission: this}, this.releaseClutchPreferencesButton);
		$('#prefs_save_button').bind('click', {transmission: this}, this.releasePrefsSaveButton);
		$('#prefs_cancel_button').bind('click', {transmission: this}, this.releasePrefsCancelButton);
		
		// Inspector tabs
		$('#inspector_tab_info').bind('click', {transmission: this}, this.releaseInspectorTab);
		$('#inspector_tab_activity').bind('click', {transmission: this}, this.releaseInspectorTab);

		if (iPhone) {
			$('#torrent_inspector').bind('click', {transmission: this}, this.hideInspector);
		}
		
		// Setup the search box
		if (!iPhone) this.setupSearchBox();
		
		// Set up the right-click context menu
		if (!iPhone) this.createContextMenu();
		
		// Setup the footer settings menu
		if (!iPhone) this.createSettingsMenu();
		
		// Setup the preference box
		this.setupPrefs();
    },
    

    /*--------------------------------------------
     * 
     *  S E T T E R S   /   G E T T E R S
     * 
     *--------------------------------------------*/
    
    /*
     * Return the current filter
     */
    currentFilter: function() {
        return this._current_filter;
    },
    
    /*
     * Set the current filter
     */
    setCurrentFilter: function(filter) {
        this._current_filter = filter;
    },
    
    /*
     * Return the current sort method
     */
    currentSortMethod: function() {
        return this._current_sort_method;
    },
    
    /*
     * Set the current sort method
     */
    setCurrentSortMethod: function(sort_method) {
        this._current_sort_method = sort_method;
    },
    
    /*
     * Return the current sort direction
     */
    currentSortDirection: function() {
        return this._current_sort_direction;
    },
    
    /*
     * Set the current sort direction
     */
    setCurrentSortDirection: function(sort_direction) {
        this._current_sort_direction = sort_direction;
    },
    
    /*
     * Return the current search criteria
     */
    currentSearch: function() {
        return this._current_search;
    },
    
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
     * Return the number of selected torrents
     */
    numTorrents: function() {
		return this._torrents.length();
    },
    
    /*
     * Return the number of active torrents
     */
    numActiveTorrents: function() {
		return this._num_active_torrents;
    },
    
    /*
     * Return the number of paused torrents
     */
    numPausedTorrents: function() {
		return this._num_paused_torrents;
    },
    
    /*
     * Return the number of selected torrents
     */
    numSelectedTorrents: function() {
		return this._selected_torrents.length();
    },
    
    /*
     * Return the number of selected active torrents
     */
    numSelectedActiveTorrents: function() {
		return this._num_selected_active_torrents;
    },
    
    /*
     * Return the list of selected torrents
     */
    selectedTorrents: function() {
		return this._selected_torrents;
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
     * Register the specified torrent as selected
     */
    selectTorrent: function(torrent) {
		
		if (iPhone) {
			// Store this in the list of selected torrents	
			if (!this._selected_torrents.hasKey(torrent.id())) {
				this._selected_torrents.set(torrent.id(), torrent);
			}
			transmission.showInspector();
			// Enable/disable buttons based on the selection
			if (torrent.isActive()) {
				this._num_selected_active_torrents++;
			} else {
				this._num_selected_paused_torrents++;
			}
			this.updateButtonStates();
		} else {
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
		
		// Enable/disabled buttons based on the selection
		if (torrent.isActive()) {
			this._num_selected_active_torrents++;
		} else {
			this._num_selected_paused_torrents++;
		}
		this.updateButtonStates();

		// Display in Inspector
		this.updateInspector();
		}
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
		
		// Remove this from the list of selected torrents
		transmission._selected_torrents.remove(torrent.id());
		
		if (! ignore_inspector_update) {
		
			// May need to re-calculate the controllers highest selected torrent :
			// work down the list until the next selected torrent
			if (torrent == transmission._highestSelected) {
				temp_torrent = torrent.nextTorrent();
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
				temp_torrent = torrent.previousTorrent();
				found = false;
				while (found == false && temp_torrent != null) {
					if 	(temp_torrent.isSelected()) {
						found = true;
						transmission._lowestSelected = temp_torrent;
					}
					temp_torrent = temp_torrent.previousTorrent();
				}
			}
			
			// Enable/disabled buttons based on the selection
			if (torrent.isActive()) {
				transmission._num_selected_active_torrents--;
			} else {
				transmission._num_selected_paused_torrents--;
			}
			transmission.updateButtonStates();
		
			// Display in Inspector
			if (!ignore_inspector_update) {
				transmission.updateInspector();
			}
		}
    },

	/*
	 * Process a mouse-up event on the 'pause all' button
	 */
	releasePauseAllButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			if (transmission.numActiveTorrents() > 0) {
				event.data.transmission.remote.pauseTorrents([]);
			}
			if (iPhone) transmission.hideiPhoneAddressbar();
		}
	},

	/*
	 * Process a mouse-up event on the 'resume all' button
	 */
	releaseResumeAllButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			if (transmission.numPausedTorrents() > 0) {
				event.data.transmission.remote.resumeTorrents([]);
			}
			if (iPhone) transmission.hideiPhoneAddressbar();
		}
	},

	/*
	 * Process a mouse-up event on the 'pause selected' button
	 */
	releasePauseSelectedButton: function(event) {		if (transmission.checkButtonDisabled(event)) {
			if (transmission.numSelectedActiveTorrents() > 0) {
				event.data.transmission.pauseSelectedTorrents();
			}
			if (iPhone) transmission.hideiPhoneAddressbar();
		}
	},

	/*
	 * Process a mouse-up event on the 'resume selected' button
	 */
	releaseResumeSelectedButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			if (transmission.numSelectedActiveTorrents() == 0) {
				event.data.transmission.resumeSelectedTorrents();
			if (iPhone) transmission.hideiPhoneAddressbar();
			}
	    }
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseOpenButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			$('body').addClass('open_showing');
			event.data.transmission.uploadTorrentFile();
		}
		transmission.updateButtonStates();
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadCancelButton: function(event) {
		$('body.open_showing').removeClass('open_showing');
		if (!iPhone && Safari3) {
			$('div#upload_container div.dialog_window').css('top', '-205px');
			setTimeout("$('#upload_container').hide();",500);
		} else {
			$('#upload_container').hide();
		}
		transmission.updateButtonStates();
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseUploadConfirmButton: function(event) {
		$('body.open_showing').removeClass('open_showing');
		var url_data = jQuery.fieldValue($("#torrent_upload_url")[0]);
		if (url_data.length == 0)
			event.data.transmission.uploadTorrentFile(true);
		else
			event.data.transmission.remote.addTorrentByURL();
		if (!iPhone && Safari3) {
			$('div#upload_container div.dialog_window').css('top', '-205px');
			setTimeout("$('#upload_container').hide();",500);
		} else {
			$('#upload_container').hide();
		}
		transmission.updateButtonStates();
	},

	/*
	 * Process a mouse-up event on the 'cancel' button in the preferences dialog
	 */
	releasePrefsCancelButton: function(event) {
		$('body.prefs_showing').removeClass('prefs_showing');
		transmission.updateButtonStates();
		if (iPhone) {
			transmission.hideiPhoneAddressbar();
			$('#prefs_container').hide();
		} else if (Safari3) {
			$('div#prefs_container div.dialog_window').css('top', '-425px');
			setTimeout("$('#prefs_container').hide();",500);
		} else {
			$('#prefs_container').hide();
		}
	},

	/*
	 * Process a mouse-up event on the 'save' button in the preferences dialog
	 */
	releasePrefsSaveButton: function(event) {
		event.data.transmission.remote.savePrefs();
		transmission.updateButtonStates();
	},

	/*
	 * Process a mouse-up event on the 'remove' button
	 */
	releaseRemoveButton: function(event) {	
		if (transmission.checkButtonDisabled(event)) {
			event.data.transmission.remote.removeSelectedTorrents();
			if (iPhone) transmission.hideiPhoneAddressbar();
		}
	},

	/*
	 * Process a mouse-up event on the 'inspector' button
	 */
	releaseInspectorButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			event.data.transmission.toggleInspector();
		}
	},

	/*
	 * Process a mouse-up event on an 'inspector' tab
	 */
	releaseInspectorTab: function(event) {
	
		if (iPhone) event.stopPropagation();
		
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
		if (iPhone) transmission.hideiPhoneAddressbar();
	},
	
    /*
     * Process a mouse-up event on the 'filter' button
     */
	releaseFilterToggleButton: function(event) {
		if (transmission.checkButtonDisabled(event)) {
			event.data.transmission.toggleFilter();
		}
	},

	/*
	 * Process a mouse-up event on the 'filter all' button
	 */
	releaseFilterAllButton: function(event) {	
		event.data.transmission.remote.filterTorrents(event.data.transmission._FilterAll);
		$(this).siblings().removeClass('selected');
		$(this).addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter downloading' button
	 */
	releaseFilterDownloadingButton: function(event) {
		event.data.transmission.remote.filterTorrents(event.data.transmission._FilterDownloading);
		$(this).siblings().removeClass('selected');
		$(this).addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter seeding' button
	 */
	releaseFilterSeedingButton: function(event) {	
		event.data.transmission.remote.filterTorrents(event.data.transmission._FilterSeeding);
		$(this).siblings().removeClass('selected');
		$(this).addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'filter paused' button
	 */
	releaseFilterPausedButton: function(event) {
		event.data.transmission.remote.filterTorrents(event.data.transmission._FilterPaused);
		$(this).siblings().removeClass('selected');
		$(this).addClass('selected');
	},

	/*
	 * Process a mouse-up event on the 'Clutch Preferences' button (iPhone only)
	 */
	releaseClutchPreferencesButton: function(event) {
		$('div#prefs_container div#pref_error').hide();
		$('div#prefs_container h2.dialog_heading').show();
		transmission.remote.request('displayPrefs');
	},

	/*
	 * Turn the periodic ajax-refresh on & off
	 */
	togglePeriodicRefresh: function(state) {
		if (state && this._periodic_refresh == null) {
			// sanity check
			if (!this._refresh_rate) this._refresh_rate = 5;
			this._periodic_refresh = setInterval('transmission.remote.reloadTorrents()', this._refresh_rate * 1000);
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
	
		// iPhone conditions in the section allow us to not include transmenu
		// js to save some bandwidth; if we start using prefs on iPhone we
		// need to weed transmenu refs out of that too.
		
		// Set the filter
		this._current_filter = settings.filter;	
		$('#filter_' + settings.filter + '_link').parent().addClass('selected');
		
		// Set the sort_method
		this._current_sort_method = settings.sort_method;
		if (!iPhone) $('#sort_by_' + settings.sort_method).selectMenuItem();
		
		// Set the sort_direction
		this._current_sort_direction = settings.sort_direction;
		if (settings.sort_direction == this._SortDescending) {
			if (!iPhone) $('#reverse_sort_order').selectMenuItem();
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
		this.remote.request('refreshTorrents', null, this._current_filter);

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
				if ($(this).is('#refresh_rate')) {
					this.value = 5;
				} else {
					this.value = 0;
				}
			}
		});
    },
    
    /*
     * Display the preference dialog
     */
    displayPrefs: function(settings) {
		this.updatePrefs(settings);
		$('body').addClass('prefs_showing');
		$('#prefs_container').show();
		if (iPhone) {
			transmission.hideiPhoneAddressbar();
		} else if (Safari3) {
			setTimeout("$('div#prefs_container div.dialog_window').css('top', '0px');",10);
		}
		transmission.updateButtonStates();
    },
    
    /*
     * Process the preferences window with the provided values
     */
	updatePrefs: function(settings) {
		
		$('div.download_location input')[0].value      = settings.download_location;
		$('div.port input')[0].value                   = settings.port;
		$('div.auto_start input')[0].checked           = settings.auto_start;
		$('input#limit_download')[0].checked           = settings.limit_download;
		$('input#download_rate')[0].value              = settings.download_rate;
		$('input#limit_upload')[0].checked             = settings.limit_upload;
		$('input#upload_rate')[0].value                = settings.upload_rate;
		$('input#refresh_rate')[0].value               = settings.refresh_rate;
		$('div.encryption input')[0].checked           = (settings.encryption == transmission._EncryptionRequired);
		
		// Set the download rate
		if (!iPhone) {
		$('#limited_download_rate')[0].innerHTML = 'Limit (' + settings.download_rate + ' KB/s)';
			if (settings.limit_download) {
				$('#limited_download_rate').deselectMenuSiblings().selectMenuItem();			
			} else {
				$('#unlimited_download_rate').deselectMenuSiblings().selectMenuItem();
			}
		}
		
		// Set the upload rate
		if (!iPhone) {
		$('#limited_upload_rate')[0].innerHTML = 'Limit (' + settings.upload_rate + ' KB/s)';
			if (settings.limit_upload) {
				$('#limited_upload_rate').deselectMenuSiblings().selectMenuItem();			
			} else {
				$('#unlimited_upload_rate').deselectMenuSiblings().selectMenuItem();
			}
		}
		
		// Update the refresh rate and force the new value to be used next refresh
		transmission._refresh_rate = parseInt(settings.refresh_rate);
		if (transmission._periodic_refresh) {
			transmission.togglePeriodicRefresh(false);
			transmission.togglePeriodicRefresh(true);
		}
		$('#prefs_container').hide();
	},
    
    /*
     * Display an error if a preference update request fails
     */
    preferenceError: function(error_msg) {
		$('div#prefs_container h2.dialog_heading').hide();
		$('div#prefs_container div#pref_error')[0].innerHTML = error_msg;
		$('div#prefs_container div#pref_error').show();
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
		transmission._torrents.each(transmission.deselectTorrent, true);
        
        // reset the highest and lowest selected
        transmission._highest_selected = null;
        transmission._lowest_selected = null;
		transmission._num_selected_active_torrents = 0;
		transmission._num_selected_paused_torrents = 0;
		
		transmission.updateInspector();
		transmission.updateButtonStates();
    },
    
    /*
     * Set up the search box
     */
    setupSearchBox: function() {
		var search_box = $('#torrent_search');
		search_box[0].value = 'filter';
		search_box.bind('keyup', {transmission: this}, function(event) {
			event.data.transmission._current_search = this.value.trim();
		}).bind('blur', {transmission: this}, function(event) {
			if (this.value == '') {
				$(this).addClass('blur');
				this.value = 'filter';
				event.data.transmission._current_search = '';
			}
		}).bind('focus', {}, function(event) {
			if ($(this).is('.blur')) {
				this.value = '';
				$(this).removeClass('blur');
			}
		});
    },
    
    /*
     * Create the torrent right-click menu
     */
	createContextMenu: function() {
		
		var bindings = {
			context_pause_selected:    this.pauseSelectedTorrents,
			context_resume_selected:   this.resumeSelectedTorrents,
			context_remove:            this.remote.removeSelectedTorrents,
			context_toggle_inspector:  this.toggleInspector
		};
		
		// Setup the context menu
		$('ul#torrent_list').contextMenu('torrent_context_menu', {
			bindings:          bindings,
			menuStyle:         Menu.context.menu_style,
			itemStyle:         Menu.context.item_style,
			itemHoverStyle:    Menu.context.item_hover_style,
			itemDisabledStyle: Menu.context.item_disabled_style,
			shadow:            false,
			boundingElement:   $('div#torrent_container'),
			boundingRightPad:  20,
			boundingBottomPad: 5
		});
	},
    
    /*
     * Create the footer settings menu
     */
	createSettingsMenu: function() {
		$('#settings_menu').transMenu({
			selected_char: '&#x2714;',
			direction: 'up',
			onClick: this.processSettingsMenuEvent
		});
		
		// Make initial menu selections (TODO - do this with data from the daemon?)
		$('#unlimited_download_rate').selectMenuItem();
		$('#unlimited_upload_rate').selectMenuItem();
	},
    
    /*
     * Enable/disable the button states
     */
	updateButtonStates: function() {
		var showing_dialog = RegExp("(prefs_showing|dialog_showing|open_showing)").test(document.body.className);
		if (showing_dialog) {
			$('.torrent_global_menu ul li').addClass('disabled');
			return true;
		} else {
			$('.torrent_global_menu ul li.disabled').removeClass('disabled');
		if (this._num_selected_active_torrents == 0) {
				$('li#pause_selected').addClass('disabled');
				$('li.context_pause_selected').addClass('disabled');		
			} else {
				$('li#pause_selected.disabled').removeClass('disabled');
				$('li.context_pause_selected').removeClass('disabled');
			}
			
			if (this._num_selected_paused_torrents == 0) {
				$('li#resume_selected').addClass('disabled');
				$('li.context_resume_selected').addClass('disabled');
			} else {
				$('li#resume_selected.disabled').removeClass('disabled');
				$('li.context_resume_selected').removeClass('disabled');
			}
			
			if (this.numSelectedTorrents() == 0) {
				$('li#remove').addClass('disabled');
			} else {
				$('li#remove.disabled').removeClass('disabled');
			}
			
			if (this._global_active_torrents == false) {
				$('li#pause_all').addClass('disabled');
			} else {
				$('li#pause_all.disabled').removeClass('disabled');
			}
			
			if (this._global_paused_torrents == false) {
				$('li#resume_all').addClass('disabled');
			} else {
				$('li#resume_all.disabled').removeClass('disabled');
			}
			
			return true;
		}
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
					$('div#prefs_container div#pref_error').hide();
					$('div#prefs_container h2.dialog_heading').show();
					transmission.remote.request('displayPrefs');
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
				transmission.remote.request('setDownloadRate', rate);
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
				transmission.remote.request('setUploadRate', rate);
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
				transmission.remote.sortTorrents(sort_method, sort_direction);
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
    addTorrents: function(torrent_list, previous_torrent) {
        var torrent_data;
        var torrent;
		
		// Clear the inspector
		this.deselectAll();
		this.updateInspector();
		
		var num_existing_torrents = this._torrents.length();
		var num_new_torrents = torrent_list.length;
        for (i=0; i<num_new_torrents; i++) {
            torrent_data = torrent_list[i];
            torrent_data.position = i+1+num_existing_torrents;
            torrent = new Torrent(torrent_data);
			
            // Set the controller
            torrent.setController(this);
            
            // Set this torrent's neighbours
            if (previous_torrent != null) {
                torrent.setPreviousTorrent(previous_torrent);
                previous_torrent.setNextTorrent(torrent);
            }
            
            // Add to the collection
            this._torrents.set(torrent.id(), torrent);
            
			// Keep track of torrent statuses
			if (torrent.isActive()) {
				this._num_active_torrents++;
			} else {
				this._num_paused_torrents++;
			}
			
            previous_torrent = torrent;
        }
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
				$('#torrent_inspector_name')[0].innerHTML			= torrent.name();
				$('#torrent_inspector_size')[0].innerHTML			= Math.formatBytes(torrent.size());
				$('#torrent_inspector_tracker')[0].innerHTML		= torrent._tracker['address']+
															  		':'+torrent._tracker['port']+
															  		torrent._tracker['announce'];

				$('#torrent_inspector_hash')[0].innerHTML			= torrent.hash();
				$('#torrent_inspector_state')[0].innerHTML			= torrent.state();
				$('#torrent_inspector_download_speed')[0].innerHTML	= Math.formatBytes(torrent.downloadSpeed()) + '/s';
				$('#torrent_inspector_upload_speed')[0].innerHTML	= Math.formatBytes(torrent.uploadSpeed()) + '/s';
				$('#torrent_inspector_ratio')[0].innerHTML			= torrent.ratio();
				$('#torrent_inspector_uploaded')[0].innerHTML		= Math.formatBytes(torrent.uploadTotal());
				$('#torrent_inspector_downloaded')[0].innerHTML		= Math.formatBytes(torrent.downloadTotal());
				$('#torrent_inspector_have')[0].innerHTML		    = Math.formatBytes(torrent.downloadTotal()) + ' (' + Math.formatBytes(torrent.completed()) + ' verified)';
				$('#torrent_inspector_progress')[0].innerHTML		= torrent.percentCompleted() + '% (' + torrent.percentCompleted() + '% selected)';
				$('#torrent_inspector_upload_to')[0].innerHTML		= torrent.peersUploading();
				$('#torrent_inspector_download_from')[0].innerHTML	= torrent.peersDownloading();
				$('#torrent_inspector_swarm_speed')[0].innerHTML	= Math.formatBytes( torrent.swarmSpeed()) + '/s';
				$('#torrent_inspector_total_seeders')[0].innerHTML	= torrent.totalSeeders();
				$('#torrent_inspector_total_leechers')[0].innerHTML	= torrent.totalLeechers();		
		
				if (torrent._error_message && torrent._error_message != '') {
					$('#torrent_inspector_error')[0].innerHTML		= torrent.errorMessage();
				} else {
					$('#torrent_inspector_error')[0].innerHTML		= 'N/A';
				}
				if (torrent._comment && torrent._comment != '') {
					$('#torrent_inspector_comment')[0].innerHTML	= torrent.comment();
				} else {
					$('#torrent_inspector_comment')[0].innerHTML	= 'N/A';
				}
				if (torrent._creator && torrent._creator != '') {
					$('#torrent_inspector_creator')[0].innerHTML	= torrent.creator();
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
				var total_upload_speed = 0;
				var total_download_speed = 0;
				var total_seeders = 0;
				var total_leechers = 0;
				var total_upload_to = 0;
				var total_download_from = 0;
				var total_swarm_speed = 0;
				var total_state = '';
				var total_tracker = '';

				if (torrent_count == 0) {
					if (iPhone) {
					transmission.hideInspector();
					}
					$('#torrent_inspector_name')[0].innerHTML			= 'No Torrent Selected';
				} else {
					$('#torrent_inspector_name')[0].innerHTML			= torrent_count + ' Torrents Selected';
					total_state = this._selected_torrents.first().state(); 
					total_tracker = this._selected_torrents.first()._tracker['address']+':'+this._selected_torrents.first()._tracker['port']+this._selected_torrents.first()._tracker['announce']; 
				}
				for (i=0; i<torrent_count; i++) {
					total_upload += this._selected_torrents.itemByIndex(i).uploadTotal();
					total_download += this._selected_torrents.itemByIndex(i).downloadTotal();
					total_upload_speed += this._selected_torrents.itemByIndex(i).uploadSpeed();
					total_download_speed += this._selected_torrents.itemByIndex(i).downloadSpeed();
					total_seeders += this._selected_torrents.itemByIndex(i).totalSeeders();
					total_leechers += this._selected_torrents.itemByIndex(i).totalLeechers();
					total_upload_to += this._selected_torrents.itemByIndex(i).peersUploading();
					total_download_from += this._selected_torrents.itemByIndex(i).peersDownloading();
					total_swarm_speed += this._selected_torrents.itemByIndex(i).swarmSpeed();
					if ( total_state.search ( this._selected_torrents.itemByIndex(i).state() ) == -1 )
						total_state += '/' + this._selected_torrents.itemByIndex(i).state();
					var tracker = this._selected_torrents.itemByIndex(i)._tracker['address']+':'+this._selected_torrents.itemByIndex(i)._tracker['port']+this._selected_torrents.itemByIndex(i)._tracker['announce'];
					if ( total_tracker.search ( tracker ) == -1 )  
						total_tracker += '/' + tracker;
				}

				var total_ratio = 0;
				if ( total_upload > 0 && total_download > 0 ) {
					total_ratio = total_upload / total_download;		
				}

				$('#torrent_inspector_size')[0].innerHTML			= '';
				$('#torrent_inspector_tracker')[0].innerHTML		= total_tracker;
				$('#torrent_inspector_hash')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_state')[0].innerHTML			= total_state;
				$('#torrent_inspector_ratio')[0].innerHTML			= Math.roundWithPrecision ( total_ratio, 2 );
				$('#torrent_inspector_uploaded')[0].innerHTML		= Math.formatBytes(total_upload);
				$('#torrent_inspector_download_speed')[0].innerHTML	= Math.formatBytes(total_download_speed) + '/s';
				$('#torrent_inspector_upload_speed')[0].innerHTML	= Math.formatBytes(total_upload_speed) + '/s';
				$('#torrent_inspector_downloaded')[0].innerHTML		= Math.formatBytes(total_download);
				$('#torrent_inspector_upload_to')[0].innerHTML		= total_upload_to;
				$('#torrent_inspector_download_from')[0].innerHTML	= total_download_from;
				$('#torrent_inspector_swarm_speed')[0].innerHTML	= Math.formatBytes(total_swarm_speed) + '/s';
				$('#torrent_inspector_total_seeders')[0].innerHTML	= total_seeders;
				$('#torrent_inspector_total_leechers')[0].innerHTML	= total_leechers;
				$('#torrent_inspector_creator')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_comment')[0].innerHTML		= 'N/A';
				$('#torrent_inspector_creator_date')[0].innerHTML	= 'N/A';
				$('#torrent_inspector_secure')[0].innerHTML			= 'N/A';
				$('#torrent_inspector_have')[0].innerHTML		    = 'N/A';
				$('#torrent_inspector_progress')[0].innerHTML		= 'N/A';
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
		$('#torrent_inspector').show();
		if (iPhone) {
			$('body').addClass('inspector_showing');
			transmission.hideiPhoneAddressbar();
		} else {
			$('#torrent_filter_bar')[0].style.right = $('#torrent_inspector').width() + 1 + 'px';
			$('#torrent_container')[0].style.right = $('#torrent_inspector').width() + 1 + 'px';
		}
		transmission._inspector_visible = true;
		transmission.updateInspector();
		
		$('ul li#context_toggle_inspector')[0].innerHTML = 'Hide Inspector';

		// Tell the server about this action
		if (! dont_inform_server) {
			transmission.remote.setPreference('show_inspector', true);
		}
	},
    
    /*
     * Hide the inspector
     */
	hideInspector: function() {

		$('#torrent_inspector').hide();
		transmission._inspector_visible = false;
		
		if (iPhone) {
			var torrent_count = transmission.numSelectedTorrents();
			if (torrent_count > 0) {
				for ( var i = 0; i < torrent_count; i++) {
					transmission.deselectTorrent(transmission._selected_torrents.first());
				}
			}
			$('body.inspector_showing').removeClass('inspector_showing');
			transmission.hideiPhoneAddressbar();
		} else {
			$('#torrent_filter_bar')[0].style.right = '0px';
			$('#torrent_container')[0].style.right = '0px';
			$('ul li#context_toggle_inspector')[0].innerHTML = 'Show Inspector';
		}
		
		// Tell the server about this action
		transmission.remote.setPreference('show_inspector', false);
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
		var container_top = parseInt($('#torrent_container').css('top')) + $('#torrent_filter_bar').height() + 1;
		$('#torrent_container').css('top', container_top + 'px');
		$('#torrent_filter_bar').show();
		transmission._filter_visible = true;
		if (! dont_inform_server) {
			transmission.remote.setPreference('show_filter', true);
		}
	},
	
    /*
     * Hide the filter bar
     */
	hideFilter: function() {
		var container_top = parseInt($('#torrent_container').css('top')) - $('#torrent_filter_bar').height() - 1;
		$('#torrent_container').css('top', container_top + 'px');
		$('#torrent_filter_bar').hide();
		transmission._filter_visible = false;
		transmission.remote.setPreference('show_filter', false);
	},

    /*
     * Remove all the torrents from the interface to force a re-sort
     */
    refreshAndSortTorrents: function(data) {
		$('#upload_container').hide();
		transmission.removeTorrents(transmission._torrents.keys().clone());
		transmission.refreshTorrents(data);
	},

    /*
     * Load a list of torrents into the application
     */
    refreshTorrents: function(data) {
        var torrent_data;
        var torrent_ids = transmission._torrents.keys().clone();
        var new_torrents = [];
		var torrent_list = data.torrent_list;
		var last_torrent;
			
		this._num_active_torrents = 0;
		this._num_paused_torrents = 0;
		this._num_selected_active_torrents = 0;
		this._num_selected_paused_torrents = 0;
		this._global_active_torrents = false;
		this._global_paused_torrents = false;
		this._total_torrents = 0;
		
		// set bools for whether Transmission has active/paused torrents *anywhere*
		this._global_active_torrents = data.active_torrents;
		this._global_paused_torrents = data.paused_torrents;
		// and the number of torrents Transmission currently has
		this._total_torrents = data.total_torrents;

		// If the length of the new torrent_list isn't equal to the number of torrents in
		// the browser (if a torrent has been added/deleted/filtered for example), we
		// need to clear the list & force a re-sort
		if (torrent_ids.length > 0 && torrent_ids.length != torrent_list.length) {
			transmission.removeTorrents(transmission._torrents.keys().clone());
			torrent_ids = [];
			if (iPhone) transmission.hideInspector();
		}

        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
	
			// If this torrent already exists, refresh it & remove this ID from torrent_ids
			if (torrent_ids.inArray(torrent_data.id)) {
				var torrent = transmission._torrents.item(torrent_data.id)
				torrent.refresh(torrent_data);
				if (torrent.isActive()) {
					this._num_active_torrents++;
					if (torrent.isSelected()) {
						this._num_selected_active_torrents++;
					}
				} else {
					this._num_paused_torrents++;
					if (torrent.isSelected()) {
						this._num_selected_paused_torrents++;
					}
				}
				torrent_ids.remove(torrent_data.id);
				last_torrent = torrent;
			
			// Otherwise, this is a new torrent - add it
			} else {
				new_torrents.push(torrent_data);
			}
        }
		
		// Add any torrents that aren't already being displayed
		if (new_torrents.length > 0) {
			transmission.addTorrents(new_torrents, last_torrent);
			// Run the hide addressbar/scroll to top function for iPhone every
			// time the torrent list is reset (including first load)
			updateLayout();
		}

		// Remove any torrents that are displayed but not in the refresh list
		// The 'update_only' flag is sent went pausing/resuming torrents
		if (torrent_ids.length > 0) {
			transmission.removeTorrents(torrent_ids);
		}
		
		// Update the alternating torrent background colors
		transmission.setTorrentBgColors();
		
		// Update global upload and download speed display
		transmission.setGlobalSpeeds(torrent_list.length,  data.total_upload_rate, data.total_download_rate);
		
		// Update the disk space remaining
		var disk_space_msg = 'Free Space: ' + Math.formatBytes(data.free_space_bytes) + ' (' + data.free_space_percent + '% )';
		$('div#disk_space_container')[0].innerHTML = disk_space_msg;
		
		// Update the button states
		transmission.updateButtonStates();
		
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
		$('#torrent_global_transfer')[0].innerHTML = num_torrents + ' of ' + this._total_torrents + ' Transfers';
		if (iPhone) {
			if (global_up_speed != null) {
				$('#torrent_global_upload')[0].innerHTML = 'UL: ' + Math.formatBytes(global_up_speed) + '/s';
			}
			if (global_down_speed != null) {
				$('#torrent_global_download')[0].innerHTML = 'DL: ' + Math.formatBytes(global_down_speed) + '/s';
			}
		} else {
			if (global_up_speed != null) {
				$('#torrent_global_upload')[0].innerHTML = Math.formatBytes(global_up_speed) + '/s';
			}
			if (global_down_speed != null) {
				$('#torrent_global_download')[0].innerHTML = Math.formatBytes(global_down_speed) + '/s';
			}
		}
    },
    
    /*
     * Select a torrent file to upload
     */
    uploadTorrentFile: function(confirmed) {
	
		// Display the upload dialog
		if (! confirmed) {
				$('input#torrent_upload_file').attr('value', '');
				$('input#torrent_upload_url').attr('value', ''); 
				$('#upload_container').show();
			if (!iPhone && Safari3) {
				setTimeout("$('div#upload_container div.dialog_window').css('top', '0px');",10);
			}
			
		// Submit the upload form			
		} else {
			// Set the form action with the appropriate params
			$('#torrent_upload_form')[0].action = 'remote/index.php?action=uploadTorrent&param=[]' + 
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
			transmission.remote.pauseTorrents(transmission._selected_torrents.keys());
		}
    },
    
    /*
     * Resume any currently selected torrents
     */
    resumeSelectedTorrents: function() {
		if (transmission.numSelectedTorrents() > 0) {				
			transmission.remote.resumeTorrents(transmission._selected_torrents.keys());
		}		
    },	
    
    /*
     * Pre-load the images
     */
    preloadImages: function() {
    if (iPhone) {
		this.loadImages(
			'images/buttons/info_activity.png',
			'images/buttons/info_general.png',
			'images/graphics/filter_bar.png',
			'images/buttons/toolbar_buttons.png',
			'images/graphics/iphone_chrome.png',
			'images/graphics/logo.png',
			'images/progress/progress.png'
		);
		} else {
		this.loadImages(
			'images/graphics/filter_bar.png',
			'images/buttons/torrent_buttons.png',
			'images/buttons/toolbar_buttons.png',
			'images/buttons/info_activity.png',
			'images/buttons/info_general.png',
			'images/buttons/tab_backgrounds.png',
			'images/graphics/chrome.png',
			'images/graphics/logo.png',
			'images/progress/progress.png'
		);
		}
    },
	loadImages: function() {
		for(var i = 0; i<arguments.length; i++) {
			jQuery("<img>").attr("src", arguments[i]);
		}
	},
	checkButtonDisabled: function(e) {
		target_parent = e.target ? e.target.parentNode : e.srcElement.parentNode;
		return (target_parent.className == "disabled" || target_parent.parentNode.className == "disabled") ? false : true;
	},
	hideiPhoneAddressbar: function(timeInSeconds) {
		var delayLength = timeInSeconds ? timeInSeconds*1000 : 10;
		// not supported on iPhone? check this.
		if(/*document.body.scrollTop!=1 && */scroll_timeout==null) {
			scroll_timeout = setTimeout("transmission.doToolbarHide()", delayLength);
		}
	},
	doToolbarHide: function() {
		window.scrollTo(0,1);
		scroll_timeout=null;
	}
}