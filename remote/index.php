<?php

/*
 *	Copyright © Dave Perrett and Malcolm Jarvis
 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
 */

require_once('inc/trans_main.inc');
$TControl = new TransmissionController('/Users/dave/Library/Application Support/Transmission/daemon/socket');
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
			$arg_list = $Instance->getTorrentData();
			break;

		case 'reloadTorrents' :
			$function = 'refreshTorrents';
			$arg_list = $Instance->getTorrentData();
			break;

		case 'pauseTorrents' :
			$function = 'refreshTorrents';
			$arg_list = $Instance->pauseTorrents($_GET['param']);
			break;

		case 'resumeTorrents' :
			$function = 'refreshTorrents';
			$arg_list = $Instance->resumeTorrents($_GET['param']);
			break;
	
	}

	// Set the mime type (causes prototype to auto-eval())
	header('Content-type: text/javascript');

	// Encode and output the response
	echo 'transmission.' . $function . '(' . $arg_list . ');';

}


















?>