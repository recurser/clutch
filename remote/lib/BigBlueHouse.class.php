<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	require_once('BEncodeSerializer.class.php');
	require_once('BEncodeUnserializer.class.php');
	require_once('IPCProtocol.class.php');
	require_once('MessageController.class.php');
	require_once('TransmissionController.class.php');

	class BigBlueHouse
	{
		public $Torrents;
		public $M;
		private $LastError;

		public function __construct($MessageController = null)
		{
			if ($MessageController instanceof MessageController)
				$this->M = $MessageController;
			else
				$M = new MessageController(new TransmissionController);
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
	}
?>