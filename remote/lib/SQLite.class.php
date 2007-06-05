<?php
	/*
	 *	Copyright © Malcolm Jarvis
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */
	
	class SQLite
	{
		public function __construct()
		{
			$this->db = new SQLiteDatabase('../data/prefs.sqlite', 0666, $error);
			return true;
		}

		public function Install()
		{
			$this->db->queryExec("CREATE TABLE prefs
			(
			name TEXT UNIQUE,
			value TEXT
			)");
			return true;
		}

		public function GetPreference($name)
		{
			$name = sqlite_escape_string($name);
			return $this->db->singleQuery("SELECT value FROM prefs WHERE name='$name'");
		}

		public function Preference($name, $value)
		{
			$name = sqlite_escape_string($name);
			$value = sqlite_escape_string($value);
			$this->db->queryExec("INSERT OR REPLACE INTO prefs (name,value) VALUES ('$name', '$value')");
			return true;
		}

		public function Clean()
		{
			$this->db->queryExec('VACUUM');
			return true;
		}
	}

	$test = new SQLite;
	var_dump($test->GetPreference('testing'));
	$test->Preference('testing', 'test2');
	var_dump($test->GetPreference('testing'));
?>