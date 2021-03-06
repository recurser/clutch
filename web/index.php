<?php $iPhone = (ereg("(iPhone|iPod)",$_SERVER['HTTP_USER_AGENT']))?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
	<head>
		<title>Clutch</title>
		<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
		<meta http-equiv="cache-control" content="Private" />
		<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1.0; user-scalable=0;"/>
		<link rel="apple-touch-icon" href="./images/webclip-icon.png"/>
		<link href="./images/favicon.ico" rel="SHORTCUT ICON" />
		<script type="text/javascript" src="./javascript/jquery/jquery.js"></script>
<?php if ($iPhone) { ?>
		<link media="screen" href="./stylesheets/iphone.css" type="text/css" rel="stylesheet" />
<?php } else { ?>
		<link media="screen" rel="stylesheet" type="text/css" href="./stylesheets/common.css" />
		<script type="text/javascript" src="./javascript/jquery/jquery.transmenu.js"></script>
		<script type="text/javascript" src="./javascript/jquery/jquery.contextmenu.js"></script>
		<script type="text/javascript" src="./javascript/menu.js"></script>
		<script type="text/javascript" src="./javascript/jquery/jquery.dimensions.pack.js"></script>
<?php } ?>
		<script type="text/javascript" src="./javascript/jquery/jquery.form.js"></script>
		<script type="text/javascript" src="./javascript/jquery/json.js"></script>
		<script type="text/javascript" src="./javascript/hash.js"></script>
		<script type="text/javascript" src="./javascript/transmission.remote.js"></script>
		<script type="text/javascript" src="./javascript/transmission.js"></script>
		<script type="text/javascript" src="./javascript/torrent.js"></script>
		<script type="text/javascript" src="./javascript/dialog.js"></script>
		<script type="text/javascript" src="./javascript/common.js"></script>
	</head>
	<body id="transmission_body"<?php if ($iPhone) { ?> onorientationchange="updateLayout();" onload="updateLayout();"<?php } ?>>

		<div class="torrent_global_menu">
			 <ul>    
				 <li id="open"><div id="open_link"><div class="toolbar_image"></div>Open</div></li>
				 <li id="remove" class="disabled"><div id="remove_link"><div class="toolbar_image"></div>Remove</div></li>
				 <li class="divider">&nbsp;</li>
				 <li id="pause_selected" class="disabled"><div id="pause_selected_link"><div class="toolbar_image"></div>Pause</div></li>
				 <li id="resume_selected" class="disabled"><div id="resume_selected_link"><div class="toolbar_image"></div>Resume</div></li>
				 <li class="divider">&nbsp;</li>
				 <li id="pause_all" class="disabled"><div id="pause_all_link"><div class="toolbar_image"></div>Pause All</div></li>
				 <li id="resume_all" class="disabled"><div id="resume_all_link"><div class="toolbar_image"></div>Resume All</div></li>
				 <li id="inspector"><div id="inspector_link"><div class="toolbar_image"></div>Inspector</div></li>
				 <li id="filter"><div id="filter_toggle_link"><div class="toolbar_image"></div>Filter</div></li>
			 </ul>
		</div>
		
		<div class="torrent_global_details">
			<div id="torrent_global_transfer">0 Transfers</div>
			<div id="torrent_global_upload">0 B/s</div>
			<div id="torrent_global_download">0 B/s</div>
		</div>
		
		<div id="torrent_filter_bar">
			<ul>    
				 <li><a href='#all' id='filter_all_link' class='active'>All</a></li>
				 <li><a href='#downloading' id='filter_downloading_link'>Downloading</a></li>
				 <li><a href='#seeding' id='filter_seeding_link'>Seeding</a></li>
				 <li><a href='#paused' id='filter_paused_link'>Paused</a></li>
			</ul>
			<input type='text' id='torrent_search' class='blur' />		
		</div>
		<div id="torrent_inspector" style="display:none;">
			
			<ul class="torrent_inspector_tabs">
				<li><a href="#info" id="inspector_tab_info" class="inspector_tab selected"><img src="images/buttons/info_general.png" alt="Information"/></a></li>
				<li><a href="#activity" id="inspector_tab_activity" class="inspector_tab"><img src="images/buttons/info_activity.png" alt="Activity"/></a></li>
			</ul>
			
			<div class="torrent_inspector_header">
				<h1 id="torrent_inspector_name">No Torrent Selected</h1>
				<span id="torrent_inspector_size">0 B</span>
			</div>
			
			<div class="torrent_inspector_section" id="inspector_tab_info_container">
				<h2>Torrent Information</h2>
				<label>Tracker:</label>
				<div id="torrent_inspector_tracker">N/A</div>
				<label>Hash:</label>
				<div id="torrent_inspector_hash">N/A</div>
				<label>Secure:</label>
				<div id="torrent_inspector_secure">N/A</div>
				<label>Comment:</label>
				<div id="torrent_inspector_comment">N/A</div>
				
				<h2>Created By</h2>
				<label>Creator:</label>
				<div id="torrent_inspector_creator">N/A</div>
				<label>Date:</label>
				<div id="torrent_inspector_creator_date">N/A</div>
			</div>
			
			<div class="torrent_inspector_section" style="display:none;" id="inspector_tab_activity_container">
				<h2>Activity</h2>
				<label>State:</label>
				<div id="torrent_inspector_state">N/A</div>
				<label>Progress:</label>
				<div id="torrent_inspector_progress">N/A</div>
				<label>Have:</label>
				<div id="torrent_inspector_have">N/A</div>
				<label>Downloaded:</label>
				<div id="torrent_inspector_downloaded">N/A</div>
				<label>Uploaded:</label>
				<div id="torrent_inspector_uploaded">N/A</div>
				<label>Ratio:</label>
				<div id="torrent_inspector_ratio">N/A</div>
				<label>Swarm Rate:</label>
				<div id="torrent_inspector_swarm_speed">N/A</div>
				<label>Error:</label>
				<div id="torrent_inspector_error">N/A</div>
				<label>DL Speed:</label>
				<div id="torrent_inspector_download_speed">N/A</div>
				<label>UL Speed:</label>
				<div id="torrent_inspector_upload_speed">N/A</div>
				
				<h2>Peers</h2>
				<label>UL To:</label>
				<div id="torrent_inspector_upload_to">N/A</div>
				<label>DL From:</label>
				<div id="torrent_inspector_download_from">N/A</div>
				<label>Total Seeders:</label>
				<div id="torrent_inspector_total_seeders">N/A</div>
				<label>Total Leechers:</label>
				<div id="torrent_inspector_total_leechers">N/A</div>
			</div>
		</div>
		
		<div id="torrent_container">
			<ul class="torrent_list" id="torrent_list"></ul>
	</div>
		
		
		
		<div class='dialog_container' id="dialog_container" style="display:none;">
			<div class="dialog_top_bar"></div>
			<div class="dialog_window">
				<img src='images/graphics/logo.png' alt="Transmission Logo" />
				<h2 class="dialog_heading" id="dialog_heading"></h2>
				<div class="dialog_message" id="dialog_message"></div>
				<a href="#confirm" id="dialog_confirm_button">Confirm</a>
				<a href="#cancel" id="dialog_cancel_button">Cancel</a>			
        	</div>
		</div>
		
		<div class='dialog_container' id="prefs_container" style="display:none;">
			<div class="dialog_top_bar"></div>
			<div class="dialog_window">
				<h2 class="dialog_heading">Preferences</h2>
				<div id="pref_error"></div>
				<form id="prefs_form" action="remote/index.php?action=savePrefs">
					<div class="preference download_location">
						<label class='category'>Add transfers:</label>
						<label class='item'>Download to:</label>
						<input type='text' name='download_location' id='download_location'/>
					</div>
					<div class="preference port">
						<label class='category'>Network:</label>
						<label class='item'>Incoming TCP Port:</label>
						<input type='text' name='port'/>
					</div>
					<div class="preference auto_start">
						<label class='category'>Transfers:</label>
						<input type='checkbox' name='auto_start' id='auto_start'/>
						<label class='item'>Start transfers when added</label>
					</div>
					<div class="preference encryption">
						<label class='category'>Encryption:</label>
						<input type='checkbox' name='encryption' id='encryption'/>
						<label class='item'>Ignore unencrypted peers</label>
					</div>
					<div class="preference limit_total">
						<label class='category'>Limit total bandwidth:</label>
						<input type='checkbox' name='limit_download' id='limit_download'/>
						<label class='item'>Download Rate:</label>
						<input type='text' name='download_rate' id='download_rate'/>
						<label class='suffix'>KB/s</label>
						<input type='checkbox' name='limit_upload' id='limit_upload'/>
						<label class='item'>Upload Rate:</label>
						<input type='text' name='upload_rate' id='upload_rate'/>
						<label class='suffix'>KB/s</label>
					</div>
					<div class="preference web_gui">
						<label class='category'>Web Client:</label>
						<label class='item'>Refresh Rate:</label>
						<input type='text' name='refresh_rate' id='refresh_rate'/>
						<label class='suffix'>seconds</label>
					</div>
					<a href="#save" id="prefs_save_button">Save</a>
					<a href="#cancel" id="prefs_cancel_button">Cancel</a>
				</form>
			</div>
		</div>
		
		<div class='dialog_container' id="upload_container" style="display:none;">
			<div class="dialog_top_bar"></div>
			<div class="dialog_window">
				<img src='images/graphics/logo.png' alt="Transmission Logo" />
				<h2 class="dialog_heading">Torrent Upload</h2>
				<form action='#' method='post' id='torrent_upload_form' 
					enctype='multipart/form-data' target='torrent_upload_frame'>  
					<div class="dialog_message">
						Please select a .torrent file to upload:
							<input type='file' name='torrent_file' id='torrent_upload_file'/>
						<label>Alternatively, you may specify a URL:</label>
							<input type='text' name='torrent_url' id='torrent_upload_url' />
					</div>
					<a href="#upload" id="upload_confirm_button">Upload</a>
					<a href="#cancel" id="upload_cancel_button">Cancel</a>
				</form>
			</div>
		</div>
		<div class="torrent_footer">	
			<div id="disk_space_container"></div>	
