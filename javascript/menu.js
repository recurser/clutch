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
		$$(selector).each(function(el){
			el.observe('contextmenu', function(e){
				this.show(e);
				Event.stop(e);
			}.bindAsEventListener(this));
		}.bind(this));
		Event.observe(document, 'click', function(){
			this.hide();
		}.bindAsEventListener(this), false);
		this.container = document.createElement('div');
		Element.addClassName(this.container, menuClassName);
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
					alert(Event.element(e).innerHTML);
					Event.stop(e);
				}.bindAsEventListener(this);
				link.appendChild(document.createTextNode(links[i]));
				this.container.appendChild(link);
			}
		}
		this.container.style.display = 'none';
		document.body.appendChild(this.container);
	},
	
	show: function(e){
		this.container.style.left = Event.pointerX(e)+'px';
		this.container.style.top = Event.pointerY(e)+'px';
		
		// Dave added for transmission to force display
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
				'Remove Torrent File...','Remove All Files...','.','Show Inspector'];
	var menuObj = new Menu('div#torrent_container', 'torrent_context_menu', links);
}, false);