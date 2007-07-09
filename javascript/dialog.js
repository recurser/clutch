/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * Class Dialog
 */
 
var Dialog = Class.create();
Dialog.prototype = {

    /*
     * Constructor
     */
    initialize: function() {
		
		/*
		 * Private Interface Variables
		 */
		var _container;
		var _heading;
		var _message;
		var _cancel_button;
		var _confirm_button;
		var _callback_function;
		this._container = $('dialog_container');
		this._heading = $('dialog_heading');
		this._message = $('dialog_message');
		this._cancel_button = $('dialog_cancel_button');
		this._confirm_button = $('dialog_confirm_button');
		this._callback_function = '';
		
		// Observe the buttons
		Event.observe(this._cancel_button, 'mouseup', this.releaseCancelButton.bindAsEventListener(this));
		Event.observe(this._confirm_button, 'mouseup', this.releaseConfirmButton.bindAsEventListener(this));
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
		Event.stop(event);	
		this._container.hide();	
		this._callback_function = '';	
		
	},

	/*
	 * Process a mouse-up event on the 'confirm' button
	 */
	releaseConfirmButton: function(event) {
		Event.stop(event);	
		this._container.hide();
		eval(this._callback_function);
	},
	
	

    /*--------------------------------------------
     * 
     *  I N T E R F A C E   F U N C T I O N S
     * 
     *--------------------------------------------*/
    
    /*
     * Display a confirm dialog
     */
    confirm: function(dialog_heading, dialog_message, confirm_button_label, callback_function) {
		this._heading.innerHTML = dialog_heading;
		this._message.innerHTML = dialog_message;
		this._cancel_button.innerHTML = 'Cancel';
		this._confirm_button.innerHTML = confirm_button_label;
		this._confirm_button.show();
		this._callback_function = callback_function;
		this._container.show();
	},
    
    /*
     * Display an alert dialog
     */
    alert: function(dialog_heading, dialog_message, cancel_button_label) {
		this._heading.innerHTML = dialog_heading;
		this._message.innerHTML = dialog_message;
		this._confirm_button.hide();
		this._cancel_button.innerHTML = cancel_button_label;
		$('upload_container').hide(); // Just in case
		this._container.show();
	}
	
	
}