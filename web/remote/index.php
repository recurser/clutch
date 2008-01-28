<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */
	
	require_once('inc/trans_main.php');

	$SocketPath = trim(file_get_contents('data/socket.txt'));
	$IsUpload = false;
	$Is3rdParty = false;
	
	// Initialise the filter type
	if (!isset($_SESSION['filterType'])) 
		$_SESSION['filterType'] = FilterAll;
			
	if ((isset($_GET['action']) && 
		isset($_GET['param']) && 
		isset($_GET['filter']) && 
		isset($_GET['sort_method']) && 
		isset($_GET['sort_direction'])) ||
		
		// Uploads by external apps
		(isset($_GET['action']) && 
		isset($_GET['torrent_url']) && 
		$_GET['action'] == '3rdPartyUpload')) 
	{
		// Display an error if we can't find the socket
		if (! file_exists($SocketPath)) 
		{	
			$Result = array(
				'dialog.alert' => "'Daemon Error', 'The Transmission daemon does not appear to be running.', 'Dismiss'",
				'transmission.togglePeriodicRefresh' => "false"
			);
			
		} 
		else 
		{
			$Preferences = new Preferences('data/prefs.txt', $CONST['default_preferences']);
			$TControl = new TransmissionController($SocketPath);
			$MControl = new MessageController($TControl);
			$Instance = new Clutch($MControl, $Preferences);
			
			$Result = array('transmission.ignore' => '');
		
			// Initialise the sort string if it's null
			if (! isset($_GET['search'])) 
				$_GET['search'] = '';
		
			$InfoFields = array(
					"id", "hash", "name", "path", "saved", "private", 
					"trackers", "comment", "creator", "date", "size");
			$StatusFields = array(
					"completed", "download-speed", "download-total", "error", 
					"error-message", "eta", "id", "peers-downloading", 
					"peers-from", "peers-total", "peers-uploading", "running", 
					"state", "swarm-speed", "tracker", "scrape-completed", 
					"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");

			switch($_GET['action']) 
			{
				case '3rdPartyUpload' :
					$Response = $Instance->AddTorrentByURL($_GET['torrent_url'], null);
					$IsUpload = true;
					$Is3rdParty = true;
					$Result = (isset($Response[0]) && strtolower($Response[0]) == 'succeeded') ? 'ok' : 'failed';
					break;
					
				case 'addTorrentByURL' :
					$Response = $Instance->AddTorrentByURL($_POST['torrent_url'], null);
					if (isset($Response[0]) && strtolower($Response[0]) == 'succeeded')
					{
						$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
						$Result = array(
								'transmission.refreshAndSortTorrents' => $ArgList,
								'transmission.togglePeriodicRefresh' => "true"
							);
					} 
					else 
					{
						$Error = addslashes($Instance->GetError());
						if (!$Error || $Error == '')
							$Error = 'An unexpected error occured. The torrent you uploaded may already be running.';
						
						$Result = array(
								'dialog.alert' => "'Upload Error', '${Error}', 'Dismiss'",
								'transmission.togglePeriodicRefresh' => "true"
							);
					}
					break;

				case 'requestSettings' :
					$ArgList = $Instance->GetInitialSettings();
					$Result = array('transmission.initializeSettings' => $ArgList);
					break;
				
				case 'savePrefs' :
					if ($Instance->savePrefs()) 
					{
						$ArgList = $Instance->GetInitialSettings();
						$Result = array('transmission.updatePrefs' => $ArgList);
					}
					else
					{
						$Result = array('transmission.preferenceError' => "'".addslashes($Instance->GetError())."'");
					}
					break;
				
				case 'displayPrefs' :
					$ArgList = $Instance->GetInitialSettings();
					$Result = array('transmission.displayPrefs' => $ArgList);
					break;
				
				case 'refreshTorrents' :
					$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
					$Result = array('transmission.refreshTorrents' => $ArgList);
					break;
	
				case 'pauseTorrents' :
					$Instance->pauseTorrents($_GET['param']);
					$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
					$Result = array('transmission.refreshTorrents' => $ArgList);
					break;
	
				case 'resumeTorrents' :
					$Instance->resumeTorrents($_GET['param']);
					$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
					$Result = array('transmission.refreshTorrents' => $ArgList);
					break;
	
				case 'removeTorrents' :
					$ArgList = $Instance->removeTorrents($_GET['param']);
					$Result = array('transmission.removeTorrents' => $ArgList);
					break;
	
				case 'filterTorrents' :
					$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
					$Result = array('transmission.refreshTorrents' => $ArgList);
					break;
	
				case 'sortTorrents' :
					$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
					$Result = array('transmission.refreshAndSortTorrents' => $ArgList);
					break;
	
				case 'uploadTorrent' :
					$IsUpload = true;
					$Response = $Instance->AddTorrentByUpload('torrent_file', null);
					if (isset($Response[0]) && strtolower($Response[0]) == 'succeeded') 
					{
						$ArgList = $Instance->filterTorrents($InfoFields, 
									$StatusFields, 
									$_GET['filter'], 
									$_GET['sort_method'], 
									$_GET['sort_direction'], 
									$_GET['search']);
						$Result = array(
								'transmission.refreshAndSortTorrents' => $ArgList,
								'transmission.togglePeriodicRefresh' => "true"
							);
					} 
					else 
					{
						$Error = addslashes($Instance->GetError());
						if (!$Error || $Error == '')
							$Error = 'An unexpected error occured. The torrent you uploaded may already be running.';
						
						$Result = array(
								'dialog.alert' => "'Upload Error', '${Error}', 'Dismiss'",
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
					$PreferenceList = json_decode(stripslashes($_GET['param']));
					foreach ($PreferenceList as $key=>$value)
						$Preferences->SetPreference($key, $value);
					
					break;
			}
		}
				
		// Encode and output the response
		if (!$IsUpload) 
		{
			// Set the mime type (forces jquery to auto-eval())
			header('Content-type: text/javascript');
			foreach ($Result as $Command => $Arguments)
				echo $Command . "(" . $Arguments . ");";			
		} 
		// Just echo a straight result if this is a 3rd-party request
		else if ($Is3rdParty) 
		{
			echo $Result;
		}
		// Safari uploads require the onLoad code to be inside the returned page - not 
		// bound to the frame itself by the parent.
		else
		{
			include('upload_response.php');
		}	
	}
?>