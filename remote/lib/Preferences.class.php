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

		public function __construct($PreferenceFile, $Defaults)
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
				$this->Preferences = $Defaults;
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