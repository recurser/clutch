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

function Menu(selector, menuClassName, links){
    this.initialize(selector, menuClassName, links);
} 

Menu.prototype = {
	initialize: function (selector, menuClassName, links) {
		if ($(selector).length > 0) {
			this.bounding_element = $(selector);
			this.bounding_element.bind('contextmenu', {menu: this}, function(event) {
				event.data.menu.show(event);
			});
		}
		$(document).bind('click', {menu: this}, function(event) {
			event.data.menu.hide();
		});
		this.container = $('<div/>');
		this.container.addClass(menuClassName);
		this.container[0].id = menuClassName;
		for (var i=0; i<links.length; i++){
			if (links[i]=='.') {
				var link = $('<div/>');
				link.addClass('separator');
				this.container.append(link);
			
			} else {
				var link = $('<a/>');
				link[0].href = '#';
				link[0].title = links[i];
				link.bind('click', {menu: this}, function(event) {
					event.data.menu.container.hide();
					if (transmission) {
						transmission.releaseTorrentRightClickMenu(event);
					}
				});
				link.append($(document.createTextNode(links[i])));
				this.container.append(link);
			}
		}
		
		this.container.hide();
		$(document.body).append(this.container);
	},
	
	show: function(event){	
		menu = event.data.menu;
		// Constrain to within the boundaries of the torrent box
		var padding_x = 16; 
		var padding_y = 5;
		var bounding_element_right = menu.bounding_element.width();
		var bounding_element_bottom = parseInt($('.torrent_footer')[0].css('top'));		
		var menu_width = this.container.width();
		var menu_height = this.container.height();
		var menu_right = event.pageX + menu_width;
		var menu_bottom = event.pageY + menu_height;
			
		if (menu_right > bounding_element_right) {
			var left_position = bounding_element_right - menu_width - padding_x;
			this.container.css('left', left_position + 'px');
		} else {
			this.container.css('left', event.pageX + 'px');
		}
		
		if (menu_bottom > bounding_element_bottom) {
			var bottom_position = bounding_element_bottom - menu_height - padding_y;
			this.container.css('top', bottom_position + 'px');
		} else {
			this.container.css('top', event.pageY + 'px');
		}
		
		// Added to force transmission to display
		this.container.css('position', 'absolute');
		this.container.css('z-index', 3);
		this.container.show();
	},
	
	hide: function(){
		this.container.hide();
		return true;
	}
};
		
// Create contextual right-click menu for torrents on page load
// common.js is probably a better place for this initialisation but
// it doesn't seem to work
// TODO: Figure out why

var menu;

$(document).ready(function() {
	var links = ['Pause Selected','Resume Selected','Resume Selected Without Wait',
				'.','Remove From List...','Remove Downloaded File...',
				'Remove Torrent File...','Remove All Files...','.','Hide Inspector'];
	menu = new Menu('div#torrent_container', 'torrent_context_menu', links);
});
