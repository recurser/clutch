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
		dialog._container.hide();	
		dialog._callback_function = '';	
		
	},

	/*
	 * Process a mouse-up event on the 'confirm' button
	 */
	releaseConfirmButton: function(event) {
		dialog = event.data.dialog;
		dialog._container.hide();
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
    confirm: function(dialog_heading, dialog_message, confirm_button_label, callback_function) {
		$('.dialog_container').hide();
		this._heading[0].innerHTML = dialog_heading;
		this._message[0].innerHTML = dialog_message;
		this._cancel_button[0].innerHTML = 'Cancel';
		this._confirm_button[0].innerHTML = confirm_button_label;
		this._confirm_button.show();
		this._callback_function = callback_function;
		this._container.show();
	},
    
    /*
     * Display an alert dialog
     */
    alert: function(dialog_heading, dialog_message, cancel_button_label) {
		$('.dialog_container').hide();
		this._heading[0].innerHTML = dialog_heading;
		this._message[0].innerHTML = dialog_message;
		this._confirm_button.hide();
		this._cancel_button[0].innerHTML = cancel_button_label;
		$('upload_container').hide(); // Just in case
		this._container.show();
	}
	
	
}