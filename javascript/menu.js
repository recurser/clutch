/** 
* @description		Context menu using prototype.js
* @author			Juriy Zaytsev; kangax@gmail.com; http://yura.thinkweb2.com
* @version			0.1
* @date				4/15/07
* @requires			prototype.js
*/

/** 
* @classDescription		Initializes context menu: attaching events and creating initial menu element. Defines show() and hide() methods.
* @param				{string/object} selector; Selector to attach context menu functionality to, accepts any CSS3 selector
* @param				{string} menuClassName; Class name for menu styling. It is recommended to keep all styles inside css file under this name
* @param				{array} links; Array of links to display in a menu. Separator is recognized as '.'
*/
var Menu = Class.create();
Menu.prototype = {
	initialize: function (selector, menuClassName, links) {
		if ($$(selector).first()) {
			this.bounding_element = $$(selector).first();
			this.bounding_element.observe('contextmenu', function(e){
				this.show(e);
				Event.stop(e);
			}.bindAsEventListener(this));
		}
		Event.observe(document, 'click', function(){
			this.hide();
		}.bindAsEventListener(this), false);
		this.container = document.createElement('div');
		Element.addClassName(this.container, menuClassName);
		this.container.id = menuClassName;
		menuClassName
		for (var i=0, len=links.length; i<len; i++){
			if (links[i]=='.') {
				var link = document.createElement('div');
				Element.addClassName(link, 'separator');
				this.container.appendChild(link);
			}
			else {
				var link = document.createElement('a');
				link.href = '#';
				link.title = links[i];
				link.onclick = function(e){
					this.container.hide();
					if (transmission) {
						transmission.releaseTorrentRightClickMenu(e);
					}
				}.bindAsEventListener(this);
				link.appendChild(document.createTextNode(links[i]));
				this.container.appendChild(link);
			}
		}
		this.container.style.display = 'none';
		document.body.appendChild(this.container);
	},
	
	show: function(e){		
		// Constrain to within the boundaries of the torrent box
		var padding_x = 16; 
		var padding_y = 5;
		var bounding_element_right = this.bounding_element.getDimensions().width;
		var bounding_element_bottom = parseInt($$('.torrent_footer').first().getStyle('top'));		
		var menu_width = this.container.getDimensions().width
		var menu_height = this.container.getDimensions().height
		var menu_right = Event.pointerX(e) + menu_width;
		var menu_bottom = Event.pointerY(e) + menu_height;
			
		if (menu_right > bounding_element_right) {
			var left_position = bounding_element_right - menu_width - padding_x;
			this.container.style.left = left_position + 'px';
		} else {
			this.container.style.left = Event.pointerX(e)+'px';
		}
		
		if (menu_bottom > bounding_element_bottom) {
			var bottom_position = bounding_element_bottom - menu_height - padding_y;
			this.container.style.top = bottom_position + 'px';
		} else {
			this.container.style.top = Event.pointerY(e)+'px';
		}
		
		// Added to force transmission to display
		this.container.style.position = 'absolute';
		this.container.style.display = 'block';
		this.container.style.zIndex = 3;
	},
	
	hide: function(){
		this.container.style.display = 'none';
		return true;
	}
};
		
// Create contextual right-click menu for torrents on page load
// common.js is probably a better place for this initialisation but
// it doesn't seem to work
// TODO: Figure out why
Event.observe(window, 'load', function() {
	var links = ['Pause Selected','Resume Selected','Resume Selected Without Wait',
				'.','Remove From List...','Remove Downloaded File...',
				'Remove Torrent File...','Remove All Files...','.','Hide Inspector'];
	var menuObj = new Menu('div#torrent_container', 'torrent_context_menu', links);
}, false);