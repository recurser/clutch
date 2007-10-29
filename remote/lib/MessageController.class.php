<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
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

		/* public AddFileDetailed((string) $FileOrHash, [(string) $Directory, [(bool) $AutoStart]])
		 * Add a single torrent file via path or file data.
		 * Also allows specification of download directory and/or autostart
		 * Ex. AddFileDetailed('/tmp/torrentfile.torrent', '/home/me/thefolder/', 1)
		 */
		public function AddFileDetailed($FileOrData, $Directory = null, $AutoStart = null)
		{
			$Message = array('addfile-detailed');

			if (is_file($FileOrData))
				$Message[1]['file'] = $FileOrData;
			else
				$Message[1]['data'] = $FileOrData;

			if (!is_null($Directory))
				$Message[1]['directory'] = $Directory;
			if (!is_null($AutoStart))
				$Message[1]['autostart'] = $AutoStart;

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
				)
			);
		}

		/* public AutoStart((bool) $AutoStart)
		 * Toogle automatic starting of torrent files using boolean.  
		 * Ex. AutoStart( 1 )
		 */
		public function SetAutoStart($AutoStart) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('autostart', $AutoStart)
				)
			);
		}

		/* public DefaultDirectory((string) $Directory)
		 * Set the download folder for all torrents started in the future
		 * Ex. DefaultDirectory( '/home/me/thefolder' )
		 */
		public function SetDefaultDirectory($Directory) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('directory', $Directory)
				)
			);
		}

		/* public SetDownloadLimit((int) $Limit)
		 * Set download limit in kbs via integer, where -1 means infinity
		 * Ex. SetDownloadLimit( 123 )
		 */
		public function SetDownloadLimit($Limit)
		{
         	return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('downlimit', $Limit)
				)
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
				)
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
				)
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
				)
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
				)
			);
		}

		/* public GetInfo((array) $Id, [(array) $Type])
		 * Get info on the torrent IDs listed in $Id
		 * Specify info wanted by $Type
		 * Ex. GetInfo(4)
		 */
		public function GetInfo($Id, $Type = array('hash', 'name'))
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array(
						'get-info',
						array(
							'id' => (array) $Id,
							'type' => (array) $Type
						)
					)
				)
			);
		}

		/* public GetInfoAll((string) $Type, [(string) $Type2, [(string) $Type3...]])
		 * Returns all info on inputed torrent(s). 
		 * Ex. GetInfoAll('name', 'size')
		 */
		public function GetInfoAll()
		{
			$FieldList = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args(); 
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-info-all', $FieldList)
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
				)
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
				)
			);
		}

		/* public GetStatus((int) $Id, [(array) $Type])
		 * 
		 * Ex. GetStatus()
		 */
		public function GetStatus($Id, $Type = array('state', 'eta'))
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array(
						'get-status',
						array(
							'id' => (array) $Id,
							'type' => (array) $Type
						)
					)
				)
			);
		}

		/* public GetStatusAll((string) $Type1, [(string) $Type2, [(string) $Type3, ...]])
		 * Same as GetStatus with all torrent IDs specified.
		 * Ex. GetStatusAll('state', 'size')
		 */
		public function GetStatusAll()
		{
			$FieldList = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args(); 
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-status-all', $FieldList)
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
				)
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
				)
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
				)
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
				)
			);
		}

		/* public SetPex((bool) $Pex)
		 * Toogle automatic starting of torrent files using boolean.  
		 * Ex. SetPex( 1 )
		 */
		public function SetPex($Pex)
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('autostart', $Pex)
				)
			);
		}

		/* public SetPort((int) $Port)
		 * Set port to use. Port is an integer between 0 and 65535. 
		 * Ex. SetPort( 54321 )
		 */
		public function SetPort($Port) 
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('port', $Port)
				)
			);
		}

		/* public RemoveTorrents((string) $Id1, [(string) $Id2, [(string) $Id3, ...]])
		 * Remove torrent from the daemon via list of id's. 
		 * Ex. RemoveTorrents(6, 14)
		 */
		public function RemoveTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
			
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('remove', $Torrents)
				)
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
				)
			);

		}

		/* public StartTorrents((string) $Id1, [(string) $Id2, [(string) $Id3, ...]])
		 * Start a torrent(s) in the daemon via list of id's. 
		 * Ex. StartTorrents(1, 7)
		 */
		public function StartTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
		
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('start', $Torrents)
				)
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
				)
			);

		}

		/* public StopTorrents((string) $Id1, [(string) $Id2, [(string) $Id3, ...]])
		 * Stop a torrent(s) in the daemon via list of id's. 
		 * Ex. StopTorrents(4)
		 */
		public function StopTorrents()
		{
			$Torrents = (is_array(func_get_arg(0))) ? func_get_arg(0) : func_get_args();
	
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('stop', $Torrents)
				)
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
				)
			);

		}

		/* public SetUploadLimit((int) $Limit)
		 * Set global upload limit in kbs via integer, where -1 means infinity
		 * Ex. SetUploadLimit( 123 )
		 */
		public function SetUploadLimit($Limit)
		{
         	return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('uplimit', $Limit)
				)
			);
		}

		/* public GetEncryption()
		 * Get Encryption status. Returns as "preferred" or "required"
		 * Ex. GetPex()
		 */
		public function GetEncryption()
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('get-encryption', '')
				)
			);
		}

		/* public SetEncryption((string) $Encryption)
		 * Set encryption to either "required" or "preferred" 
		 * Ex. SetEncryption( "required" )
		 */
		public function SetEncryption($Encryption)
		{
			return $this->Controller->Send(
				$this->Controller->IPCProtocol->CreateMessage(
					array('encryption', $Encryption)
				)
			);
		}
	}
?>