/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the GPL version 2.
 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
 *
 * Class Dialog
 */

function Dialog(){
    this.initialize();
}
 
Dialog.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
		
		/*
		 * Private Interface Variables
		 */
		this._container = $('#dialog_container');
		this._heading = $('#dialog_heading');
		this._message = $('#dialog_message');
		this._cancel_button = $('#dialog_cancel_button');
		this._confirm_button = $('#dialog_confirm_button');
		this._callback_function = '';
		
		// Observe the buttons
		this._cancel_button.bind('click', {dialog: this}, this.releaseCancelButton);
		this._confirm_button.bind('click', {dialog: this}, this.releaseConfirmButton);
	},




    
    /*--------------------------------------------
     * 
     *  E V E N T   F U N C T I O N S
     * 
     *--------------------------------------------*/

	/*
	 * Process a mouse-up event on the 'cancel' button
	 */
	releaseCancelButton: function(event) {
		dialog = event.data.dialog;
		$('body.dialog_showing').removeClass('dialog_showing');
		if (iPhone) {
			dialog._container.hide();	
			scroll_timeout = setTimeout("window.scrollTo(0,1)",20);
		} else if (Safari3) {
			$('div#dialog_container div.dialog_window').css('top', '-150px');
			setTimeout("dialog._container.hide();",500);	
		} else {
			dialog._container.hide();	
		}
		transmission.updateButtonStates();
		dialog._callback_function = '';
	},

	/*
	 * Process a mouse-up event on the 'confirm' button
	 */
	releaseConfirmButton: function(event) {
		dialog = event.data.dialog;
		$('body.dialog_showing').removeClass('dialog_showing');
		if (iPhone) {
			dialog._container.hide();	
			scroll_timeout = setTimeout("window.scrollTo(0,1)",20);
		} else if (Safari3) {
			$('div#dialog_container div.dialog_window').css('top', '-150px');
			setTimeout("dialog._container.hide();",500);	
		} else {
			dialog._container.hide();	
		}
		transmission.updateButtonStates();
		eval(dialog._callback_function);
	},
	
	

    /*--------------------------------------------
     * 
     *  I N T E R F A C E   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Display a confirm dialog
     */
    confirm: function(dialog_heading, dialog_message, confirm_button_label, callback_function, cancel_button_label) {
		if (!iPhone && Safari3) {
			$('div#upload_container div.dialog_window').css('top', '-205px');
			$('div#prefs_container div.dialog_window').css('top', '-425px');
			setTimeout("$('#upload_container').hide();",500);
			setTimeout("$('#prefs_container').hide();",500);
		} else if (!iPhone) {
			$('.dialog_container').hide();
		}
		this._heading[0].innerHTML = dialog_heading;
		this._message[0].innerHTML = dialog_message;
		this._cancel_button[0].innerHTML = (cancel_button_label == null) ? 'Cancel' : cancel_button_label;
		this._confirm_button[0].innerHTML = confirm_button_label;
		this._confirm_button.show();
		this._callback_function = callback_function;
		$('body').addClass('dialog_showing');
		this._container.show();
		transmission.updateButtonStates();
		if (iPhone) {
			scroll_timeout = setTimeout("window.scrollTo(0,1)",20);
		} else if (Safari3) {
			setTimeout("$('div#dialog_container div.dialog_window').css('top', '0px');",10);
		}
	},
    
    /*
     * Display an alert dialog
     */
    alert: function(dialog_heading, dialog_message, cancel_button_label) {
		if (!iPhone && Safari3) {
			$('div#upload_container div.dialog_window').css('top', '-205px');
			$('div#prefs_container div.dialog_window').css('top', '-425px');
			setTimeout("$('#upload_container').hide();",500);
			setTimeout("$('#prefs_container').hide();",500);
		} else if (!iPhone) {
			$('.dialog_container').hide();
		}
		this._heading[0].innerHTML = dialog_heading;
		this._message[0].innerHTML = dialog_message;
		// jquery::hide() doesn't work here in Safari for some odd reason
		this._confirm_button.css('display', 'none');
		this._cancel_button[0].innerHTML = cancel_button_label;
		// Just in case
		if (!iPhone && Safari3) {
			$('div#upload_container div.dialog_window').css('top', '-205px');
			setTimeout("$('#upload_container').hide();",500);
		} else {
			$('#upload_container').hide();
		}
		$('body').addClass('dialog_showing');
		transmission.updateButtonStates();
		if (iPhone) {
			scroll_timeout = setTimeout("window.scrollTo(0,1)",20);
			this._container.show();
		} else if (Safari3) {
			// long pause as we just hid all the dialogs on a timeout - we'll get the error
			// scrolling in and immediately disappearing if we're not careful!
			//dialogTimeout = null;
			this._container.show();
			setTimeout("$('div#dialog_container div.dialog_window').css('top', '0px');",500);
		} else {
			this._container.show();
		}
	}
	

}
