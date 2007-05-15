<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
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
		 * public CreateMessage(array $Values)
		 * creates a formated string to send to the socket
		 */
		public function CreateMessage()
		{
			foreach (func_get_args() as $Value)
				$Message .= $this->Serializer->Serialize($Value);
			$PayloadLength = (string) dechex(strlen($Message)+0);
			$Length = str_pad($PayloadLength, 8, '0', STR_PAD_LEFT);
			return $Length.$Message;
		}
	}
?>