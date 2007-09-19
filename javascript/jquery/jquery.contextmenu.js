/*
 * ContextMenu - jQuery plugin for right-click context menus
 *
 * Author: Chris Domigan
 * Contributors: Dan G. Switzer, II
 * Parts of this plugin are inspired by Joern Zaefferer's Tooltip plugin
 *
 * Dual licensed under the MIT and GPL licenses:
 *   http://www.opensource.org/licenses/mit-license.php
 *   http://www.gnu.org/licenses/gpl.html
 *
 * Version: r2
 * Date: 16 July 2007
 *
 * For documentation visit http://www.trendskitchens.co.nz/jquery/contextmenu/
 *
 */

(function($) {

 	var menu, shadow, trigger, content, hash, currentTarget;
  var defaults = {
    menuStyle: {
      listStyle: 'none',
      padding: '1px',
      margin: '0px',
      backgroundColor: '#fff',
      border: '1px solid #999',
      width: '100px'
    },
    itemStyle: {
      margin: '0px',
      color: '#000',
      display: 'block',
      cursor: 'default',
      padding: '3px',
      border: '1px solid #fff',
      backgroundColor: 'transparent'
    },
    itemHoverStyle: {
      border: '1px solid #0a246a',
      backgroundColor: '#b6bdd2'
    },
    itemDisabledStyle: {
      color: '#999',
      backgroundColor: 'transparent'
    },
    eventPosX: 'pageX',
    eventPosY: 'pageY',
    shadow : true,
    onContextMenu: null,
    onShowMenu: null,
    boundingElement: [],
	boundingRightPad: 0,
	boundingBottomPad: 0
 	};

  $.fn.contextMenu = function(id, options) {
    if (!menu) {                                      // Create singleton menu
      menu = $('<div id="jqContextMenu"></div>')
               .hide()
               .css({position:'absolute', zIndex:'500'})
               .appendTo('body')
               .bind('click', function(e) {
                 e.stopPropagation();
               });
    }
    if (!shadow) {
      shadow = $('<div></div>')
                 .css({backgroundColor:'#000',position:'absolute',opacity:0.2,zIndex:499})
                 .appendTo('body')
                 .hide();
    }
    hash = hash || [];
    hash.push({
      id : id,
      menuStyle: $.extend({}, defaults.menuStyle, options.menuStyle || {}),
      itemStyle: $.extend({}, defaults.itemStyle, options.itemStyle || {}),
      boundingElement: options.boundingElement || defaults.boundingElement,
      boundingRightPad: options.boundingRightPad || defaults.boundingRightPad,
      boundingBottomPad: options.boundingBottomPad || defaults.boundingBottomPad,
      itemHoverStyle: $.extend({}, defaults.itemHoverStyle, options.itemHoverStyle || {}),
      itemDisabledStyle: $.extend({}, defaults.itemDisabledStyle, options.itemDisabledStyle || {}),
      bindings: options.bindings || {},
      shadow: options.shadow || options.shadow === false ? options.shadow : defaults.shadow,
      onContextMenu: options.onContextMenu || defaults.onContextMenu,
      onShowMenu: options.onShowMenu || defaults.onShowMenu,
      eventPosX: options.eventPosX || defaults.eventPosX,
      eventPosY: options.eventPosY || defaults.eventPosY
    });

    var index = hash.length - 1;
    $(this).bind('contextmenu', function(e) {
      // Check if onContextMenu() defined
      var bShowContext = (!!hash[index].onContextMenu) ? hash[index].onContextMenu(e) : true;
      if (bShowContext) display(index, this, e, options);
      return false;
    });
    return this;
  };

  function display(index, trigger, e, options) {
	var cur = hash[index];	
    content = $('#'+cur.id).find('ul:first').clone(true);
    content.css(cur.menuStyle).find('li.disabled').css(cur.itemDisabledStyle);
    content.css(cur.menuStyle).find('li:not(.disabled)').css(cur.itemStyle).hover(
      function() {
        $(this).css(cur.itemHoverStyle);
      },
      function(){
        $(this).css(cur.itemStyle);
      }
    ).find('img').css({verticalAlign:'middle',paddingRight:'2px'});

    // Send the content to the menu
    menu.html(content);

    // if there's an onShowMenu, run it now -- must run after content has been added
		// if you try to alter the content variable before the menu.html(), IE6 has issues
		// updating the content
    if (!!cur.onShowMenu) menu = cur.onShowMenu(e, menu);

    $.each(cur.bindings, function(id, func) {
      $('#'+id, menu).bind('click', function(e) {
        hide();
        if (! $(this).is('.disabled')) {
          func(trigger, currentTarget);
        }
      });
    });
	
	// Figure out the X and Y positions of the menu
	var xPos = e[cur.eventPosX];
	var yPos = e[cur.eventPosY];
	
	if (cur.boundingElement.length > 0) {
		var menuElement = $('#' + cur.id);
		var offset = cur.boundingElement.offset();
		var boundingRight = offset.left + cur.boundingElement.outerWidth() - cur.boundingRightPad;
		var boundingBottom = offset.top + cur.boundingElement.outerHeight() - cur.boundingBottomPad;
		
		// Have to show the menu first (offscreen) or the width() function doesn't work properly
    	menu.css({'left':-1000,'top':-1000}).show();
		
		// Make sure the menu lies inside the bounding box
		if (xPos > boundingRight-menu.outerWidth()) {
			xPos = boundingRight-menu.outerWidth();
		}
		if (yPos > boundingBottom-menu.outerHeight()) {
			yPos = boundingBottom-menu.outerHeight();
		}
	}
	
    menu.css({'left':xPos,'top':yPos}).show();
		
    if (cur.shadow) shadow.css({width:menu.width(),height:menu.height(),left:xPos+2,top:yPos+2}).show();
    $(document).one('click', hide);
  }

  function hide() {
    menu.hide();
    shadow.hide();
  }

  // Apply defaults
  $.contextMenu = {
    defaults : function(userDefaults) {
      $.each(userDefaults, function(i, val) {
        if (typeof val == 'object' && defaults[i]) {
          $.extend(defaults[i], val);
        }
        else defaults[i] = val;
      });
    }
  };

})(jQuery);

$(function() {
  $('div.contextMenu').hide();
});