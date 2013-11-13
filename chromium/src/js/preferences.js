/**
 * Copyright 2012 Sven Werlen
 *
 * This file is part of Noojee Click.
 * 
 * Noojee Click is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the 
 * Free Software Foundation, either version 3 of the License, or (at your 
 * option) any later version.
 * 
 * Noojee Click is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY 
 * or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License 
 * for more details.
 * 
 * You should have received a copy of the GNU General Public License along 
 * with Noojee Click. If not, see http://www.gnu.org/licenses/.
 **/


/**
 * Initializes localStorage with default values
 * (required by js/noojee/defaults/preferences/preferences.js)
 **/
function pref(key, value) 
{
	// For compatibility with the Firefox version we strip the key prefix.
	if (key.indexOf("extensions.noojeeclick.") == 0)
		key = key.substring(23);
	
	// check that value is not already set
	if( !localStorage[key] ) 
	{
		localStorage[key] = value;
	}
}