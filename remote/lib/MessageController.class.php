<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	class MessageController
	{
		private $Controller;

		public function __construct($ControllerClass)
		{
			$this->Controller = $ControllerClass;
			$this->KeepAlive();
		}

		/* public AddFiles((string) $file1, [(string) $file2, [(string) $file3, ...]])
		 * Add torrent files to the daemon via list. 
		 * Each file must contain an absolute path to the .torrent
		 * Ex. AddFiles ('/tmp/torrentFile.torrent', '/tmp/torrentFile2.torrent')
		 */
		public function AddFiles()
		{
			$Message = array('addfiles', func_get_args());

			return $this->Controller->Send($this->Controller->IPCProtocol->CreateMessage($Message));
		}

		/* public AddFileDetailed((string) $FileOrHash, [(string) $directory, [(bool) $autostart]])
		 * Add a single torrent file via path or file data.
		 * Also allows specification of download directory and/or autostart
		 * Ex. AddFileDetailed('/tmp/torrentfile.torrent', '/home/me/thefolder/', 1)
		 */
		public function AddFileDetailed($FileOrData, $directory = null, $autostart = null)
		{
			$Message = array('addfile-detailed');

			if (is_file($FileOrData))
				$Message[1]['file'] = $FileOrData;
			else
				$Message[1]['data'] = $FileOrData;

			if (!is_null($directory))
				$Message[1]['directory'] = $directory;
			if (!is_null($autostart))
				$Message[1]['autostart'] = $autostart;

			return $this->Controller->Send($this->Controller->IPCProtocol->CreateMessage($Message));
		}

		/* public AutoMap((bool) $automap)
		 * Toogle automatic port mapping using boolean.  
		 * Ex. AutoMap( 1 )
		 */
		public function AutoMap($automap)
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('automap', $automap)
				),
				false
			);
		}
		
		/* public AutoStart((bool) $autostart)
		 * Toogle automatic starting of torrent files using boolean.  
		 * Ex. AutoStart( 1 )
		 */
		public function AutoStart($autostart) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('autostart', $autostart)
				),
				false
			);
		}

		/* public DefaultDirectory((string) $directory)
		 * Set the download folder for all torrents started in the future
		 * Ex. DefaultDirectory( '/home/me/thefolder' )
		 */
		public function DefaultDirectory($directory) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('directory', $directory)
				),
				false
			);
		}
		
		/* public SetDownloadLimit((int) $limit)
		 * Set download limit in kbs via integer, where -1 means infinity
		 * Ex. SetDownloadLimit( 123 )
		 */
		public function SetDownloadLimit($limit)
		{
         	return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('downlimit', $limit)
				),
				false
			);
		}
		
		/* public GetAutoMap()
		 * Get automatic mapping status. Returns as 0 (off) or 1 (on).
		 * Ex. GetAutoMap()
		 */
		public function GetAutoMap()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-automap', '')
				),
				true
			);
		}
		
		/* public GetAutoStart()
		 * Get automatic starting status. Returns as 0 (off) or 1 (on).
		 * Ex. GetAutoStart()
		 */
		public function GetAutoStart()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-autostart', '')
				),
				true
			);
		}
		
		/* public GetDefaultDirectory()
		 * Get the default folder that all new torrents are saved in. Returns absolute path as string.
		 * Ex. GetDefaultDirectory()
		 */
		public function GetDefaultDirectory()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-directory', '')
				),
				true
			);
		}
		
		/* public GetDownloadLimit()
		 * Get the global download limit.  
		 * Returns as integer, where -1 means infinity.
		 * Ex. GetDownloadLimit()
		 */
		public function GetDownloadLimit()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-downlimit', '')
				),
				true
			);
		}
		
		/* public GetInfo((array) $id, [(array) $type])
		 * Get info on the torrent IDs listed in $id
		 * Specify info wanted by $type
		 * Ex. GetInfo(4)
		 */
		public function GetInfo($id, $type = array('hash', 'name'))
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array(
						'get-info',
						array(
							'id' => (array) $id,
							'type' => (array) $type
						)
					)
				),
				true
			);
		}
		
		/* public GetInfoAll((string) $type, [(string) $type2, [(string) $type3...]])
		 * Returns all info on inputed torrent(s). 
		 * Ex. GetInfoAll('name', 'size')
		 */
		public function GetInfoAll()
		{
			$field_list = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args(); 
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-info-all', $field_list)
				)
			);
		}
		
		/* public GetPex()
		 * Get Peer Exchange status. Returns as 0 (off) or 1 (on).
		 * Ex. GetPex()
		 */
		public function GetPex()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-pex', '')
				),
				true
			);
		}
		
		/* public GetPort()
		 * Get port number. Returns as integer.
		 * Ex. GetPort()
		 */
		public function GetPort()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-port', '')
				),
				true
			);
		}
		
		/* public GetStatus((int) $id, [(array) $type])
		 * 
		 * Ex. GetStatus()
		 */
		public function GetStatus($id, $type = array('state', 'eta'))
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array(
						'get-status',
						array(
							'id' => (array) $id,
							'type' => (array) $type
						)
					)
				),
				true
			);
		}
		
		/* public GetStatusAll((string) $type1, [(string) $type2, [(string) $type3, ...]])
		 * Same as GetStatus with all torrent IDs specified.
		 * Ex. GetStatusAll('state', 'size')
		 */
		public function GetStatusAll()
		{
			$field_list = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args(); 
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-status-all', $field_list)
				)
			);
		}
		
		/* public GetSupport((string) $key1, [(string) $key2, [(string) $key3, ...]])
		 * Get a support message for each torrent via key.
		 * Ex. GetSupport('ihavenoideawhatakeylookslike1', 'ihavenoideawhatakeylookslike2')
		 */
		public function GetSupport()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-supported', func_get_args())
				),
				true
			);
		}
		
		/* public GetUploadLimit()
		 * Get the global upload limit. 
		 * Returns as integer, where -1 means infinity.
		 * Ex. GetUploadLimit()
		 */
		public function GetUploadLimit()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-uplimit', '')
				),
				true
			);
		}
		
		/* public LookupTorrents((string) $hash1, [(string) $hash2, [(string) $hash3, ...]])
		 * Lookup torrent via hash. Returns info message with id and hash keys. 
		 * Ex. AddFiles('a822566542550f83a0106be7833dec98b50509bd')
		 */
		public function LookupTorrents()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('lookup', func_get_args())
				)
			);
		}

		/* public KeepAlive()
		 * Keep the connection alive.
		 * Ex. KeepAlive()
		 */
		public function KeepAlive()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('noop', '')
				),
				false
			);
		}

		/* public NotSupported()
		 * Tells daemon something wasn't supported.
		 * Ex. NotSupported()
		 */
		public function NotSupported()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('not-supported', '')
				),
				false
			);
		}
		
		/* public SetPex((bool) $pex)
		 * Toogle automatic starting of torrent files using boolean.  
		 * Ex. SetPex( 1 )
		 */
		public function SetPex($pex) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('autostart', $pex)
				),
				false
			);
		}
		
		/* public SetPort((int) $port)
		 * Set port to use. Port is an integer between 0 and 65535. 
		 * Ex. SetPort( 54321 )
		 */
		public function SetPort($port) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('port', $port)
				),
				false
			);
		}

		/* public RemoveTorrents((string) $id1, [(string) $id2, [(string) $id3, ...]])
		 * Remove torrent from the daemon via list of id's. 
		 * Ex. RemoveTorrents(6, 14)
		 */
		public function RemoveTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('remove', $Torrents)
				),
				false
			);

		}
		
		/* public RemoveAllTorrents()
		 * Remove every torrent from the daemon. 
		 * Ex. RemoveAllTorrents()
		 */
		public function RemoveAllTorrents()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('remove-all', '')
				),
				false
			);

		}
		
		/* public StartTorrents((string) $id1, [(string) $id2, [(string) $id3, ...]])
		 * Start a torrent(s) in the daemon via list of id's. 
		 * Ex. StartTorrents(1, 7)
		 */
		public function StartTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
		
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('start', $Torrents)
				),
				false
			);

		}
		
		/* public StartAllTorrents()
		 * Starts all torrents in the daemon. 
		 * Ex. StartAllTorrents()
		 */
		public function StartAllTorrents()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('start-all', '')
				),
				false
			);

		}

		/* public StopTorrents((string) $id1, [(string) $id2, [(string) $id3, ...]])
		 * Stop a torrent(s) in the daemon via list of id's. 
		 * Ex. StopTorrents(4)
		 */
		public function StopTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
	
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('stop', $Torrents)
				),
				false
			);

		}
		
		/* public StopAllTorrents()
		 * Stops all torrents in the daemon. 
		 * Ex. StopAllTorrents()
		 */
		public function StopAllTorrents()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('stop-all', '')
				),
				false
			);

		}
		
		/* public SetUploadLimit((int) $limit)
		 * Set global upload limit in kbs via integer, where -1 means infinity
		 * Ex. SetUploadLimit( 123 )
		 */
		public function SetUploadLimit($limit)
		{
         	return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('uplimit', $limit)
				),
				false
			);
		}      
	}
?>