/*
 *	Copyright © Malcolm Jarvis and Kendall Hopkins
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
        var _torrent_list;
        var _last_torrent_clicked;
        var _highest_selected;
        var _lowest_selected;
        
        this._torrent_list = new Hash({});
        
        // Get the initial list of torrents from the remote app
        this.getTorrentList();
        
        // Observe key presses
        document.addEventListener("keydown",this.keyDown.bindAsEventListener(this),false);

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
        var torrent_data;
        
        for (i=0; i<torrent_list.length; i++) {
            torrent_data = torrent_list[i];
			this._torrent_list[torrent_data.id].refresh(torrent_data);
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
     * Refrsh the torrent data
     */
    reloadTorrents: function() {
        transmission.remoteRequest('reloadTorrents');	
    }



}




