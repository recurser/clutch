<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */

define('FilterAll',         'all');
define('FilterDownloading', 'downloading');
define('FilterSeeding',     'seeding');
define('FilterPaused',      'paused');
define('SortAscending',     'ascending');
define('SortDescending',    'descending');
define('SortByQueueOrder',  'queue_order');
define('SortByDate',        'date');
define('SortByName',        'name');
define('SortByCompleted',   'completed');
define('SortByState',       'state');

// Defaults
define('DefaultFilter',                FilterAll);
define('DefaultSortMethod',            SortByQueueOrder);
define('DefaultSortDirection',         SortAscending);
define('DefaultFilterVisible',         true);
define('DefaultInspectorVisible',      false);
define('DefaultOverRideDownloadLimit', false);
define('DefaultOverRideDownloadRate',  10);
define('DefaultOverRideUploadLimit',   false);
define('DefaultOverRideUploadRate',    10);


?>