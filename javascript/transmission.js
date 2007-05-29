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
		Event.observe($('pause_all_link'), 'mousedown', this.clickPauseAllButton.bindAsEventListener(this));
		Event.observe($('pause_all_link'), 'mouseup', this.releasePauseAllButton.bindAsEventListener(this));
		Event.observe($('pause_all_link'), 'mouseout', this.mouseOutPauseAllButton.bindAsEventListener(this));

		Event.observe($('resume_all_link'), 'mousedown', this.clickResumeAllButton.bindAsEventListener(this));
		Event.observe($('resume_all_link'), 'mouseup', this.releaseResumeAllButton.bindAsEventListener(this));
		Event.observe($('resume_all_link'), 'mouseout', this.mouseOutResumeAllButton.bindAsEventListener(this));
		
		Event.observe($('filter'), 'mousedown', this.clickFilterButton.bindAsEventListener(this));
		Event.observe($('filter'), 'mouseup', this.releaseFilterButton.bindAsEventListener(this));
		Event.observe($('filter'), 'mouseout', this.mouseOutFilterButton.bindAsEventListener(this));

		Event.observe($('pause_selected_link'), 'mousedown', this.clickPauseSelectedButton.bindAsEventListener(this));
		Event.observe($('pause_selected_link'), 'mouseup', this.releasePauseSelectedButton.bindAsEventListener(this));
		Event.observe($('pause_selected_link'), 'mouseout', this.mouseOutPauseSelectedButton.bindAsEventListener(this));

		Event.observe($('resume_selected_link'), 'mousedown', this.clickResumeSelectedButton.bindAsEventListener(this));
		Event.observe($('resume_selected_link'), 'mouseup', this.releaseResumeSelectedButton.bindAsEventListener(this));
		Event.observe($('resume_selected_link'), 'mouseout', this.mouseOutResumeSelectedButton.bindAsEventListener(this));

		Event.observe($('open_link'), 'mousedown', this.clickOpenButton.bindAsEventListener(this));
		Event.observe($('open_link'), 'mouseup', this.releaseOpenButton.bindAsEventListener(this));
		Event.observe($('open_link'), 'mouseout', this.mouseOutOpenButton.bindAsEventListener(this));

		Event.observe($('remove_link'), 'mousedown', this.clickRemoveButton.bindAsEventListener(this));
		Event.observe($('remove_link'), 'mouseup', this.releaseRemoveButton.bindAsEventListener(this));
		Event.observe($('remove_link'), 'mouseout', this.mouseOutRemoveButton.bindAsEventListener(this));

		Event.observe($('filter_link'), 'mousedown', this.clickFilterButton.bindAsEventListener(this));
		Event.observe($('filter_link'), 'mouseup', this.releaseFilterButton.bindAsEventListener(this));
		Event.observe($('filter_link'), 'mouseout', this.mouseOutFilterButton.bindAsEventListener(this));

		Event.observe($('inspector_link'), 'mousedown', this.clickInspectorButton.bindAsEventListener(this));
		Event.observe($('inspector_link'), 'mouseup', this.releaseInspectorButton.bindAsEventListener(this));
		Event.observe($('inspector_link'), 'mouseout', this.mouseOutInspectorButton.bindAsEventListener(this));
		
		// Inspector tabs
		Event.observe($('inspector_tab_info'), 'mouseup', this.releaseInspectorTab.bindAsEventListener(this));
		Event.observe($('inspector_tab_activity'), 'mouseup', this.releaseInspectorTab.bindAsEventListener(this));
		Event.observe($('inspector_tab_files'), 'mouseup', this.releaseInspectorTab.bindAsEventListener(this));

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
		this.setInspector(torrent);
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

		// Destroy inspector
		//this.destroyInspector();

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
	clickPauseAllButton: function(event) {
		Event.stop(event);			
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'pause all' button
	 */
	releasePauseAllButton: function(event) {
		Event.stop(event);			
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all.png)';	
		this.pauseAllTorrents();
	},

	/*
	 * Process a mouse-out event on the 'pause all' button
	 */
	mouseOutPauseAllButton: function(event) {
		Event.stop(event);
		$('pause_all_link').style.backgroundImage = 'url(images/buttons/pause_all.png)';
	},

	/*
	 * Process a mouse-down event on the 'resume all' button
	 */
	clickResumeAllButton: function(event) {
		Event.stop(event);
		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'resume all' button
	 */
	releaseResumeAllButton: function(event) {
		Event.stop(event);			
		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all.png)';	
		this.resumeAllTorrents();
	},

	/*
	 * Process a mouse-out event on the 'resume all' button
	 */
	mouseOutResumeAllButton: function(event) {
		Event.stop(event);
		$('resume_all_link').style.backgroundImage = 'url(images/buttons/resume_all.png)';
	},

	/*
	 * Process a mouse-down event on the 'pause selected' button
	 */
	clickPauseSelectedButton: function(event) {
		Event.stop(event);			
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'pause selected' button
	 */
	releasePauseSelectedButton: function(event) {
		Event.stop(event);			
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected.png)';		
		this.pauseSelectedTorrents();
	},

	/*
	 * Process a mouse-out event on the 'pause selected' button
	 */
	mouseOutPauseSelectedButton: function(event) {
		Event.stop(event);
		$('pause_selected_link').style.backgroundImage = 'url(images/buttons/pause_selected.png)';
	},

	/*
	 * Process a mouse-down event on the 'resume selected' button
	 */
	clickResumeSelectedButton: function(event) {
		Event.stop(event);
		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected_on.png)';
	},

	/*
	 * Process a mouse-up event on the 'resume selected' button
	 */
	releaseResumeSelectedButton: function(event) {
		Event.stop(event);			
		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected.png)';
		
		// Send an ajax request to perform the action (have to convert key strings to integers)
		var torrent_id_list = this._selected_torrents.keys().collect(function(s) {return parseInt(s)}).toJSON();
		this.remoteRequest('resumeTorrents', torrent_id_list);
	},

	/*
	 * Process a mouse-out event on the 'resume selected' button
	 */
	mouseOutResumeSelectedButton: function(event) {
		Event.stop(event);
		$('resume_selected_link').style.backgroundImage = 'url(images/buttons/resume_selected.png)';
	},

	/*
	 * Process a mouse-down event on the 'open' button
	 */
	clickOpenButton: function(event) {	
		Event.stop(event);
		$('open_link').style.backgroundImage = 'url(images/buttons/open_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'open' button
	 */
	releaseOpenButton: function(event) {
		Event.stop(event);		
		$('open_link').style.backgroundImage = 'url(images/buttons/open.png)';
	},

	/*
	 * Process a mouse-out event on the 'open' button
	 */
	mouseOutOpenButton: function(event) {
		Event.stop(event);
		$('open_link').style.backgroundImage = 'url(images/buttons/open.png)';
	},

	/*
	 * Process a mouse-down event on the 'remove' button
	 */
	clickRemoveButton: function(event) {	
		Event.stop(event);
		$('remove_link').style.backgroundImage = 'url(images/buttons/remove_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'remove' button
	 */
	releaseRemoveButton: function(event) {
		Event.stop(event);		
		$('remove_link').style.backgroundImage = 'url(images/buttons/remove.png)';
	},

	/*
	 * Process a mouse-out event on the 'remove' button
	 */
	mouseOutRemoveButton: function(event) {
		Event.stop(event);
		$('remove_link').style.backgroundImage = 'url(images/buttons/remove.png)';
	},

	/*
	 * Process a mouse-down event on the 'inspector' button
	 */
	clickInspectorButton: function(event) {	
		Event.stop(event);
		$('inspector_link').style.backgroundImage = 'url(images/buttons/info_toolbar_on.png)';	
	},

	/*
	 * Process a mouse-up event on the 'inspector' button
	 */
	releaseInspectorButton: function(event) {
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

	/*
	 * Process a mouse-out event on the 'inspector' button
	 */
	mouseOutInspectorButton: function(event) {
		Event.stop(event);
		$('inspector_link').style.backgroundImage = 'url(images/buttons/info.png)';
	},

	/*
	 * Process a mouse-up event on an 'inspector' tab
	 */
	releaseInspectorTab: function(event) {
		Event.stop(event);
		
		// Unselect all the tabs, select the clicked tab, and display the appropriate info
		var tab_ids = ['inspector_tab_info', 'inspector_tab_activity', 'inspector_tab_files'];
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
     * Process a mouse-down event on the 'filter' button
     */
	clickFilterButton: function(event) {
		Event.stop(event);
		$('filter_link').style.backgroundImage = 'url(images/buttons/filter_on.png)';	
	},
	
    /*
     * Process a mouse-up event on the 'filter' button
     */
	releaseFilterButton: function(event) {
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
	
    /*
     * Process a mouse-out event on the 'filter' button
     */
	mouseOutFilterButton: function(event) {
		Event.stop(event);
		$('filter_link').style.backgroundImage = 'url(images/buttons/filter.png)';
	},
	
    /*
     * Process a torrent right-click-menu event
     */
	releaseTorrentRightClickMenu: function(event) {		
		Event.stop(event);
		
		// Lower-case and replace spaces with underscores to keep the args regular
		var command = Event.element(event).innerHTML.toLowerCase().replace(/ /,'_');
		
		switch (command) {
			case 'pause_selected':
				this.pauseSelectedTorrents();
				break;				
			case 'resume_selected':
				this.resumeSelectedTorrents();
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
    addTorrents: function(torrent_list) {
        var torrent_data;
        var torrent;
        var previous_torrent;
		var global_up_speed = 0;
		var global_down_speed = 0;
        
        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
            torrent_data.position = i+1;
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

	setInspector: function(torrent) {
		$('torrent_inspector_name').innerHTML		= torrent._name;
		$('torrent_inspector_size').innerHTML		= Math.formatBytes(torrent._size);
		$('torrent_inspector_tracker').innerHTML	= torrent._tracker['address']+
													  ':'+torrent._tracker['port']+
													  torrent._tracker['announce'];

		$('torrent_inspector_hash').innerHTML		= torrent._hash;

		if (torrent._private == 1)
			$('torrent_inspector_secure').innerHTML = 'Private Torrent';
		else
			$('torrent_inspector_secure').innerHTML	= 'Public Torrent';

		$('torrent_inspector_creator').innerHTML	= torrent._creator;
		$('torrent_inspector_creator_date').innerHTML	= Math.formatTimestamp(torrent._creator_date);
		$('torrent_inspector_torrent_file').value		= torrent._torrent_file;
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
    },
    
    /*
     * Set the global up and down speed in the interface
     */
    setGlobalSpeeds: function(num_torrents, global_up_speed, global_down_speed) {
	
		// Update global upload and download speed display
		$('torrent_global_upload').innerHTML = 'Total UL: ' + Math.formatBytes(global_up_speed) + '/s';
		$('torrent_global_download').innerHTML = 'Total DL: ' + Math.formatBytes(global_down_speed) + '/s';
		$('torrent_global_transfer').innerHTML = num_torrents + ' Transfers';
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
        transmission.remoteRequest('reloadTorrents');	
    },
    
    /*
     * Pause selected torrents
     */
    pauseSelectedTorrents: function() {		
		// Send an ajax request to perform the action (have to convert key strings to integers)
		var torrent_id_list = this._selected_torrents.keys().collect(function(s) {return parseInt(s)}).toJSON();
		this.remoteRequest('pauseTorrents', torrent_id_list);
    },
    
    /*
     * Resume selected torrents
     */
    resumeSelectedTorrents: function() {		
		// Send an ajax request to perform the action (have to convert key strings to integers)
		var torrent_id_list = this._selected_torrents.keys().collect(function(s) {return parseInt(s)}).toJSON();
		this.remoteRequest('resumeTorrents', torrent_id_list);
    },
    
    /*
     * Pause all torrents
     */
    pauseAllTorrents: function() {	
		// Send an ajax request to perform the action
		this.remoteRequest('pauseTorrents');
    },
    
    /*
     * Resume all torrents
     */
    resumeAllTorrents: function() {
		// Send an ajax request to perform the action
		this.remoteRequest('resumeTorrents');
    }
		



}