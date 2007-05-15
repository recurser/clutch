<?php

/*
 *	Copyright © Malcolm Jarvis and Kendall Hopkins
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 */

require_once('inc/trans_main.inc');
$TControl = new TransmissionController('/Users/dave/Library/Application Support/Transmission/daemon/socket');
$MControl = new MessageController($TControl);
$Instance = new BigBlueHouse($MControl);

if (isset($_GET['action'])) :
	
	$function = '';
	$arg_list = '';
	
	switch($_GET['action']) :
	
		case 'getTorrentList' :
			$function = 'addTorrents';
			$arg_list = getTorrentList();
			break;
	
	endswitch;

	// Set the mime type (causes prototype to auto-eval())
	header('Content-type: text/javascript');

	// Encode and output the response
	$json = new Services_JSON();
	echo 'transmission.' . $function . '(' . $json->encode($arg_list) . ');';


endif;




function getTorrentList() {
	global $Instance;
	$result = array();
	
	$torrent_list_data = $Instance->M->GetInfoAll('id', 'name', 'hash', 'date', 'size');

	foreach ($torrent_list_data[1] as $torrent) :
		$result[$torrent['id']] = array();
		foreach ($torrent as $key => $value) :
			$key = str_replace('-', '_', $key);
			$result[$torrent['id']][$key] = $value;
		endforeach;
	endforeach;
	
	$torrent_status_data = $Instance->M->GetStatusAll(
		'id', 'completed', 'download-total', 'upload-total', 
		'download-speed', 'upload-speed', 'peers-downloading', 
		'peers-from', 'peers-total', 'peers-uploading', 'error', 
		'error-message', 'eta', 'running', 'state');

	foreach ($torrent_status_data[1] as $torrent) :
		foreach ($torrent as $key => $value) :
			$key = str_replace('-', '_', $key);
			$result[$torrent['id']][$key] = $value;
		endforeach;
	endforeach;
	
	// Not interested in the keys anymore - only needed them for mapping
	return array_values($result);
}


















?>