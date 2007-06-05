<?php

/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 */

require_once('inc/trans_main.inc');
$TControl = new TransmissionController(file_get_contents('data/socket.txt'));
$MControl = new MessageController($TControl);
$Instance = new BigBlueHouse($MControl);

if (isset($_GET['action']) && isset($_GET['param'])) 
{
	
	$function = '';
	$arg_list = '';
	
	switch($_GET['action']) 
	{
		case 'getTorrentList' :
			$function = 'addTorrents';
			$arg_list = $Instance->LoadTorrents($_GET['ids']);
			break;

		case 'reloadTorrents' :
			$function = 'refreshTorrents';
			$status_fields = array(
					'id', 'completed', 'download-total', 'upload-total', 
					'download-speed', 'upload-speed', 'peers-downloading', 
					'peers-from', 'peers-total', 'peers-uploading', 'error', 
					'error-message', 'eta', 'running', 'state');
			$arg_list = $Instance->getTorrentData($info_fields, $status_fields);
			break;

		case 'pauseTorrents' :
			$function = 'refreshTorrents';
			$status_fields = array(
					'id', 'completed', 'download-total', 'upload-total', 
					'download-speed', 'upload-speed', 'peers-downloading', 
					'peers-from', 'peers-total', 'peers-uploading', 'error', 
					'error-message', 'eta', 'running', 'state');
			$arg_list = $Instance->pauseTorrents($_GET['param'], $info_fields, $status_fields);
			break;

		case 'resumeTorrents' :
			$function = 'refreshTorrents';
			$status_fields = array(
					'id', 'completed', 'download-total', 'upload-total', 
					'download-speed', 'upload-speed', 'peers-downloading', 
					'peers-from', 'peers-total', 'peers-uploading', 'error', 
					'error-message', 'eta', 'running', 'state');
			$arg_list = $Instance->resumeTorrents($_GET['param'], $info_fields, $status_fields);
			break;
	
	}

	// Set the mime type (causes prototype to auto-eval())
	header('Content-type: text/javascript');

	// Encode and output the response
	echo 'transmission.' . $function . '(' . $arg_list . ');';

}


















?>