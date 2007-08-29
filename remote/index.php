<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */
	
	require_once('inc/trans_main.php');
	$TControl = new TransmissionController(file_get_contents('data/socket.txt'));
	$MControl = new MessageController($TControl);
	$Instance = new Clutch($MControl);

	$Preferences = new Preferences('data/prefs.txt');
	
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
				
			case 'refreshTorrents' :
				$function = 'refreshTorrents';
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction']);
				break;
	
			case 'pauseTorrents' :
				$function = 'refreshTorrents';
				$Instance->pauseTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction']);
				break;
	
			case 'resumeTorrents' :
				$function = 'refreshTorrents';
				$Instance->resumeTorrents($_GET['param']);
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction']);
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
								$_GET['sort_direction']);
				break;
	
			case 'sortTorrents' :
				$function = 'refreshAndSortTorrents';
				$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction']);
				break;
	
			case 'uploadTorrent' :
				$response = $Instance->AddTorrentByUpload('torrent_file', null, true);
				if (isset($response[1][0]['id'])) {
					$function = 'refreshAndSortTorrents';
					$arg_list = $Instance->filterTorrents($info_fields, 
								$status_fields, 
								$_GET['filter'], 
								$_GET['sort_method'], 
								$_GET['sort_direction']);
				} else {
					$controller = 'dialog';
					$function = 'alert';
					$arg_list = "'Upload Error', 'An unexpected error occured', 'Dismiss'";
				}
				break;	
	
			case 'setDownloadRate' :
				$function = 'ignore';
				$Instance->setDownloadRate($_GET['param']);
				$arg_list = '';
				break;		
	
			case 'setUploadRate' :
				$function = 'ignore';
				$Instance->setUploadRate($_GET['param']);
				$arg_list = '';
				break;	
	
			case 'setSeedingRatio' :
				$function = 'ignore';
				$arg_list = '';
				break;	
		}
	
		// Set the mime type (causes prototype to auto-eval())
		header('Content-type: text/javascript');
				
		// Encode and output the response
		echo $controller . '.' . $function . '(' . $arg_list . ');';
	
	}
?>