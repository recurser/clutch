<?php
	/*
	 *	Copyright © Malcolm Jarvis, Dave Perrett and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	class Preferences
	{
		private $PreferenceFile = 'data/prefs.txt';

		public function __construct()
		{
			if (!file_exists($PreferenceFile))
				return touch($PreferenceFile);
			else
				return true;
		}

		private function ReadPreferences()
		{
			return unserialize(file_get_contents('data/prefs.txt'));
		}

		private function WritePreferences($PrefsArray)
		{
			return file_put_contents($PreferenceFile, serialize($PrefsArray));
		}

		public function GetPreference($key)
		{
			$Prefs = ReadPreferences();
			if (array_key_exists($key, $Prefs))
				return $Prefs[$key];
		}

		public function SetPreference($key, $value)
		{
			$Prefs = ReadPreferences();
			$Prefs[$key] = $value;
			return WritePreferences($Prefs);
		}
	}
?>