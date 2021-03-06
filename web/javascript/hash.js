/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class Hash
 */

function Hash(){
    this.initialize(arguments);
} 
 
Hash.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
		this._length = 0;
		this._items = new Array();
		this._keys = new Array();
		for (var i = 0; i < arguments.length; i += 2) {
			if (typeof(arguments[i + 1]) != 'undefined') {
				this._items[arguments[i]] = arguments[i + 1];
				this._keys.push(arguments[i]);
				this._length++;
			}
		}
	},

    /*
     * Return the length of the hash
     */
	length: function() {
		return this._keys.length;
	},

    /*
     * Return the first item in the hash
     */
	first: function() {
		var result;
		if (this._keys.length > 0) {
		 	result = this._items[this._keys[0]];
		}
		return result;
	},

    /*
     * Return an array of keys for this hash
     */
	keys: function() {
		return this._keys;
	},

    /*
     * Run a function on each element in the hash
     */
	invoke: function(fn) {
		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		
		for (var i = 0; i < this._keys.length; i++) {
			fn.apply(this._items[this._keys[i]], args);
		}
	},

    /*
     * Run a function on each element in the hash
     */
	each: function(fn) {
		var args = [];
		for (var i = 1; i < arguments.length; i++) {
			args.push(arguments[i]);
		}
		
		for (var i = 0; i < this._keys.length; i++) {
			fn(this._items[this._keys[i]], args);
		}
	},

    /*
     * Remove an item from the hash
     */
	remove: function(key) {
		var tmp_value;
		if (typeof(this._items[key]) != 'undefined') {
			this._length--;
			var tmp_value = this._items[key];
			delete this._items[key];
			this._keys.remove(key);
		}	   
		return tmp_value;
	},

    /*
     * Get an item from the hash
     */
	item: function(key) {
		return this._items[key];
	},

    /*
     * Get a hashed list of items from this hash
     */
	items: function(keys) {
		var result = new Hash();
		for (var i = 0; i < keys.length; i++) {
			result.set(keys[i], this.item(i).clone());
		}
		return result;
	},

    /*
     * Get an item from the hash by index
     */
	itemByIndex: function(index) {
		return this._items[this._keys[index]];
	},

    /*
     * Set an item in the hash
     */
	set: function(in_key, in_value) {
		if (typeof(in_value) != 'undefined') {
			if (typeof(this._items[in_key]) == 'undefined') {
				this._length++;
			}
			this._items[in_key] = in_value;
			if (! this._keys.inArray(in_key)) {
				this._keys.push(in_key);
			}
		}	   
		return in_value;
	},

    /*
     * Return true if the item is in the hash
     */
	hasKey: function(key) {
		return typeof(this._items[key]) != 'undefined';
	}
}