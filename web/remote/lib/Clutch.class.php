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
		 * @return array $Result
		 */
		public function GetInitialSettings() {
			$Result = array();			
			
			$AutoStart                   = $this->M->GetAutoStart();
			$Result['auto_start']        = $AutoStart[1];			
			$DownloadLocation            = $this->M->GetDefaultDirectory();
			$Result['download_location'] = $DownloadLocation[1];			
			$Port                        = $this->M->GetPort();
			$Result['port']              = $Port[1];				
			$Encryption                  = $this->M->GetEncryption();
			$Result['encryption']        = $Encryption[1];	

			$Result = array_merge($Result, $this->Preferences->GetAllPreferences());
			
			// Down/Up rate is a bit fiddly - remember the last up/down speed
			// if it's not set by transmission			
			$DownloadRate = $this->M->GetDownloadLimit();
			if (isset($DownloadRate[1]) && intval($DownloadRate[1]) >= 0)
			{
				$Result['download_rate'] = $DownloadRate[1];
				$Result['limit_download'] = true;
			}
			$UploadRate = $this->M->GetUploadLimit();
			if (isset($UploadRate[1]) && intval($UploadRate[1]) >= 0)
			{
				$Result['upload_rate'] = $UploadRate[1];
				$Result['limit_upload'] = true;			
			}
			
			if (is_null($Result['download_rate'])) 
			{
				$Result['download_rate'] = 0;
				$Result['limit_download'] = false;
			}
			if (is_null($Result['upload_rate']))
			{
				$Result['upload_rate'] = 0;
				$Result['limit_upload'] = false;
			}
			
			return json_encode($Result);
		}

		/* public savePrefs()
		 * save the POSTed preferences for the web client (up/down speed etc)
		 *
		 */
		public function savePrefs() {
			$Prefs = $_POST;
			
			// Make sure the download directory exists
			if (! is_dir($Prefs['download_location'])) {
				return $this->Error("The download directory doesn't exist.");
			}
			
			// The checkbox-based prefs won't be passed if they're not selected
			if (! array_key_exists('auto_start', $Prefs)) { $Prefs['auto_start'] = false; }
			if (! array_key_exists('limit_download', $Prefs)) { $Prefs['limit_download'] = false; }
			if (! array_key_exists('limit_upload', $Prefs)) { $Prefs['limit_upload'] = false; }
			
			foreach ($Prefs as $Key=>$Value) {
				
				// Checkboxes pass selected state as 'on'
				if ($Value == 'on') {
					$Prefs[$Key] = true;
				}
				
				// Make sure 'rate' prefs are stored as ints
				if (strpos($Key, 'rate') !== false) {
					$Prefs[$Key] = intval($Value);
				}
			}
			
			// Set any daemon-specific settings
			$this->M->SetAutoStart(intval($Prefs['auto_start']));
			unset($Prefs['auto_start']);
			$this->M->SetPort(intval($Prefs['port']));
			unset($Prefs['port']);
			$this->M->SetDefaultDirectory($Prefs['download_location']);
			unset($Prefs['download_location']);
			$Encryption = ($Prefs['encryption'] == 1) ? EncryptionRequired : EncryptionPreferred;
			$this->M->SetEncryption($Encryption);
			unset($Prefs['encryption']);		
			
			foreach ($Prefs as $Key=>$Value) {								
				$this->Preferences->SetPreference($Key, $Value);
			}
			
			if ($Prefs['limit_download']) {
				$this->M->SetDownloadLimit($Prefs['download_rate']);
			} else {
				$this->M->SetDownloadLimit(-1);
			}
			if ($Prefs['limit_upload']) {
				$this->M->SetUploadLimit($Prefs['upload_rate']);
			} else {
				$this->M->SetUploadLimit(-1);
			}
			
			return true;
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
				$SortCriteria = array();
				foreach ($Torrents as $TorrentID => $TorrentInfo) {
					
					if ($SortMethod == SortByTracker && isset($TorrentInfo[$SortMethod]['address'])) {
						$SortCriteria[$TorrentID] = strtolower($TorrentInfo[$SortMethod]['address']);
					} else {
						$SortCriteria[$TorrentID] = strtolower($TorrentInfo[$SortMethod]);
					}
					
					// Need to convert the criteria to lower case if it's a string to sort case-insensitively
					if (is_string($SortCriteria[$TorrentID])) {
						$SortCriteria[$TorrentID] = strtolower($SortCriteria[$TorrentID]);
					}
				}
				
				$SortType = SORT_STRING;
				if ($SortMethod == SortByCompleted) 
				{
					$SortType = SORT_NUMERIC;
				}
				array_multisort($SortCriteria, $SortOrder, $SortType, $Torrents);
			}
		}

		/* public MergeArraysById((array) $Array1, (array) $Array2)
		 * Merges two arrays by id ($Array1[0]['id'])
		 * Used to merge two arrays of torrents into one.
		 */
		public function MergeArraysById($Array1, $Array2)
		{
			foreach ($Array1 as $Key => $Value)
				$NewArray1[$Value['id']] = $Array1[$Key];
			foreach ($Array2 as $Key => $Value)
				$NewArray2[$Value['id']] = $Array2[$Key];

			asort($NewArray1, SORT_ASC);
			asort($NewArray2, SORT_ASC);

			foreach ($NewArray1 as $Key => $Value)
			{
				unset($NewArray2[$Key]['id']);
				$NewArray[$Key] = array_merge_recursive($NewArray1[$Key], $NewArray2[$Key]);
			}

			return $NewArray;	
		}

		/* public function setDownloadRate([(integer) $Rate])
		 * Set the maximum download rate for the daemon
		 * Ex. setDownloadRate(5)
		 *
		 * @access public
		 * @param integer $Rate Maximum download rate
		 * @return void
		 */
		public function setDownloadRate($Rate = -1)
		{
			$this->M->SetDownloadLimit(intval($Rate));
			
			if ($Rate == -1) {
				$this->Preferences->SetPreference('limit_download', false);	
			} else {
				$this->Preferences->SetPreference('download_rate', intval($Rate));
			}
		}

		/* public function setUploadRate([(integer) $Rate])
		 * Set the maximum upload rate for the daemon
		 * Ex. setUploadRate(5)
		 *
		 * @access public
		 * @param integer $Rate Maximum upload rate
		 * @return void
		 */
		public function setUploadRate($Rate = -1)
		{
			$this->M->SetUploadLimit(intval($Rate));
			
			if ($Rate == -1) {
				$this->Preferences->SetPreference('limit_upload', false);	
			} else {
				$this->Preferences->SetPreference('upload_rate', intval($Rate));
			}
		}

		/* public function AddTorrentByUpload((string) $FormName, [(string) $Directory])
		 * Upload a torrent to the daemon
		 *
		 * @access public
		 * @param string $FormName Name of the upload form
		 * @param string $Directory Directory to download to
		 * @return void
		 */
		public function AddTorrentByUpload($FormName, $Directory = null)
		{
			if (! $Directory) {
				$Response = $this->M->GetDefaultDirectory();
				$Directory = $Response[1];
			}
			
			if (!is_uploaded_file($_FILES[$FormName]['tmp_name']))
				return $this->Error('No file uploaded');
			else if (!is_dir($Directory))
				return $this->Error("The download directory doesn't exist. Please check your preferences.");
			else
			{
				$parts = pathinfo($_FILES[$FormName]['name']);
				if ($parts['extension'] != 'torrent')
					return $this->Error('Uploaded file was not a .torrent file');
				else
					return $this->M->AddFileDetailed(file_get_contents($_FILES[$FormName]['tmp_name']), $Directory);
			}
		}

		/* public function AddTorrentByURL((string) $URL, [(string) $Directory])
		 * Upload a torrent to the daemon by specifying a URL
		 * 
		 * @access public
		 * @param string $URL URL where the .torrent file is
		 * @param string $Directory Directory to download to
		 * @return void
		 */
		public function AddTorrentByURL($URL, $Directory = null)
		{
			if (!$Directory) {
				$Response = $this->M->GetDefaultDirectory();
				$Directory = $Response[1];
			}

			return $this->M->AddFileDetailed(file_get_contents($URL), $Directory);
		}

		/* public function removeTorrents([(string) $JsonArray], [(array)$InfoFields], [(array)$status_fields])
		 * Removes a list of torrents, and returns an JSON array of torrent ids for the interface to remove
		 * Ex. removeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $JsonArray Array of torrent IDs to remove
		 * @return string $Result Array of torrent IDs for the interface to remove
		 */
		public function removeTorrents($JsonArray = "[]")
		{
			$TorrentIdList =  json_decode($JsonArray);

			if (count($TorrentIdList) == 0) {
				$this->M->RemoveAllTorrents();
			} else {
				$this->M->RemoveTorrents($TorrentIdList);
			}

			return $JsonArray;
		}

		/* public function resumeTorrents([(string) $JsonArray])
		 * Starts a list of torrents, and returns an JSON array of torrent data
		 * Ex. resumeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $JsonArray Array of torrent IDs to start
		 * @return void
		 */
		public function resumeTorrents($JsonArray = "[]")
		{
			$TorrentIdList =  json_decode($JsonArray);

			if (count($TorrentIdList) == 0) {
				$this->M->StartAllTorrents();
			} else {
				$this->M->StartTorrents($TorrentIdList);
			}
		}

		/* public function pauseTorrents([(string) $JsonArray])
		 * Pauses a list of torrents, and returns an JSON array of torrent data
		 * Ex. pauseTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $JsonArray Array of torrent IDs to pause
		 * @return void
		 */
		public function pauseTorrents($JsonArray = "[]")
		{
			$TorrentIdList =  json_decode($JsonArray);

			if (count($TorrentIdList) == 0) {
				$this->M->StopAllTorrents();
			} else {
				$this->M->StopTorrents($TorrentIdList);
			}
		}

		/* 	public function getTorrentData([(array)$InfoFields], [(array)$status_fields], [(array)$IdList])
		 * Returns a JSON array of torrent data for the specified torrent-ids
		 * Ex. getTorrentData(array(1,2,3))
		 *
		 * @access public
		 * @param array $InfoFields Array of torrent info fields to return
		 * @param array $status_fields Array of torrent status fields to return
		 * @param array $IdList Array of torrent IDs to get data about
		 * @return string $Result JSON array of torrent data
		 */
		public function getTorrentData($InfoFields = array(), $status_fields = array(), $IdList = array())
		{
			$TorrentListData = array();
			$Torrent_status_data = array();

			// If no ids are specified, get a list of all torrent IDs
			if (count($IdList) == 0) {
				$TempIdList = $this->M->GetInfoAll('id');
				$TempIdList = $TempIdList[1];
				$IdList = array();
				foreach ($TempIdList as $Row) {
					$IdList[] = (int) $Row['id'];
				}
			}
			
			$Result = array();
			foreach ($IdList as $Id) {
				$TorrentListData = $this->M->GetInfo($Id, $InfoFields);
				$Torrent_status_data = $this->M->GetStatus($Id, $status_fields);
				$Torrent_data = $this->mergeTorrentData($TorrentListData, $Torrent_status_data);
				array_push($Result, $Torrent_data[0]);
			}		

			return json_encode($Result);
		}

		/* 	public function filterTorrents([(array)$InfoFields], [(array)$StatusFields], [(string)$FilterType], [(string)$sortMethod], [(string)$sortDirection], [(string)$Search])
		 * Returns a JSON array of torrent data for the specified filter type
		 * Ex. filterTorrents(FilterSeeding)
		 *
		 * @access public
		 * @param array $InfoFields Array of torrent info fields to return
		 * @param array $StatusFields Array of torrent status fields to return
		 * @param array $FilterType Type of torrents to return (FilterAll, FilterDownloading, FilterSeeding, FilterPaused)
		 * @param string $sortMethod Method to sort the torrents (name, progress etc)
		 * @param string $sortDirection Direction to sort the torrents (SortAscending or SortDescending)
		 * @param string $Search Only return torrents whose name contains the search string
		 * @return string $Result JSON array of torrent data
		 */
		public function filterTorrents(
			$InfoFields = array(), 
			$StatusFields = array(), 
			$FilterType = FilterAll, 
			$sortMethod = SortByQueueOrder, 
			$sortDirection = SortAscending, 
			$Search = '')
		{
			// First, need to get the IDs of all the torrents that match this type
			// Need to look through all the torrents & figure out which ones we want
			// Is there an easier way to do this?
			$TempTorrentList = $this->mergeTorrentData(
									$this->M->GetInfoAll('id'), 
									$this->M->GetStatusAll('state', 'download-speed', 'upload-speed')
								);
			$IdList            = array();
			$TotalDownloadRate = 0;
			$TotalUploadRate   = 0;
			foreach ($TempTorrentList as $Row) {
				$TotalDownloadRate += $Row['download_speed'];
				$TotalUploadRate   += $Row['upload_speed'];
				if ($FilterType == $Row['state'] || $FilterType == FilterAll) { 
					$IdList[] = (int) $Row['id'];
				}
				
				// Add the torrent ID if we have a match
				if ($includeTorrent == true) {
					$IdList[] = (int) $Row['id'];
				}
			}
			
			$Result = array();
			foreach ($IdList as $Id) {
				$TorrentInfoData = $this->M->GetInfo($Id, $InfoFields);
				$TorrentStatusData = $this->M->GetStatus($Id, $StatusFields);
				$TorrentData = $this->mergeTorrentData($TorrentInfoData, $TorrentStatusData);
				
				// Set 'completed' as a percentage
				$TorrentData[0]['percent_completed'] = round($TorrentData[0]['completed'] / $TorrentData[0]['size'] * 100, 2);
				array_push($Result, $TorrentData[0]);
			}		
			
			// Remember the current filter type
			$_SESSION['filterType'] = $FilterType;
			
			if ($sortMethod == SortByQueueOrder && $sortDirection == SortDescending)
				$Result = array_reverse($Result);
				
			else if ($sortMethod != SortByQueueOrder && $sortDirection == SortDescending)
				$this->TorrentSort($Result, $sortMethod, $SortOrder = SORT_DESC);
				
			else if ($sortMethod != SortByQueueOrder && $sortDirection == SortAscending)
				$this->TorrentSort($Result, $sortMethod, $SortOrder = SORT_ASC);
			
			// If the search string isn't empty, filter out any torrents 
			// whose names don't include the string
			if ($Search != '') {
				foreach ($Result as $Key=>$Value) {
					if (stripos($Result[$Key]['name'], $Search) === false ) {
						unset($Result[$Key]);
					}
				}
				$Result = array_values($Result);
			}
			
			// Figure out the disk space remaining
			$Response        = $this->M->GetDefaultDirectory();
			$TotalSpace      = disk_total_space($Response[1]);
			$FreeSpaceBytes  = disk_free_space($Response[1]);
			$FreeSpacePercent = round($FreeSpaceBytes * 100 / $TotalSpace, 1);
				
			// Include total down and up rates in the result
			$Result = array(
						'free_space_bytes'    => $FreeSpaceBytes,
						'free_space_percent'  => $FreeSpacePercent,
						'total_download_rate' => $TotalDownloadRate,
						'total_upload_rate'   => $TotalUploadRate,
						'torrent_list'        => $Result
					);
			
			// Store these settings for the future
			$this->Preferences->SetPreference('filter', $FilterType);
			$this->Preferences->SetPreference('sort_method', $sortMethod);
			$this->Preferences->SetPreference('sort_direction', $sortDirection);
			
			return json_encode($Result);
		}

		/* 	private function mergeTorrentData((array) $TorrentListData, (array) $Torrent_status_data)
		 * Merge the contents of the torrent data and status arrays by torrent-id into a single array
		 * Ex. getTorrentData(array(1,2,3))
		 *
		 * @access private
		 * @param array $TorrentListData Array of basic torrent data
		 * @param array $Torrent_status_data Array of torrent status data
		 * @return array $Result merged torrent data
		 */
		private function mergeTorrentData($TorrentListData, $Torrent_status_data) 
		{
			$Result = array();

			foreach ($TorrentListData[1] as $Torrent) :
				$Result[$Torrent['id']] = array();
				foreach ($Torrent as $Key => $Value) :
					$Key = str_replace('-', '_', $Key);
					$Result[$Torrent['id']][$Key] = $Value;
				endforeach;
			endforeach;

			foreach ($Torrent_status_data[1] as $Torrent) :
				foreach ($Torrent as $Key => $Value) :
					$Key = str_replace('-', '_', $Key);
					$Result[$Torrent['id']][$Key] = $Value;
				endforeach;
			endforeach;

			// Not interested in the keys anymore - only needed them for mapping
			return array_values($Result);
		}
	}
?>
