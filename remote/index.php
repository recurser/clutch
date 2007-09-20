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
			
		$actions = array('transmission.ignore' => '');
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
				$arg_list = $Instance->getInitialSettings();
				$actions = array('transmission.initializeSettings' => $arg_list);
				break;
				
			case 'savePrefs' :
				$Instance->savePrefs();
				$arg_list = $Instance->getInitialSettings();
				$actions = array('transmission.updatePrefs' => $arg_list);
				break;
				
			case 'resetPrefs' :
				$arg_list = $Instance->getInitialSettings();
				$actions = array('transmission.updatePrefs' => $arg_list);
				break;
				
			case 'setOverRide' :
				$Instance->setOverRide($_GET['param']);
				break;
				
			case 'refreshTorrents' :
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				$actions = array('transmission.refreshTorrents' => $arg_list);
				break;
	
			case 'pauseTorrents' :
				$Instance->pauseTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				$actions = array('transmission.refreshTorrents' => $arg_list);
				break;
	
			case 'resumeTorrents' :
				$Instance->resumeTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				$actions = array('transmission.refreshTorrents' => $arg_list);
				break;
	
			case 'removeTorrents' :
				$arg_list = $Instance->removeTorrents($_GET['param']);
				$actions = array('transmission.removeTorrents' => $arg_list);
				break;
	
			case 'filterTorrents' :
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				$actions = array('transmission.refreshTorrents' => $arg_list);
				break;
	
			case 'sortTorrents' :
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
				$actions = array('transmission.refreshAndSortTorrents' => $arg_list);
				break;
	
			case 'uploadTorrent' :
				$is_upload = true;
				$response = $Instance->AddTorrentByUpload('torrent_file', null);
				if (isset($response[1][0]['id'])) {
					$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction'], 
								$_GET['search']);
					$actions = array(
							'transmission.refreshAndSortTorrents' => $arg_list,
							'transmission.togglePeriodicRefresh' => "true"
						);
				} else {
					$error = addslashes($Instance->GetError());
					if (!$error || $error == '') {
						$error = 'An unexpected error occured. The torrent you uploaded may already be running.';
					}
					$actions = array(
							'dialog.alert' => "'Upload Error', '${error}', 'Dismiss'",
							'transmission.togglePeriodicRefresh' => "true"
						);
				}
				break;	
	
			case 'setDownloadRate' :
				$Instance->setDownloadRate($_GET['param']);
				break;		
	
			case 'setUploadRate' :
				$Instance->setUploadRate($_GET['param']);
				break;
				
			case 'setPreferences' :
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
			foreach ($actions as $command => $arguments) {
				echo $command . "(" . $arguments . ");";
			}
			
		// Safari uploads require the onLoad code to be inside the returned page - not 
		// bound to the frame itself by the parent.
		} else {
			include('upload_response.php');
		}	
	}
?>