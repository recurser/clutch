<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */
	
	require_once('inc/trans_main.php');

	$Preferences = new Preferences('data/prefs.txt', $CONST['default_preferences']);
	$TControl = new TransmissionController(file_get_contents('data/socket.txt'));
	$MControl = new MessageController($TControl);
	$Instance = new Clutch($MControl, $Preferences);
	
	// Initialise the filter type
	//session_start();
	if (!isset($_SESSION['filterType'])) {
		$_SESSION['filterType'] = FilterAll;
	}
			
	if (isset($_GET['action']) && 
		isset($_GET['param']) && 
		isset($_GET['filter']) && 
		isset($_GET['sort_method']) && 
		isset($_GET['sort_direction'])) {
			
		$controller = 'transmission';
		$function = '';
		$arg_list = '';	
		$is_upload = false;
		
		// Initialise the sort string if it's null
		if (! isset($_GET['search'])) {
			$_GET['search'] = '';
		}
		
		$info_fields = array(
				"id", "hash", "name", "path", "saved", "private", 
				"trackers", "comment", "creator", "date", "size");
		$status_fields = array(
				"completed", "download-speed", "download-total", "error", 
				"error-message", "eta", "id", "peers-downloading", 
				"peers-from", "peers-total", "peers-uploading", "running", 
				"state", "swarm-speed", "tracker", "scrape-completed", 
				"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");

		switch($_GET['action']) 
		{	
			case 'requestSettings' :
				$function = 'initializeSettings';
				$arg_list = $Instance->getInitialSettings();
				break;
				
			case 'savePrefs' :
				$Instance->savePrefs();
				$function = 'updatePrefs';
				$arg_list = $Instance->getInitialSettings();
				break;
				
			case 'resetPrefs' :
				$function = 'updatePrefs';
				$arg_list = $Instance->getInitialSettings();
				break;
				
			case 'setOverRide' :
				$Instance->setOverRide($_GET['param']);
				$function = 'ignore';
				$arg_list = '';
				break;
				
			case 'refreshTorrents' :
				$function = 'refreshTorrents';
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				break;
	
			case 'pauseTorrents' :
				$function = 'refreshTorrents';
				$Instance->pauseTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				break;
	
			case 'resumeTorrents' :
				$function = 'refreshTorrents';
				$Instance->resumeTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				break;
	
			case 'removeTorrents' :
				$function = 'removeTorrents';
				$arg_list = $Instance->removeTorrents($_GET['param']);
				break;
	
			case 'filterTorrents' :
				$function = 'refreshTorrents';
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				break;
	
			case 'sortTorrents' :
				$function = 'refreshAndSortTorrents';
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				break;
	
			case 'uploadTorrent' :
				$is_upload = true;
				$response = $Instance->AddTorrentByUpload('torrent_file', null);
				if (isset($response[1][0]['id'])) {
					$function = 'refreshAndSortTorrents';
					$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				} else {
					$controller = 'dialog';
					$function = 'alert';
					$arg_list = "'Upload Error', 'An unexpected error occured', 'Dismiss'";
				}
				break;	
	
			case 'setDownloadRate' :
				$function = 'ignore';
				$arg_list = '';
				$Instance->setDownloadRate($_GET['param']);
				break;		
	
			case 'setUploadRate' :
				$function = 'ignore';
				$arg_list = '';
				$Instance->setUploadRate($_GET['param']);
				break;
				
			case 'setPreferences' :
				$function = 'ignore';
				$arg_list = '';
				$preferenceList = json_decode(stripslashes($_GET['param']));
				foreach ($preferenceList as $key=>$value) {
					$Preferences->SetPreference($key, $value);
				}
				break;
		}
				
		// Encode and output the response
		if (!$is_upload) {
			// Set the mime type (forces jquery to auto-eval())
			header('Content-type: text/javascript');
			echo $controller . '.' . $function . '(' . $arg_list . ');';
			
		// Safari uploads require the onLoad code to be inside the returned page - not 
		// bound to the frame itself by the parent.
		} else {
			include('upload_response.php');
		}	
	}
?>