<?php if ($iPhone) { ?>
			<a id="preferences_link">Clutch Preferences...</a>	
<?php } else { ?>
			<ul id="settings_menu">
				<li id='button'>&nbsp;
					<ul id='footer_super_menu'>
						<li id='preferences'>Preferences</li>
						<li class='separator'></li>
						<li>Total Download Rate
							<ul id='footer_download_rate_menu'>
								<li id='unlimited_download_rate'>Unlimited</li>
								<li id='limited_download_rate'>Limit (10 KB/s)</li>
								<li class='separator'></li>
								<li>5 KB/s</li>
								<li>10 KB/s</li>
								<li>20 KB/s</li>
								<li>30 KB/s</li>
								<li>40 KB/s</li>
								<li>50 KB/s</li>
								<li>75 KB/s</li>
								<li>100 KB/s</li>
								<li>150 KB/s</li>
								<li>200 KB/s</li>
							</ul>
						</li>
						<li>Total Upload Rate
							<ul id='footer_upload_rate_menu'>
								<li id='unlimited_upload_rate'>Unlimited</li>
								<li id='limited_upload_rate'>Limit (10 KB/s)</li>
								<li class='separator'></li>
								<li>5 KB/s</li>
								<li>10 KB/s</li>
								<li>20 KB/s</li>
								<li>30 KB/s</li>
								<li>40 KB/s</li>
								<li>50 KB/s</li>
								<li>75 KB/s</li>
								<li>100 KB/s</li>
								<li>150 KB/s</li>
								<li>200 KB/s</li>
							</ul>
						</li>
						<li class='separator'></li>
						<li>Sort Transfers By
							<ul id='footer_sort_menu'>
								<li id='sort_by_queue_order'>Queue Order</li>
								<li id='sort_by_date'>Date Added</li>
								<li id='sort_by_name'>Name</li>
								<li id='sort_by_percent_completed'>Progress</li>
								<li id='sort_by_state'>State</li>
								<li id='sort_by_tracker'>Tracker</li>
								<li class='separator'></li>
								<li id='reverse_sort_order'>Reverse Sort Order</li>
							</ul>
						</li>
					</ul>
				</li>
			</ul>
<?php } ?>
		</div>

