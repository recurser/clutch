<?php

	/*
	 *	Copyright © Malcolm Jarvis, Dave Perrett and Kendall Hopkins
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */

	require_once('BEncodeSerializer.class.php');
	require_once('BEncodeUnserializer.class.php');
	require_once('IPCProtocol.class.php');
	require_once('MessageController.class.php');
	require_once('TransmissionController.class.php');
	require_once('Preferences.class.php');

	class Clutch
	{
		public $Torrents;
		public $M;
		private $LastError;
		private $Preferences;

		public function __construct($MessageController = null, $Preferences)
		{
			if ($MessageController instanceof MessageController)
				$this->M = $MessageController;
			else
				$M = new MessageController(new TransmissionController);
				
			$this->Preferences = $Preferences;
		}

		private function Error($ErrorString)
		{
			$this->LastError = $ErrorString;
			return false;
		}

		public function GetError()
		{
			return $this->LastError;
		}

		/* public GetInitialSettings()
		 * Get the initial settings for the web client (up/down speed etc)
		 *
		 * @return array $result
		 */
		public function GetInitialSettings() {
			$result = array();			
			
			$auto_start                  = $this->M->GetAutoStart();
			$result['auto_start']        = $auto_start[1];			
			$download_location           = $this->M->GetDefaultDirectory();
			$result['download_location'] = $download_location[1];			
			$port                        = $this->M->GetPort();
			$result['port']              = $port[1];	

			$result = array_merge($result, $this->Preferences->GetAllPreferences());
			
			return json_encode($result);
		}

		/* public savePrefs()
		 * save the POSTed preferences for the web client (up/down speed etc)
		 *
		 */
		public function savePrefs() {
			$prefs = $_POST;
			
			// The checkbox-based prefs won't be passed if they're not selected
			if (! array_key_exists('auto_start', $prefs)) { $prefs['auto_start'] = false; }
			if (! array_key_exists('limit_download', $prefs)) { $prefs['limit_download'] = false; }
			if (! array_key_exists('limit_upload', $prefs)) { $prefs['limit_upload'] = false; }
			
			foreach ($prefs as $key=>$value) {
				
				// Checkboxes pass selected state as 'on'
				if ($value == 'on') {
					$prefs[$key] = true;
				}
				
				// Make sure 'rate' prefs are stored as ints
				if (strpos($key, 'rate') !== false) {
					$prefs[$key] = intval($value);
				}
			}
			
			// Set any daemon-specific settings
			$this->M->SetAutoStart(intval($prefs['auto_start']));
			unset($prefs['auto_start']);
			$this->M->SetPort(intval($prefs['port']));
			unset($prefs['port']);
			$this->M->SetDefaultDirectory($prefs['download_location']);
			unset($prefs['download_location']);		
			
			foreach ($prefs as $key=>$value) {								
				$this->Preferences->SetPreference($key, $value);
			}
			
			// Set the appropriate down & up rates
			if ($prefs['over_ride_rate']) {
				$this->M->SetDownloadLimit($prefs['over_ride_download_rate']);
				$this->M->SetUploadLimit($prefs['over_ride_upload_rate']);
				
			} else {
				if ($prefs['limit_download']) {
					$this->M->SetDownloadLimit($prefs['download_rate']);
				} else {
					$this->M->SetDownloadLimit(-1);
				}
				if ($prefs['limit_upload']) {
					$this->M->SetUploadLimit($prefs['upload_rate']);
				} else {
					$this->M->SetUploadLimit(-1);
				}
			}
		}

		/* public setOverRide([(bool) $overRide])
		 * Set the speed-limit over-ride
		 * Ex. setOverRide(true)
		 *
		 */
		public function setOverRide($overRide = false)
		{
			// Set the up and down limits
			if ($overRide) {
				$this->M->SetDownloadLimit($this->Preferences->GetPreference('over_ride_download_rate'));
				$this->M->SetUploadLimit($this->Preferences->GetPreference('over_ride_upload_rate'));
			} else {
				$this->M->SetDownloadLimit($this->Preferences->GetPreference('download_rate'));
				$this->M->SetUploadLimit($this->Preferences->GetPreference('upload_rate'));
			}
			
			// Store the $overRide value in the preferences
			$this->Preferences->SetPreference('over_ride_rate', intval($overRide));
						
		}

		/* public TorrentSort((array) $Torrents, [(string) $SortMethod, [(int) $SortOrder]])
		 * Sorts a two-dimensional array
		 * Ex. TorrentSort($TorrentsInArray, 'name', SORT_DESC)
		 *
		 * Valid sort options are SORT_ASC and SORT_DESC
		 * Do not attempt to sort using an array as the method. (EG. 'trackers' or 'files')
		 */
		public function TorrentSort(&$Torrents, $SortMethod = 'name', $SortOrder = SORT_ASC)
		{
			if (count($Torrents) > 0) {
				$sortCriteria = array();
				foreach ($Torrents as $TorrentID => $TorrentInfo) {
					$sortCriteria[$TorrentID] = strtolower($TorrentInfo[$SortMethod]);
					
					// Need to convert the criteria to lower case if it's a string to sort case-insensitively
					if (is_string($sortCriteria[$TorrentID])) {
						$sortCriteria[$TorrentID] = strtolower($sortCriteria[$TorrentID]);
					}
				}
				array_multisort($sortCriteria, $SortOrder, SORT_STRING, $Torrents);
			}
		}

		/* public GetTorrents([(string) $SortMethod, [(int) $SortOrder]])
		 * Gets an array containing all torrents and all information and sorts it
		 * Ex. GetTorrents()
		 *
		 * Valid sort options are SORT_ASC and SORT_DESC
		 * Do not attempt to sort using an array as the method. (EG. 'trackers' or 'files')
		 *
		 * Please note this function will get slower the more torrents there are.
		 * We suggest you use the functions from the MessageController ( Interface::$M )
		 * directly, instead of using this function
	
GET RID OF THIS FUNCTION IT SUCKZ0RS

		 */
		public function GetTorrents($SortMethod = 'id', $SortOrder = 4)
		{
			$TorrentInfos = $this->M->GetInfoAll('id', 'hash', 'name', 'path', 'saved', 'private', 'trackers', 'comment', 'creator', 'date', 'size', 'files');
			$TorrentStatuses = $this->M->GetStatusAll('completed', 'download-speed', 'download-total', 'error', 'error-message', 'eta', 'id', 'peers-downloading', 'peers-from', 'peers-total', 'peers-uploading', 'running', 'state', 'swarm-speed', 'tracker', 'scrape-completed', 'scrape-leechers', 'scrape-seeders', 'upload-speed', 'upload-total');

			$Torrents = $this->MergeArraysById($TorrentInfos, $TorrentStatuses);
			$this->TorrentSort($Torrents, $SortMethod, $SortOrder);
			return $Torrents;
		}

		/* public MergeArraysById((array) $Array1, (array) $Array2)
		 * Merges two arrays by id ($Array1[0]['id'])
		 * Used to merge two arrays of torrents into one.
		 */
		public function MergeArraysById($Array1, $Array2)
		{
			foreach ($Array1 as $key => $value)
				$NewArray1[$value['id']] = $Array1[$key];
			foreach ($Array2 as $key => $value)
				$NewArray2[$value['id']] = $Array2[$key];

			asort($NewArray1, SORT_ASC);
			asort($NewArray2, SORT_ASC);

			foreach ($NewArray1 as $key => $value)
			{
				unset($NewArray2[$key]['id']);
				$NewArray[$key] = array_merge_recursive($NewArray1[$key], $NewArray2[$key]);
			}

			return $NewArray;	
		}

		/* public function setDownloadRate([(integer) $rate])
		 * Set the maximum download rate for the daemon
		 * Ex. setDownloadRate(5)
		 *
		 * @access public
		 * @param integer $rate Maximum download rate
		 * @return void
		 */
		public function setDownloadRate($rate = -1)
		{
			if (! $this->Preferences->GetPreference('over_ride_rate')) {
				$this->M->SetDownloadLimit(intval($rate));
			}
			
			if ($rate == -1) {
				$this->Preferences->SetPreference('limit_download', false);	
			} else {
				$this->Preferences->SetPreference('download_rate', intval($rate));
			}
		}

		/* public function setUploadRate([(integer) $rate])
		 * Set the maximum upload rate for the daemon
		 * Ex. setUploadRate(5)
		 *
		 * @access public
		 * @param integer $rate Maximum upload rate
		 * @return void
		 */
		public function setUploadRate($rate = -1)
		{
			if (! $this->Preferences->GetPreference('over_ride_rate')) {
				$this->M->SetUploadLimit(intval($rate));
			}
			
			if ($rate == -1) {
				$this->Preferences->SetPreference('limit_upload', false);	
			} else {
				$this->Preferences->SetPreference('upload_rate', intval($rate));
			}
		}

		/* public function AddTorrentByUpload((string) $formname, [[(string) $directory], (integer) $autostart])
		 * Upload a torrent to the daemon
		 *
		 * @access public
		 * @param string $formname Name of the upload form
		 * @param string $directory Directory to download to
		 * @param integer $autostart Whether or not to auto-start the torrent (0 or 1)
		 * @return void
		 */
		public function AddTorrentByUpload($formname, $directory = null)
		{
			if (! $directory) {
				$response = $this->M->GetDefaultDirectory();
				$directory = $response[1];
			}
			
			if (!is_uploaded_file($_FILES[$formname]['tmp_name']))
				return $this->Error('No file uploaded');
			else if (!is_dir($directory))
				return $this->Error("The upload directory doesn't exist. (" . $directory . ")");
			else
			{
				$parts = pathinfo($_FILES[$formname]['name']);
				if ($parts['extension'] != 'torrent')
					return $this->Error('Uploaded file was not a .torrent file');
				else
					return $this->M->AddFileDetailed(file_get_contents($_FILES[$formname]['tmp_name']), $directory);
			}
		}

		/* public function removeTorrents([(string) $json_array], [(array)$info_fields], [(array)$status_fields])
		 * Removes a list of torrents, and returns an JSON array of torrent ids for the interface to remove
		 * Ex. removeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to remove
		 * @return string $result Array of torrent IDs for the interface to remove
		 */
		public function removeTorrents($json_array = "[]")
		{
			$torrent_id_list =  json_decode($json_array);

			if (count($torrent_id_list) == 0) {
				$this->M->RemoveAllTorrents();
			} else {
				$this->M->RemoveTorrents($torrent_id_list);
			}

			return $json_array;
		}

		/* public function resumeTorrents([(string) $json_array])
		 * Starts a list of torrents, and returns an JSON array of torrent data
		 * Ex. resumeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to start
		 * @return void
		 */
		public function resumeTorrents($json_array = "[]")
		{
			$torrent_id_list =  json_decode($json_array);

			if (count($torrent_id_list) == 0) {
				$this->M->StartAllTorrents();
			} else {
				$this->M->StartTorrents($torrent_id_list);
			}
		}

		/* public function pauseTorrents([(string) $json_array])
		 * Pauses a list of torrents, and returns an JSON array of torrent data
		 * Ex. pauseTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to pause
		 * @return void
		 */
		public function pauseTorrents($json_array = "[]")
		{
			$torrent_id_list =  json_decode($json_array);

			if (count($torrent_id_list) == 0) {
				$this->M->StopAllTorrents();
			} else {
				$this->M->StopTorrents($torrent_id_list);
			}
		}

		/* 	public function getTorrentData([(array)$info_fields], [(array)$status_fields], [(array)$id_list])
		 * Returns a JSON array of torrent data for the specified torrent-ids
		 * Ex. getTorrentData(array(1,2,3))
		 *
		 * @access public
		 * @param array $info_fields Array of torrent info fields to return
		 * @param array $status_fields Array of torrent status fields to return
		 * @param array $id_list Array of torrent IDs to get data about
		 * @return string $result JSON array of torrent data
		 */
		public function getTorrentData($info_fields = array(), $status_fields = array(), $id_list = array())
		{
			$torrent_list_data = array();
			$torrent_status_data = array();

			// If no ids are specified, get a list of all torrent IDs
			if (count($id_list) == 0) {
				$temp_id_list = $this->M->GetInfoAll('id');
				$temp_id_list = $temp_id_list[1];
				$id_list = array();
				foreach ($temp_id_list as $row) {
					$id_list[] = (int) $row['id'];
				}
			}
			
			$result = array();
			foreach ($id_list as $id) {
				$torrent_list_data = $this->M->GetInfo($id, $info_fields);
				$torrent_status_data = $this->M->GetStatus($id, $status_fields);
				$torrent_data = $this->mergeTorrentData($torrent_list_data, $torrent_status_data);
				array_push($result, $torrent_data[0]);
			}		

			return json_encode($result);
		}

		/* 	public function filterTorrents([(array)$infoFields], [(array)$statusFields], [(string)$filterType], [(string)$sortMethod], [(string)$sortDirection], [(string)$search])
		 * Returns a JSON array of torrent data for the specified filter type
		 * Ex. filterTorrents(FilterSeeding)
		 *
		 * @access public
		 * @param array $infoFields Array of torrent info fields to return
		 * @param array $statusFields Array of torrent status fields to return
		 * @param array $filterType Type of torrents to return (FilterAll, FilterDownloading, FilterSeeding, FilterPaused)
		 * @param string $sortMethod Method to sort the torrents (name, progress etc)
		 * @param string $sortDirection Direction to sort the torrents (SortAscending or SortDescending)
		 * @param string $search Only return torrents whose name contains the search string
		 * @return string $result JSON array of torrent data
		 */
		public function filterTorrents(
			$infoFields = array(), 
			$statusFields = array(), 
			$filterType = FilterAll, 
			$sortMethod = SortByQueueOrder, 
			$sortDirection = SortAscending, 
			$search = '')
		{
			// First, need to get the IDs of all the torrents that match this type
			// Need to look through all the torrents & figure out which ones we want
			// Is there an easier way to do this?
			$tempTorrentList = $this->mergeTorrentData($this->M->GetInfoAll('id'), $this->M->GetStatusAll('state'));
			$idList = array();
			foreach ($tempTorrentList as $row) {
				if ($filterType == $row['state'] || $filterType == FilterAll) { 
					$idList[] = (int) $row['id'];
				}
				
				// Add the torrent ID if we have a match
				if ($includeTorrent == true) {
					$idList[] = (int) $row['id'];
				}
			}
			
			$result = array();
			foreach ($idList as $id) {
				$torrentInfoData = $this->M->GetInfo($id, $infoFields);
				$torrentStatusData = $this->M->GetStatus($id, $statusFields);
				$torrentData = $this->mergeTorrentData($torrentInfoData, $torrentStatusData);
				
				// Set 'completed' as a percentage
				$torrentData[0]['percent_completed'] = round($torrentData[0]['completed'] / $torrentData[0]['size'] * 100, 2);
				array_push($result, $torrentData[0]);
			}		
			
			// Remember the current filter type
			$_SESSION['filterType'] = $filterType;
			
			if ($sortMethod == SortByQueueOrder && $sortDirection == SortDescending)
				$result = array_reverse($result);
				
			else if ($sortMethod != SortByQueueOrder && $sortDirection == SortDescending)
				$this->TorrentSort($result, $sortMethod, $SortOrder = SORT_DESC);
				
			else if ($sortMethod != SortByQueueOrder && $sortDirection == SortAscending)
				$this->TorrentSort($result, $sortMethod, $SortOrder = SORT_ASC);
			
			// If the search string isn't empty, filter out any torrents 
			// whose names don't include the string
			if ($search != '') {
				foreach ($result as $key=>$value) {
					if (stripos($result[$key]['name'], $search) === false ) {
						unset($result[$key]);
					}
				}
				$result = array_values($result);
			}
			
			// Store these settings for the future
			$this->Preferences->SetPreference('filter', $filterType);
			$this->Preferences->SetPreference('sort_method', $sortMethod);
			$this->Preferences->SetPreference('sort_direction', $sortDirection);
			
			return json_encode($result);
		}

		/* 	private function mergeTorrentData((array) $torrent_list_data, (array) $torrent_status_data)
		 * Merge the contents of the torrent data and status arrays by torrent-id into a single array
		 * Ex. getTorrentData(array(1,2,3))
		 *
		 * @access private
		 * @param array $torrent_list_data Array of basic torrent data
		 * @param array $torrent_status_data Array of torrent status data
		 * @return array $result merged torrent data
		 */
		private function mergeTorrentData($torrent_list_data, $torrent_status_data) 
		{
			$result = array();

			foreach ($torrent_list_data[1] as $torrent) :
				$result[$torrent['id']] = array();
				foreach ($torrent as $key => $value) :
					$key = str_replace('-', '_', $key);
					$result[$torrent['id']][$key] = $value;
				endforeach;
			endforeach;

			foreach ($torrent_status_data[1] as $torrent) :
				foreach ($torrent as $key => $value) :
					$key = str_replace('-', '_', $key);
					$result[$torrent['id']][$key] = $value;
				endforeach;
			endforeach;

			// Not interested in the keys anymore - only needed them for mapping
			return array_values($result);
		}

		/* public FindPossibleSockets()
		 * Look for the transmission socket under each home directory
		 * Use for *AID* in finding the socket by the end user
		 * IE, these are some of the things it *COULD* be.
		 * Note: Will not work if the users home dir has been moved
		 */
		public function FindPossibleSockets()
		{
			$Find = 'socket';
			$placesToLook = array
			(
				'/Users/'	=> '/Library/Application Support/Transmission/daemon/',
				'/Users/'	=> '/Library/Application Support/Transmission/',
				'/home/'	=> '/.transmission/daemon/',
				'/home/'	=> '/.transmission/',
			);
	
			foreach ($placesToLook as $home => $loc)
				if (is_dir($home))
				{
					$h = opendir($home);
					while (($file = readdir($h)) !== false)
						if (file_exists($home.$file.$loc.$Find)) 
							$Results[] = $home.$file.$loc.$Find;
					closedir($h);
				}
	
			return $Results;
		}
	}
?>