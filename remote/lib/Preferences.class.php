<?php
	/*
	 *	Copyright © Malcolm Jarvis, Dave Perrett and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	class Preferences
	{
		public $PreferenceFile;

		public function __construct($PreferenceFile)
		{
			$this->PreferenceFile = $PreferenceFile;

			if (!file_exists($this->PreferenceFile))
				return touch($this->PreferenceFile);
			else
				return true;
		}

		public function ReadPreferences()
		{
			return unserialize(file_get_contents($this->PreferenceFile));
		}

		private function WritePreferences($PrefsArray)
		{
			return file_put_contents($this->PreferenceFile, serialize($PrefsArray));
		}

		public function GetPreference($key)
		{
			$Prefs = $this->ReadPreferences();
			if (array_key_exists($key, $Prefs))
				return $Prefs[$key];
		}

		public function SetPreference($key, $value)
		{
			$Prefs = $this->ReadPreferences();
			$Prefs[$key] = $value;
			return $this->WritePreferences($Prefs);
		}
	}
?>