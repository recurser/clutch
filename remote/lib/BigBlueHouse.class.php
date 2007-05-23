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

	class BigBlueHouse
	{
		public $Torrents;
		public $M;
		private $LastError;
		private $json;

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

		/* public function resumeTorrents([(string) $json_array])
		 * Starts a list of torrents, and returns an JSON array of torrent data
		 * Ex. resumeTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to start
		 * @return string $result Array of torrent data after they've started
		 */
		public function resumeTorrents($json_array = "[]")
		{
			$torrent_id_list =  $this->json->decode($json_array);

			if (count($torrent_id_list) == 0)
				$this->M->StartAllTorrents();
			else
				$this->M->StartTorrents($torrent_id_list);

			return $this->getTorrentData($torrent_id_list);
		}

		/* public function pauseTorrents([(string) $json_array])
		 * Pauses a list of torrents, and returns an JSON array of torrent data
		 * Ex. pauseTorrents([1,2,3])
		 *
		 * @access public
		 * @param string $json_array Array of torrent IDs to pause
		 * @return string $result Array of torrent data after the pause
		 */
		public function pauseTorrents($json_array = "[]")
		{
			$torrent_id_list =  $this->json->decode($json_array);

			if (count($torrent_id_list) == 0)
				$this->M->StopAllTorrents();
			else
				$this->M->StopTorrents($torrent_id_list);

			return $this->getTorrentData($torrent_id_list);
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

			// If no ids are specified, return data for all torrents
			if (count($id_list) == 0) {
				$torrent_list_data = $this->M->GetInfoAll($info_fields);
				$torrent_status_data = $this->M->GetStatusAll($status_fields);				

			// Otherwise, only get data for the specified torrents	
			}
			else
			{
				$torrent_list_data = $this->M->GetInfo($id_list, $info_fields);
				$torrent_status_data = $this->M->GetStatus($id_list, $status_fields);				
			}

			$result = $this->mergeTorrentData($torrent_list_data, $torrent_status_data);

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
	}
?>