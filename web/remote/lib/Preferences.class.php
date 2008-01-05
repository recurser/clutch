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
			$Result = false;
			$this->PreferenceFile = $PreferenceFile;

			if (!file_exists($this->PreferenceFile)) {
				$Result = touch($this->PreferenceFile);
			} else {
				$Result = true;
			}
			
			$this->Preferences = unserialize(file_get_contents($this->PreferenceFile));
			
			// Set defaults if this is a fresh install
			if (!is_array($this->Preferences)) {
				$this->Preferences = $Defaults;
				$this->WritePreferences();
			}
			
			return $Result;
		}

		private function WritePreferences()
		{
			return file_put_contents($this->PreferenceFile, serialize($this->Preferences));
		}

		public function GetAllPreferences()
		{
			return $this->Preferences;
		}

		public function GetPreference($Key)
		{
			$Result = null;
			if (array_key_exists($Key, $this->Preferences)) {
				$Result =  $this->Preferences[$Key];
			}
			
			return $Result;
		}

		public function SetPreference($Key, $Value)
		{
			$Result = true;
			if ($this->Preferences[$Key] != $Value) {
				$this->Preferences[$Key] = $Value;
			 	$Result = $this->WritePreferences();
			}
			return $Result;
		}
	}
?>