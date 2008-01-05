<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the GPL version 2.
	 *	For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html
	 */

	class IPCProtocol
	{
		public $Serializer;
		public $UnSerializer;

		public function __construct()
		{
			$this->Serializer = new BEncodeSerializer;
			$this->UnSerializer = new BEncodeUnSerializer;
		}

		/*
		 * public CreateMessage(mixed $Value)
		 * creates a formated string to send to the socket
		 */
		public function CreateMessage($Value)
		{
			array_push($Value, time());
			$Message = $this->Serializer->Serialize($Value);

			$PayloadLength = (string) dechex(strlen($Message)+0);
			$Length = str_pad($PayloadLength, 8, '0', STR_PAD_LEFT);
			return $Length.$Message;
		}
	}
?>