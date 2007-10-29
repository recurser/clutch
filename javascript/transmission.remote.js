/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class TransmissionRemote
 */

function TransmissionRemote(controller) {
    this.initialize(controller);
	return this;
} 
 
TransmissionRemote.prototype = {

    /*
     * Constructor
     */
    initialize: function(controller) {
		this._controller = controller;
	},

	/*
	 * Perform a generic remote request
	 */
	request: function(action, param, filter, sort_method, sort_direction, search) {
		if (param == null) {
			param = '0';
		}
		
		if (filter == null) {
			filter = this._controller.currentFilter();
		}
		
		if (sort_method == null) {
			sort_method = this._controller.currentSortMethod();
		}
		
		if (sort_direction == null) {
			sort_direction = this._controller.currentSortDirection();
		}
		
		if (search == null) {
			search = this._controller.currentSearch();
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
			error: this._controller.ajaxError
        });
	},
    
    /*
     * Request the initial settings for the web client (up/down speed etc)
     */
	setPreference: function(key, value) {
        this.request('setPreferences', '{"'+key+'":'+value+'}');	
    },
    
    /*
     * Refresh the torrent data
     */
    reloadTorrents: function() {
        this.request('refreshTorrents', null, this._current_filter);
    },
    
    /*
     * Filter the torrent data
     */
    filterTorrents: function(filter_type) {
		if (filter_type != this._controller.currentFilter()) {
			this._controller.setCurrentFilter(filter_type);
        	this.request('filterTorrents', null, filter_type);
		}
    },
    
    /*
     * Sort the torrent data
     */
    sortTorrents: function(sort_method, sort_direction) {
	
		if (sort_method != this._controller.currentSortMethod()) {
			this._controller.setCurrentSortMethod(sort_method);	
		}
	
		if (sort_direction != this._controller.currentSortDirection()) {
			this._controller.setCurrentSortDirection(sort_direction);
		}
		
       	this.request('sortTorrents', null, this._controller.currentFilter(), sort_method, sort_direction);
    },
    
    /*
     * Pause torrents
     */
    pauseTorrents: function(torrent_id_list) {		
		var json_torrent_id_list = torrent_id_list.json();
		this.request('pauseTorrents', json_torrent_id_list);
    },
    
    /*
     * Resume torrents
     */
    resumeTorrents: function(torrent_id_list) {
		var json_torrent_id_list = torrent_id_list.json();
		this.request('resumeTorrents', json_torrent_id_list);
    },
    
    /*
     * Save preferences
     */
    savePrefs: function() {	
		// Clear any errors
		$('div#prefs_container div#pref_error').hide();
		$('div#prefs_container h2.dialog_heading').show();
					
		// Set the form action with the appropriate params
		$('#prefs_form')[0].action = 'remote/?action=savePrefs&param=[]' + 
				'&filter=' + this._controller.currentFilter() +
				'&sort_method=' + this._controller.currentSortMethod() +
				'&sort_direction=' + this._controller.currentSortDirection() +
				'&search=' + this._controller.currentSearch();
		$('#prefs_form').ajaxSubmit({dataType: 'script', type: 'POST'});
    },
    
    /*
     * Remove selected torrents
     */
    removeSelectedTorrents: function(confirmed) {
		
		var num_torrents = this._controller.numSelectedTorrents();
		if (num_torrents > 0) {
			
			if (confirmed !== true) {
				var dialog_heading       = 'Confirm Removal of ' + num_torrents + ' Transfers';
				var dialog_message = 'There are ' + num_torrents + ' transfers (' + this._controller.numSelectedActiveTorrents();
				dialog_message    += ' active). Once Removed,<br />continuing the transfers will require the torrent files.';
				dialog_message    += '<br />Do you really want to remove them?';
				dialog.confirm(dialog_heading, dialog_message, 'Remove', 'transmission.remote.removeSelectedTorrents(true)');
			
			} else {	
				// Send an ajax request to perform the action
				this.request('removeTorrents', this._controller.selectedTorrents().keys().json());			
			}
		}
    }
}