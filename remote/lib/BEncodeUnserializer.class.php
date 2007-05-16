<?php

	/*
	 *	Copyright © Malcolm Jarvis and Kendall Hopkins
	 *	This code is licensed under the Creative Commons Attribution-NonCommercial-ShareAlike 3.0 license.
	 *	For more details, see http://creativecommons.org/licenses/by-nc-sa/3.0/
	 */

	class BEncodeUnserializer
	{
		private $_source = ''; //Source string
		private $_source_length = 0; //Source length
		private $_position = 0; //Current position of the string
	
		/**
		* Decode a Bencoded string
		*
		* @param string
		* @return mixed
		*/
		public function Unserialize($str)
		{
			$this->_source = $str;
			$this->_position  = 0;
			$this->_source_length = strlen($this->_source);
			return $this->_bDecode();
		}

		private function _bDecode()
		{
			switch ($this->_getChar()) {
			case 'i':
				$this->_position++;
				return $this->_decode_int();
				break;
			case 'l':
				$this->_position++;
				return $this->_decode_list();
				break;
			case 'd':
				$this->_position++;
				return $this->_decode_dict();
				break;
			default:
				return $this->_decode_string();
			}
		}
		
		private function _decode_dict()
		{
			while ($char = $this->_getChar()) {
				if ($char == 'e') break;
				$key = $this->_decode_string();
				$val = $this->_bDecode();
				$return[$key] = $val;
			}
			$this->_position++;
			return $return;
		}
	
		private function _decode_string()
		{
			if(!$pos_colon = @strpos($this->_source, ':', $this->_position))
				return false;
			$str_length = intval(substr($this->_source, $this->_position, $pos_colon)); // Get length of string
			$return = substr($this->_source, $pos_colon + 1, $str_length); // Get string
			$this->_position = $pos_colon + $str_length + 1; // Move Pointer after string
			return $return;
		}
	
		private function _decode_int()
		{
			$pos_e  = strpos($this->_source, 'e', $this->_position);
			$return = floatval(substr($this->_source, $this->_position, $pos_e - $this->_position));
			$this->_position = $pos_e + 1;
			return $return;
		}
	
		private function _decode_list()
		{
			$return = array();
			$char = $this->_getChar();
			while ($this->_source{$this->_position} != 'e') {
				$val = $this->_bDecode();
				$return[] = $val;
			}
			$this->_position++;
			return $return;
		}
	
		private function _getChar()
		{
			if (empty($this->_source)) return false;
			if ($this->_position >= $this->_source_length) return false;
			return $this->_source{$this->_position};
		}
	}
?>