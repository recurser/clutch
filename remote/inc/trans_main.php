<?php
	/*
	 *	Copyright © Dave Perrett and Malcolm Jarvis
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */

	$INSTALL_PATH = dirname(__FILE__) . '/..';
	
	if (empty($INSTALL_PATH))
	  $INSTALL_PATH = './';
	else
	  $INSTALL_PATH .= '/';
	
	// Make sure the path_separator is defined
	if (!defined('PATH_SEPARATOR'))
	  define('PATH_SEPARATOR', (eregi('win', PHP_OS) ? ';' : ':'));
	
	
	// Set the include path
	ini_set('include_path', 
		$INSTALL_PATH.PATH_SEPARATOR.
		$INSTALL_PATH.'inc'.PATH_SEPARATOR.
		$INSTALL_PATH.'lib'.PATH_SEPARATOR.
		ini_get('include_path')
	);
	
	ini_set('session.name', 'sessid');
	ini_set('session.use_cookies', 1);
	ini_set('session.gc_maxlifetime', 21600);
	ini_set('session.gc_divisor', 500);
	ini_set('error_reporting', E_ALL&~E_NOTICE); 
	
	// Increase maximum execution time for php scripts
	// (doesn't work in safe mode)
	if (!ini_get('safe_mode')) @set_time_limit(120);
	
	// Include some base files
	require_once('trans_constants.php');
	require_once('Clutch.class.php');
?>