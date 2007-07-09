<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */
	
	require_once('inc/trans_main.php');
	$TControl = new TransmissionController(file_get_contents('data/socket.txt'));
	$MControl = new MessageController($TControl);
	$Instance = new BigBlueHouse($MControl);

	$Preferences = new Preferences('data/prefs.txt');

	if (isset($_GET['action']) && isset($_GET['param'])) 
	{
		$controller = 'transmission';
		$function = '';
		$arg_list = '';
		
		switch($_GET['action']) 
		{
			case 'getTorrentList' :
				$function = 'addTorrents';			
				$info_fields = array(
						"id", "hash", "name", "path", "saved", "private", 
						"trackers", "comment", "creator", "date", "size");
				$status_fields = array(
						"completed", "download-speed", "download-total", "error", 
						"error-message", "eta", "id", "peers-downloading", 
						"peers-from", "peers-total", "peers-uploading", "running", 
						"state", "swarm-speed", "tracker", "scrape-completed", 
						"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");
				$arg_list = $Instance->getTorrentData($info_fields, $status_fields);
				break;
	
			case 'reloadTorrents' :
				$function = 'refreshTorrents';
				$status_fields = array(
						'id', 'completed', 'download-total', 'upload-total', 
						'download-speed', 'upload-speed', 'peers-downloading', 
						'peers-from', 'peers-total', 'peers-uploading', 'error', 
						'error-message', 'eta', 'running', 'state', 'swarm-speed',
						'scrape-leechers', 'scrape-seeders');
				$arg_list = $Instance->getTorrentData($info_fields, $status_fields, json_decode($_GET['param']));
				break;
	
			case 'pauseTorrents' :
				$function = 'refreshTorrents';
				$status_fields = array(
						'id', 'completed', 'download-total', 'upload-total', 
						'download-speed', 'upload-speed', 'peers-downloading', 
						'peers-from', 'peers-total', 'peers-uploading', 'error', 
						'error-message', 'eta', 'running', 'state', 'swarm-speed',
						'scrape-leechers', 'scrape-seeders');
				$arg_list = $Instance->pauseTorrents($info_fields, $status_fields, $_GET['param']);
				break;
	
			case 'resumeTorrents' :
				$function = 'refreshTorrents';
				$status_fields = array(
						'id', 'completed', 'download-total', 'upload-total', 
						'download-speed', 'upload-speed', 'peers-downloading', 
						'peers-from', 'peers-total', 'peers-uploading', 'error', 
						'error-message', 'eta', 'running', 'state', 'swarm-speed',
						'scrape-leechers', 'scrape-seeders');
				$arg_list = $Instance->resumeTorrents($info_fields, $status_fields, $_GET['param']);
				break;
	
			case 'removeTorrents' :
				$function = 'removeTorrents';
				$arg_list = $Instance->removeTorrents($_GET['param']);
				break;
	
			case 'filterTorrents' :
				$function = 'addTorrents';		
				$info_fields = array(
						"id", "hash", "name", "path", "saved", "private", 
						"trackers", "comment", "creator", "date", "size");
				$status_fields = array(
						"completed", "download-speed", "download-total", "error", 
						"error-message", "eta", "id", "peers-downloading", 
						"peers-from", "peers-total", "peers-uploading", "running", 
						"state", "swarm-speed", "tracker", "scrape-completed", 
						"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");
				$arg_list = $Instance->filterTorrents($info_fields, $status_fields, $_GET['param']);
				break;
	
			case 'uploadTorrent' :
				$response = $Instance->AddTorrentByUpload('torrent_file', null, true);
				if (isset($response[1][0]['id'])) {
					$torrent_id = intval($response[1][0]['id']);	
					$info_fields = array(
							"id", "hash", "name", "path", "saved", "private", 
							"trackers", "comment", "creator", "date", "size");
					$status_fields = array(
							"completed", "download-speed", "download-total", "error", 
							"error-message", "eta", "id", "peers-downloading", 
							"peers-from", "peers-total", "peers-uploading", "running", 
							"state", "swarm-speed", "tracker", "scrape-completed", 
							"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");
					$arg_list = $Instance->getTorrentData($info_fields, $status_fields, array($torrent_id)) . ', false';
					$function = 'addTorrents';
				} else {
					$controller = 'dialog';
					$function = 'alert';
					$arg_list = "'Upload Error', 'An unexpected error occured', 'Dismiss'";
				}
				break;		
		}
	
		// Set the mime type (causes prototype to auto-eval())
		header('Content-type: text/javascript');
	
		// Encode and output the response
		echo $controller . '.' . $function . '(' . $arg_list . ');';
	
	}
?>