var noojeeClick = {};


(function() 
{
	// for debugging as we can't use njdebug during the initialisation.
	var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        .getService(Components.interfaces.nsIConsoleService);

//passwordManager: Components.classes["@mozilla.org/login-manager;1"]
//	.getService(Components.interfaces.nsIPrefService),

	var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",  
                                              Components.interfaces.nsILoginInfo,  
                                              "init");  
	var nsLoginManager = Components.classes["@mozilla.org/login-manager;1"].  
                           getService(Components.interfaces.nsILoginManager);  

	var url =  "chrome://noojeeclick";


        
	// Registration
	var namespaces = [];


	function setValue(key, value)
	{
		var prefObj = Components.classes["@mozilla.org/preferences-service;1"]
		        .getService(Components.interfaces.nsIPrefService);
		var Branch = prefObj.getBranch("extensions.noojeeclick.");
	
		if (typeof value == 'boolean')
			Branch.setBoolPref(key, value);
		else
			Branch.setCharPref(key, value);
	};

	/* Used to support the above function onConfigurationLoad.
	 * This method is an intentional duplication of noojeeClick.util.getBoolValue
	 */
	function getBoolValue (key)
	{
		try
		{
			var value = null;
			var prefObj = Components.classes["@mozilla.org/preferences-service;1"]
			        .getService(Components.interfaces.nsIPrefService);
			var Branch = prefObj.getBranch("extensions.noojeeclick.");
			var defaultBranch = prefObj.getDefaultBranch("extensions.noojeeclick.");
			value = Branch.getBoolPref(key);
		}
		catch (e)
		{
			// ignored as just means that key doesn't exist.
		}

		return value;
	};
	
	function getValue(key)
	{
		var value = null;
		try
		{
			var prefObj = Components.classes["@mozilla.org/preferences-service;1"]
			        .getService(Components.interfaces.nsIPrefService);
			var Branch = prefObj.getBranch("extensions.noojeeclick.");
			value = Branch.getCharPref(key);
		}
		catch (e)
		{
			// ignored as it probably means that this preference hasn't been set.
		}
		return value;
	};

	// duplicate of njdebug so we can still output debug messages during initilisation.
	// We can't call the normal njdebug until the namespaces are all setup.	
	function ns_debug(module, msg)
	{
		if (getBoolValue("enableDebugging") == true)
		{
			var filter = getValue("debugFilter");
	
			if (filter.search(module, "i") >= 0)
			{
				var now = new Date();
				var hour = now.getHours();
				var min = now.getMinutes();
				var sec = now.getSeconds();
				var mil = now.getMilliseconds();
				// for debugging as we can't use njdebug during the initialisation.
				var consoleService = Components.classes["@mozilla.org/consoleservice;1"]
        			.getService(Components.interfaces.nsIConsoleService);
				
				consoleService.logStringMessage(hour + ":" + min + ":" + sec + ":" + mil+ " debug (" + module + "): " + msg);
			}
		}
	};


	/*
	 * set a boolean noojee click preference. 
	 */
	function setBoolValue (key, value)
	{
		var prefObj = Components.classes["@mozilla.org/preferences-service;1"]
		        .getService(Components.interfaces.nsIPrefService);
		var Branch = prefObj.getBranch("extensions.noojeeclick.");
	
		Branch.setBoolPref(key, value);
	};
	
	this.ns = function(fn) 
	{
	    var ns = {};
	    namespaces.push(fn, ns);
	
	    return ns;
	};

	this.onPageLoad = function(event)
	{
		noojeeClick.noojeeclick.onPageLoad(event);
	};

	this.onRefresh = function()
	{
		noojeeClick.render.onRefresh();
	};
	
	this.showMenuHideItems = function()
	{
		noojeeClick.noojeeclick.showMenuHideItems();
	};
	
	
	function PrefListener(branchName, func)
	{
		var prefService = Components.classes["@mozilla.org/preferences-service;1"]
		        .getService(Components.interfaces.nsIPrefService);
		var branch = prefService.getBranch(branchName);
		branch.QueryInterface(Components.interfaces.nsIPrefBranch2);
	
		this.register = function()
		{
			branch.addObserver("", this, false);
			branch.getChildList("",
			{}).forEach( function(name)
			{
				func(branch, name);
			});
		};
	
		this.unregister = function unregister()
		{
			if (branch)
				branch.removeObserver("", this);
		};
	
		this.observe = function(subject, topic, data)
		{
			if (topic == "nsPref:changed")
				func(branch, data);
		};
	};
	
	
	// Initialization
	this.initialize = function() 
	{
		try
		{
		    for (var i=0; i<namespaces.length; i+=2) 
		    {
		        var fn = namespaces[i];
		
		        var ns = namespaces[i+1];
		        fn.apply(ns);
		    }
		    
		    // Noojee Click specific initialisation
			var myListener = new PrefListener("extensions.noojeeclick.", function(branch, name)
			{
				switch (name)
				{
					case "pattern":
						noojeeClick.onRefresh();
						break;
				}
			});
			myListener.register();
	
	
			// On first run check the preferences for a password
			// and move it into the store.
			// This works for both existing installs and custom
			// builds where we ship the password in the defaults.
			if (getBoolValue("firstrun") == true
			|| getBoolValue("firstrun") == null)
			{
				var password = getValue("password");
				var username = getValue("username");
				var host = getValue("host");
				
				if (password != null && password.length > 0)
				{
					storeCredentials(host, username, password);
					// clear the password out of the defaults.
					setValue("password", "");
				}
				
				setBoolValue("firstrun", false);
			}
			
			// Hook the page load event
			var appcontent = window.document.getElementById("appcontent");
			if (appcontent != undefined && appcontent != null)
				appcontent.addEventListener("DOMContentLoaded", noojeeClick.onPageLoad, false);
	
			// Add a context menu handler so we can dynamically show/hide specific menu items.
			var contextMenu = document.getElementById("contentAreaContextMenu");
			if (contextMenu)
				contextMenu.addEventListener("popupshowing", noojeeClick.showMenuHideItems, false);
		}
		catch (e)
		{	
			alert("Noojee Click error in init" + e);
		}
	};
	
	
	// Clean up
	this.shutdown = function() 
	{
	    window.removeEventListener("load", noojeeClick.initialize, false);
	    window.removeEventListener("unload", noojeeClick.shutdown, false);
	};

	function getObjectClass(obj)
	{
		if (obj && obj.constructor && obj.constructor.toString)
		{
			var arr = obj.constructor.toString().match(/function\s*(\w+)/);
	
			if (arr && arr.length == 2)
			{
				return arr[1];
			}
		}
	
		return undefined;
	};
	
	
	
	this.getUsername = function ()
	{
		return getValue("username");
	};
	
	
	this.storeCredentials = function (hostname, username, password)
	{
		storeCredentials(hostname, username, password);
	}
	
	function storeCredentials(hostname, username, password)
	{
		var newLoginInfo = new nsLoginInfo(hostname,  
	                       url, null, // 'Asterisk Auth',  
	                       username, password, "", "");
		var existingLoginInfo = findCredentials(hostname, username);
		if (existingLoginInfo != null)	                       
	    	nsLoginManager.removeLogin(existingLoginInfo); 
		nsLoginManager.addLogin(newLoginInfo);  
	};

	/*
	** returns the login object for the given hostname/username combination if it exists.
	** If the credential doesn't exist then null is returned.
	** The hostname should the ip address/hostname of the asterisk server as
	** it appears in the configuration dialog.
	*/
	function findCredentials(hostname, username)
	{
	    // Find users for the given parameters  
	    var logins = nsLoginManager.findLogins({}, hostname, url, null);
	    
	    ns_debug("config", "retrieveCredentials login=" + logins);  
	         
	    var login = null;
	    
	    // Find user from returned array of nsILoginInfo objects  
	    for (var i = 0; i < logins.length; i++) 
	    {  
	    	ns_debug("config", "login=" + logins[i].username);
	       if (logins[i].username == username) 
	       {  
	          login = logins[i];  
	          break;  
	       }  
	    } 
	    return login;
	};
	
	
	this.retrieveCredentials = function(hostname, username)
	{
		return retrieveCredentials (hostname, username);
	}
	

	/*
	** returns the password for the given hostname/username combination
	** The hostname should the ip address/hostname of the asterisk server as
	** it appears in the configuration dialog.
	*/
	function retrieveCredentials (hostname, username)
	{
		var password = null;
		var login = findCredentials(hostname, username);
		
		if (login != null)
			password = login.password;
			
		return password;
	};
	
	
	/*
	 * This method doesn't really belong here, unfortunately this method is used
	 * from configuration.xul and configuration.xul doesn't like initialising the
	 * name space. I believe that a xul windows is just like another browser
	 * instance and so the namespace has to be loaded.
	 * My best guess is that the eventListeners (at the bottom of this class)
	 * aren't being called.
	 */ 
	this.onConfigurationLoad = function ()
	{
  		var tabBox = window.document.getElementById('njConfigTabbox');
 		var asteriskTab = tabBox.tabs.getItemAtIndex(3);
 		
	
		// Check if we need to disable the asterisk tab 
	 	if (getBoolValue("tab.asterisk.enabled") == false)
	 	{
	 		ns_debug("config", "asterisk tab disabled");
	  		asteriskTab.disabled = true;
	 		asteriskTab.collapsed = true;
	 	}	
	 	else
	 		ns_debug("config", "asterisk tab enabled");
	 		
	 	 		
 		// retrieve the password
 		var password = this.retrieveCredentials(getValue("host"), this.getUsername());
 		var passwordField = window.document.getElementById('njcPassword');
 		passwordField.value = password;
 	};

	this.onConfigurationClosed = function ()
	{
		try
		{
			ns_debug("config", "onConfigurationClosed called");
			var hostField = window.document.getElementById('host');
			var usernameField = window.document.getElementById('username');
			var passwordField = window.document.getElementById('njcPassword');
		
			this.storeCredentials(hostField.value
				, usernameField.value
				, passwordField.value);
		}
		catch (e)
		{
			ns_debug("config", "Exception: " + e);
		}
	    return false;
	};
	

	
	
	// Register handlers to maintain extension life cycle.
	window.addEventListener("load", noojeeClick.initialize, false);
	window.addEventListener("unload", noojeeClick.shutdown, false);
	
}).apply(noojeeClick);


