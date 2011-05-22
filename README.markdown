**Clutch has now been integrated into the [Transmission project](http://transmissionbt.com). The code is now hosted on in official Transmission svn repository, and further development will be done from there. This repository targets Transmission 1.2.2 and below only.**


What Is Clutch?
===============

Clutch is a WebUI for the [Transmission BitTorrent client](http://transmissionbt.com).
It allows you to manage your torrents from anywhere you can access the internet, and runs on OS X and various flavors of *nix.

Clutch provides most of the basic features of the desktop client, including torrent upload, torrent start/stop, file path selection, speed limiting etc.

The Web interface back-end is written in PHP, with an HTML and JavaScript (AJAX) front-end.
There is a native cocoa [Clutch.app package](http://clutchbt.com/Files/Clutch-0.4.zip) available for OS X that provided a one-click method of managing Transmission torrents over the web.

![Screenshot](http://recursive-design.com/images/projects/clutch/WebGeneral.png)


The Clutch team
---------------

* [Malcolm Jarvis](http://nilok.ca) -- Project Leader, PHP Library
* [Kendall Hopkins](http://softwareelves.com) -- Cocoa Interface
* [Dave Perrett](http://recurser.com) -- AJAX Interface


Getting Started
===============


Installation (OS X)
-------------------

* Download Clutch.app [from here](http://clutchbt.com/Files/Clutch-0.4.zip).
* Unzip.
* Copy Clutch to your Applications folder.
* Done!


Starting Clutch (OS X)
----------------------

* Start Transmission.app and Clutch.app (you can start them in either order, but the WebUI won't be available until ''both'' are running).
* Clutch will put a new menu item in your top menu bar. All the relevant server-side options can be set here:<br/>
  ![Options](http://recursive-design.com/images/projects/clutch/DesktopMenu.png)
* Select ''Open URL'' to open up the Clutch WebUI in your browser. If your browser can't display the page, your ports may be blocked - try changing the IP address in the address bar to http://127.0.0.1:9091/ .
* If you want to alter any of the settings, there are various preferences available from the menu:<br/>
  ![Preferences](http://recursive-design.com/images/projects/clutch/DesktopPrefs.png)


Installation (Linux)
--------------------

* You will need a few things installed first, notably:
  * A web server running PHP5.2+ (Apache & lighttpd have been tested but any php5.2+-capable webserver should work)
  * The JSON extension for PHP
  * The socket extension for PHP
  * Transmission Daemon (there are various packages floating around for different linux distributions, or alternatively you can build it yourself)
* Download the [Clutch Web UI](http://clutchbt.com/Files/Clutch-0.4.tar.gz) bundle, unpack it and put it somewhere inside your web server's document root (for example in */var/www/clutch* for a typical Ubuntu installation).
* Edit the *remote/data/socket.txt* file in your WebUI folder, making sure it points to the location of your transmission-daemon socket file (this can vary depending on your linux distribution and the package you installed - for ubuntu the default location is */home/[your user name]/.transmission/daemon/socket*).
* Make sure the socket file is readable and writable by the web server (_chmod -R 777 ~/.transmission/daemon/socket_ for Ubuntu - the location may vary with other distributions).
* Make sure the *remote/data/* folder and it's contents are readable and writable by the web server (*chmod -R 777 /var/www/clutch/remote/data*). Your preferences will be stored here.
* Make sure the folder you intend to download to is readable and writable by the web server (*chmod -R 777 path/to/your/download/folder/*).

If you are after more detailed instructions, there are a couple of nice walk-throughs available:

* [Installing Transmission with Clutch WebUI](http://www.mybook-linux.co.nr/transmission.html)
* [Transmission Clutch HowTo](http://synology.nas-central.org/index.php/Transmission_Clutch_HowTo)

There is an Ubuntu package in the works as well which will allow 1-click install for Ubuntu users - more details as they emerge.


Starting Clutch (Linux)
-----------------------

Start the daemon and web server up and navigate to the location where you installed the WebUI in your browser (eg http://localhost/transmission/).


Web UI
------

* OS X users will be prompted for a password when they first open Clutch (Linux users will need to use a *.htaccess* file to control access). The default user/pass is admin/password. This can be changed in Clutch.app's preferences.
* The web application works in much the same way as the desktop client, with a few limitations. It is designed to be as similar as possible to the desktop experience, so things like arrow key scrolling, Apple-select for selecting multiple torrents etc are provided:<br/>
  ![Interface](http://recursive-design.com/images/projects/clutch/WebGeneral.png)
* Preferences, transfer rate control and torrent sorting can be accessed via the menu button on the bottom left of the screen:<br/>
  ![preferences](http://recursive-design.com/images/projects/clutch/WebFooterMenu.png)
* The remote download folder, port etc can be set in the preferences:
  ![Preferences](http://recursive-design.com/images/projects/clutch/WebPreferences.png)
* Each torrent also has it's own individual menu to pause/resume/delete individual torrents or groups of torrents (Opera doesn't support this):<br/>
  ![Context Menu](http://recursive-design.com/images/projects/clutch/WebContextMenu.png)


Frequently Asked Questions
==========================


Why don't my downloaded torrents appear in the Transmission.app desktop client?
-------------------------------------------------------------------------------

Clutch has only recently been able to interact with the Transmission.app desktop client - it is recommended that you run Transmission >= 1.04 and Clutch >= 0.4. If you are running either version prior to these, you may have problems getting the two applications to interact.


Where can I download Clutch?
----------------------------

OS X and web-only bundles are available from [clutchbt.com](http://clutchbt.com/) 


What browsers does Clutch support?
----------------------------------

Clutch has been tested on Safari, Firefox & Opera. Other browsers (konqueror etc) may or may not work. Internet Explorer is not supported.


What operating systems does Clutch support?
-------------------------------------------

Clutch works on OS X 10.4+, and should work on any linux distribution that can run the Transmission daemon and a web server with PHP5+.


Why doesn't Clutch list my torrents from Transmission.app?
----------------------------------------------------------

You're more than likely running older versions of one or both applications. It's recommended that you run at least Transmission 1.04 and Clutch 0.4. If you're running a GTK GUI build of Transmission on linux, you are probably missing the ability to interact with Clutch - we hope to get the linux version working properly at some point but there may be intermittent problems in the meantime.


What ports do i need to forward?
---------------------------------

There are 2 ports you need to forward:

* The web server port in the Clutch.app preferences:<br/>
  ![Desktop Preferences](http://recursive-design.com/images/projects/clutch/DesktopPrefs.png)
* The bittorrent port in the web interface preferences:<br/>
  ![Web Preferences](http://recursive-design.com/images/projects/clutch/WebPreferences.png)

In the example above you'd access the web interface on http://your.ip:9091/, and bittorrent traffic would hit your machine on port 28456. You can set either of these ports to whatever you want.


*The daemon does not appear to be running* error on Linux
---------------------------------------------------------

The web server can't read the path you've put in *remote/data/socket.txt* for some reason. Make sure the path you've put in *remote/data/socket.txt* actually exists, and is readable by the webserver. 

* Make sure the socket file is readable and writable by the web server (*chmod -R 777 ~/.transmission/daemon/socket* for Ubuntu - the location may vary with other distributions).
* Make sure the *remote/data/* folder and it's contents are readable and writable by the web server (*chmod -R 777 /var/www/clutch/remote/data*).
* Make sure the folder you intend to download to is readable and writable by the web server (*chmod -R 777 path/to/your/download/folder/*).


*Could not connect to the server* error on Linux
------------------------------------------------

More than likely you have either a PHP error or a permissions error. The *Details* button should give you some clues. The most common reason for this error is that your PHP install is lacking either the JSON extension or the socket extension, or your permissions are incorect (see the previous question)


How can I password-protect Clutch on Linux?
-------------------------------------------

You have to set up a [.htaccess file](http://httpd.apache.org/docs/1.3/howto/htaccess.html) in the Clutch web directory.


How can I schedule torrents in Clutch?
--------------------------------------

Clutch does not currently support scheduling, although it may in the future.


My linux GUI version of Transmission won't communicate with Clutch!
-------------------------------------------------------------------

Clutch is currently only guaranteed to work with either the daemon on *nix systems, or the OS X Transmission.app client. The GTK GUI version of Transmission does not yet contain enough functionality to work 100% with Clutch, although you may get limited functionality.


Clutch on OS X has stopped working since i upgraded from the daemon-compatible version to the Transmission.app-compatible version
---------------------------------------------------------------------------------------------------------------------------------

It has been reported that Clutch may have problems communicating with Transmission.app after an upgrade from version 0.1. If this is the case, using [AppZapper](http://appzapper.com/) to remove both Clutch.app and Transmission.app is reported to fix the problem.


How can I turn on debugging?
----------------------------

Assuming you have Clutch in the */Applications/* folder, open a terminal and cd into */Applications/Clutch.app/Contents/Resources/binary/web/remote*. Edit the *TransmissionController.class.php* file and change a couple of the lines near the top (around line 17)

```php
public $Debug = false;
public $DebugToLogFile = false;
```

to 

```
public $Debug = true;
public $DebugToLogFile = true;
```

It should dump some logging info into */Applications/Clutch.app/Contents/Resources/binary/web/remote/data/debug.log*

These paths will obviously differ on linux, but the basic process is the same.


How can I get the source code?
------------------------------

See the _Development_ section. If you want to mess about with the PHP/JavaScript code, look in *Applications/Clutch.app/Contents/Resources/binary/web/* on OS X (if you are on linux, you probably already know where the PHP code is). Feel free to forward any patches or suggestions back to the developers.


How can I help?
---------------

See the _Development_ section. If you're good at Cocoa, PHP, or AJAX/jScript and are interested in working on Clutch drop us a line. We're also desperate to get some decent documentation going, so if you are good at writing HOW-TOs please get in touch. 


Its not working!
----------------

Hit the #transmission channel on irc.freenode.net and look for softwareelves or gimp :)


Development
===========

Getting the Source
------------------

If you'd like to stay on top of Clutch's development, our source code is available via git.

To get the source for the Cocoa Front-end, AJAX front-end and php libraries:

```bash
> git clone git://github.com/recurser/clutch.git
```


Contributing
------------

If you have some ideas or features you'd like to contribute, feel free to email [Malcolm](mailto:Gimp@nilok.ca), [Ken](mailto:SoftwareElves@gmail.com) or [Dave](mailto:mail@recursive-design.com) to find out how you can help.


Getting Help
============

IRC Support is provided through the #transmission channel on irc.freenode.net

Forum Support is provided through the [Transmission forums](http://forum.transmissionbt.com) under the "Clutch" sub-forum.

