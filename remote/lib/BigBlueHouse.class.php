<?php

	/*
	 *	Copyright © Malcolm Jarvis, Dave Perrett and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	require_once('BEncodeSerializer.class.php');
	require_once('BEncodeUnserializer.class.php');
	require_once('IPCProtocol.class.php');
	require_once('MessageController.class.php');
	require_once('TransmissionController.class.php');
	require_once('JSON.php');
//	require_once('SQlite.class.php');

	class BigBlueHouse
	{
		public $Torrents;
		public $M;
		private $LastError;
		private $json;
		private $CacheFiles = array('data/torrentCache', 'data/torrentCache.1');

		public function __construct($MessageController = null)
		{
			if ($MessageController instanceof MessageController)
				$this->M = $MessageController;
			else
				$M = new MessageController(new TransmissionController);

			$this->json = new Services_JSON();
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

		/* public TorrentSort((array) $Torrents, [(string) $SortMethod, [(int) $SortOrder]])
		 * Sorts a two-dimensional array
		 * Ex. TorrentSort($TorrentsInArray, 'name', SORT_DESC)
		 *
		 * Valid sort options are SORT_ASC and SORT_DESC
		 * Do not attempt to sort using an array as the method. (EG. 'trackers' or 'files')
		 */
		public function TorrentSort(&$Torrents, $SortMethod = 'name', $SortOrder = 4)
		{
			foreach ($Torrents as $TorrentID => $TorrentInfo)
				foreach (array_keys($Torrents[$TorrentID]) as $TorrentKey)
					${$TorrentKey}[$TorrentID] = $TorrentInfo[$TorrentKey];

			array_multisort($$SortMethod, $SortOrder, $Torrents);
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

		public function AddTorrentByUpload($formname, $directory = null, $autostart = null)
		{
			if (!is_uploaded_file($_FILES[$formname]['tmp_name']))
				return $this->Error('No file uploaded');
			else
			{
				$parts = pathinfo($_FILES[$formname]['name']);
				if ($parts['extension'] != 'torrent')
					return $this->Error('Uploaded file was not a .torrent file');
				else
					return $this->M->AddFileDetailed($_FILES[$formname]['tmp_name'], $directory, $autostart);
			}
		}

		/* public function resumeTorrents([(string) $json_array], [(array)$info_fields], [(array)$status_fields])
		 * Starts a list of torrents, and returns an JSON array of torrent data
		 * Ex. resumeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to start
		 * @param array $info_fields Array of torrent info fields to return
		 * @param array $status_fields Array of torrent status fields to return
		 * @return string $result Array of torrent data after they've started
		 */
		public function resumeTorrents($info_fields = array(), $status_fields=array(), $json_array = "[]")
		{
			$torrent_id_list =  $this->json->decode($json_array);

			if (count($torrent_id_list) == 0) {
				$this->M->StartAllTorrents();
			} else {
				$this->M->StartTorrents($torrent_id_list);
			}

			return $this->getTorrentData($info_fields, $status_fields, $torrent_id_list);
		}

		/* public function pauseTorrents([(string) $json_array], [(array)$info_fields], [(array)$status_fields])
		 * Pauses a list of torrents, and returns an JSON array of torrent data
		 * Ex. pauseTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to pause
		 * @param array $info_fields Array of torrent info fields to return
		 * @param array $status_fields Array of torrent status fields to return
		 * @return string $result Array of torrent data after the pause
		 */
		public function pauseTorrents($info_fields = array(), $status_fields=array(), $json_array = "[]")
		{
			$torrent_id_list =  $this->json->decode($json_array);

			if (count($torrent_id_list) == 0) {
				$this->M->StopAllTorrents();
			} else {
				$this->M->StopTorrents($torrent_id_list);
			}

			return $this->getTorrentData($info_fields, $status_fields, $torrent_id_list);
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

			return $this->json->encode($result);
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

		public function LoadTorrents()
		{
			$idList = file_get_contents($this->CacheFiles[1]);

			if (empty($idList))
			{
				$IDs = $this->M->GetInfoAll('id');
				$oldIDs = $IDs[1];
				unset($IDs);
				foreach ($oldIDs as $value)
					$IDs[] = (int) $value['id'];
			}
			else
				$IDs = (array) unserialize($idList);

			// take first item off list, get info for it, then go onto next item
			$info_fields = array(
					"id", "hash", "name", "path", "saved", "private", 
					"trackers", "comment", "creator", "date", "size");
			$status_fields = array(
					"completed", "download-speed", "download-total", "error", 
					"error-message", "eta", "id", "peers-downloading", 
					"peers-from", "peers-total", "peers-uploading", "running", 
					"state", "swarm-speed", "tracker", "scrape-completed", 
					"scrape-leechers", "scrape-seeders", "upload-speed", "upload-total");

			$torrent_list_data = $this->M->GetInfo($IDs[0], $info_fields);
			$torrent_status_data = $this->M->GetStatus($IDs[0], $status_fields);				

			$result = $this->mergeTorrentData($torrent_list_data, $torrent_status_data);

			array_shift($IDs);

			if (file_exists($this->CacheFiles[0]))
			{
				$CurrentTorrents = unserialize(file_get_contents($this->CacheFiles[0]));
				$data = (!empty($CurrentTorrents)) ? array_merge($CurrentTorrents, $result) : $result;
				file_put_contents($this->CacheFiles[0], serialize($data));
			}

			if (!empty($IDs))
			{
				file_put_contents($this->CacheFiles[1], serialize($IDs));
				header('location: http://'.$_SERVER['HTTP_HOST'].dirname($_SERVER['REQUEST_URI']).'?action=getTorrentList&param=[]');
			}
			else
			{
				file_put_contents($this->CacheFiles[0], '');
				file_put_contents($this->CacheFiles[1], '');
				return $this->json->encode($data);
			}
		}
	}
?>