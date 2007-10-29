<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */
$CONST = array();

define('FilterAll',           'all');
define('FilterDownloading',   'downloading');
define('FilterSeeding',       'seeding');
define('FilterPaused',        'paused');
define('SortAscending',       'ascending');
define('SortDescending',      'descending');
define('SortByQueueOrder',    'queue_order');
define('SortByDate',          'date');
define('SortByName',          'name');
define('SortByCompleted',     'percent_completed');
define('SortByState',         'state');
define('EncryptionRequired',  'required');
define('EncryptionPreferred', 'preferred');

// Defaults
define('DefaultFilter',                FilterAll);
define('DefaultSortMethod',            SortByQueueOrder);
define('DefaultSortDirection',         SortAscending);
define('DefaultFilterVisible',         true);
define('DefaultInspectorVisible',      false);
define('DefaultOverRideRate',          false);
define('DefaultLimitDownload',         false);
define('DefaultLimitUpload',           false);
define('DefaultDownloadRate',          10);
define('DefaultUploadRate',            10);
define('DefaultOverRideDownloadRate',  10);
define('DefaultOverRideUploadRate',    10);
define('DefaultRefreshRate',           5);
define('DefaultEncryptionState',       EncryptionRequired);

// Preferences
$CONST['default_preferences'] = array(
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
	'over_ride_upload_rate'    => DefaultOverRideUploadRate,
	'refresh_rate'             => DefaultRefreshRate,
	'refresh_rate'             => DefaultRefreshRate
);


?>