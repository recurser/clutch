<?php
	/*
	 *	Copyright © Malcolm Jarvis, Dave Perrett and Kendall Hopkins
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */

	class Preferences
	{
		private $PreferenceFile;
		private $Preferences;

		public function __construct($PreferenceFile)
		{
			$result = false;
			$this->PreferenceFile = $PreferenceFile;

			if (!file_exists($this->PreferenceFile)) {
				$result = touch($this->PreferenceFile);
			} else {
				$result = true;
			}
			
			$this->Preferences = unserialize(file_get_contents($this->PreferenceFile));
			
			// Set defaults if this is a fresh install
			if (!is_array($this->Preferences)) {
				$this->Preferences = array(
					'filter'                   => DefaultFilter,
					'sort_method'              => DefaultSortMethod,
					'sort_direction'           => DefaultSortDirection,
					'show_inspector'           => DefaultInspectorVisible,
					'show_filter'              => DefaultFilterVisible,
					'over_ride_rate'           => DefaultOverRideRate,
					'limit_download'           => DefaultLimitDownload,
					'limit_upload'             => DefaultLimitUpload,
					'download_rate'            => DefaultDownloadRate,
					'upload_rate'              => DefaultUploadRate,
					'over_ride_download_rate'  => DefaultOverRideDownloadRate,
					'over_ride_upload_rate'    => DefaultOverRideUploadRate
				);
				$this->WritePreferences();
			}
			
			return $result;
		}

		private function WritePreferences()
		{
			return file_put_contents($this->PreferenceFile, serialize($this->Preferences));
		}

		public function GetAllPreferences()
		{
			return $this->Preferences;
		}

		public function GetPreference($key)
		{
			$result = null;
			if (array_key_exists($key, $this->Preferences)) {
				$result =  $this->Preferences[$key];
			}
			
			return $result;
		}

		public function SetPreference($key, $value)
		{
			$result = true;
			if ($this->Preferences[$key] != $value) {
				$this->Preferences[$key] = $value;
			 	$result = $this->WritePreferences();
			}
			return $result;
		}
	}
?>