<?php if (!$iPhone) { ?>
		<div id='unsupported_browser' style="display:none;">
			<div class="dialog_window">
				<img class='logo' src='images/graphics/logo.png' alt="Transmission Logo" />
				<h2>Sorry, your browser is not supported.</h2>
				<p>We currently support the following browsers:</p>
				<a href="http://www.mozilla.com/en-US/firefox/" title="Firefox"><img src="images/graphics/browser_firefox.gif" alt="Firefox" /></a>
				<a href="http://www.apple.com/safari/" title="Safari"><img src="images/graphics/browser_safari.gif" alt="Safari" /></a>
				<a href="http://www.opera.com/download/" title="Opera"><img src="images/graphics/browser_opera.gif" alt="Opera" /></a>
			</div>
		</div>
<?php } ?>
		
<div class="contextMenu" id="torrent_context_menu">
			<ul>
				<li id="context_pause_selected" class="disabled context_pause_selected">Pause Selected</li>
				<li id="context_resume_selected" class="disabled context_resume_selected">Resume Selected</li>
				<li id="context_remove">Remove From List...</li>
				<li id="context_toggle_inspector">Show Inspector</li>
			</ul>
		</div>
		
		<iframe name="torrent_upload_frame" id="torrent_upload_frame" src="about:blank" />
</body>
</html>