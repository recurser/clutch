//
//  MainController.m
//  Clutch
//
//  *
//	*	Copyright ¬© Kendall Hopkins
//  *      This code is licensed under the GPL version 2. 
//  *      For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html 
//	*

#import "MainController.h"
#import "PrefController.h"
#import "GlobalConstants.h"
#include <signal.h>
#import "third-party/UKKQueue/UKKQueue.h"


@interface MainController (Private)

PrefController    *preferencesController;
NSTask                         *lighttpd;
NSTask                          *openssl;
NSMenuItem         *clutchStatusMenuItem;
NSMenuItem   *openWebUIInBroswerMenuItem;
bool                transmissionDetected;

- (void) setUpStatusItem;
- (void) menuIconUpdate;

- (void) registerDefaults;
- (void) readDefaults;
- (void) updateSocketLocation;

- (void) generateLighttpdConf;
- (void) generateSll;

- (void) killOldProcesses;
- (bool) killPidFromFile:(NSString*) theFile;
- (void) setWebAuthInfo;

- (void) checkForTransmission;

@end


@implementation MainController

#pragma mark Initialization

- (id) init 
{
	self = [super init];
	if (self != nil) 
	{		
		[[NSApplication sharedApplication] setDelegate: self];
	}
    
    lighttpd = nil;
    openssl = nil;
    
    //this makes sure that no other version of lighttpd get in the way.
    [self killOldProcesses];
    
    [self registerDefaults];
    [self readDefaults];
    [self checkForTransmission];
    [self updateSocketLocation];
    
    //set up file watcher
    [[UKKQueue sharedFileWatcher] setDelegate: self];
    [[UKKQueue sharedFileWatcher] addPath: [@"~/Library/Application Support/Transmission/" stringByExpandingTildeInPath]];
    
	return self;
}

- (void) awakeFromNib
{
	[self setUpStatusItem];
}

#pragma mark Status Item

- (void) setUpStatusItem
{
	statusMenuItem = [[NSStatusBar systemStatusBar] statusItemWithLength: NSSquareStatusItemLength];
	
    [self menuIconUpdate];
    
	[statusMenuItem setHighlightMode: YES];
	[statusMenuItem setTarget: self];
    
	NSMenu* theMenu = [[NSMenu alloc] initWithTitle:@"main"];
	[theMenu setDelegate: self];
    
	[statusMenuItem setMenu: theMenu];
	[statusMenuItem retain];
    [theMenu setAutoenablesItems: NO];
	
    clutchStatusMenuItem = [theMenu addItemWithTitle:@"Loading..." action:nil keyEquivalent:@""];
    [clutchStatusMenuItem setEnabled:NO];
    openWebUIInBroswerMenuItem = [theMenu addItemWithTitle:@"Open URL" action:@selector(openWebUIInBroswer:) keyEquivalent:@""];
	
    [theMenu addItem: [NSMenuItem separatorItem]];
	
    [theMenu addItemWithTitle:@"Preferences..." action:@selector(showPreferences:) keyEquivalent:@""];    
    [theMenu addItemWithTitle:@"Donate" action:@selector(donateUrl:) keyEquivalent:@""];
    [theMenu addItemWithTitle:@"Clutch Homepage" action:@selector(websiteUrl:) keyEquivalent:@""];
	[theMenu addItemWithTitle:@"About Clutch" action:@selector(showAbout:) keyEquivalent:@""];
    
    [theMenu addItem: [NSMenuItem separatorItem]];
    [theMenu addItemWithTitle:@"Quit" action:@selector(terminate:) keyEquivalent:@""];
}

- (void) menuIconUpdate
{
    NSImage* menuIcon;
    NSImage* menuIconSelected;
    
    if ( transmissionDetected && [lighttpd isRunning] )
    {
        menuIcon = [NSImage imageNamed:@"Menubar-On.png"];
        menuIconSelected = [NSImage imageNamed:@"Menubar-On-Clicked.png"];
    }
    else
    {
        menuIcon = [NSImage imageNamed:@"Menubar-Off.png"];
        menuIconSelected = [NSImage imageNamed:@"Menubar-Off-Clicked.png"];
    }
    
	[statusMenuItem setImage: menuIcon];
	[statusMenuItem setAlternateImage: menuIconSelected];
}

- (void) menuNeedsUpdate:(NSMenu*)menu
{
    if ( transmissionDetected && [lighttpd isRunning] )
    {
        [openWebUIInBroswerMenuItem setEnabled:true];
        [clutchStatusMenuItem setTitle:@"Transmission Detected..."];
    } else if ( transmissionDetected && ( ! [lighttpd isRunning] ) )
    {
        [openWebUIInBroswerMenuItem setEnabled:false];
        [clutchStatusMenuItem setTitle:@"Loading WebUI..."];
    } else if ( ( ! transmissionDetected ) && [lighttpd isRunning] )
    {
        [openWebUIInBroswerMenuItem setEnabled:false];
        [clutchStatusMenuItem setTitle:@"Closing WebUI..."];
    } else if ( ( ! transmissionDetected ) && ( ! [lighttpd isRunning] ) )
    {
        [openWebUIInBroswerMenuItem setEnabled:false];
        [clutchStatusMenuItem setTitle:@"Idle..."];
    }
}

- (NSApplicationTerminateReply) applicationShouldTerminate:(NSApplication *)sender
{
    //wait to die
    int i = 0;
    int forceTimeOut = 10; //in seconds
    int giveUpTimeOut = 15; //in seconds
    int pollPerSecond = 10; //times to poll per second
    
    while ( [lighttpd isRunning] )
    {
        //if we take longer than 10 sec to quit we send another kill command
        i++;
        if ( i = (forceTimeOut * pollPerSecond) )
        {
            [lighttpd terminate];
        }
        //if that doesn't work we give up
        if ( i >= (giveUpTimeOut * pollPerSecond) )
        {
            return NSTerminateNow; 
        }
        usleep(1000000/pollPerSecond); 
    }
    
    return NSTerminateNow;
}

- (void) showAbout:(id)sender
{
	[[NSApplication sharedApplication] activateIgnoringOtherApps:YES];
	[[NSApplication sharedApplication] orderFrontStandardAboutPanel:self];
}

- (void) donateUrl:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:donateUrlString]];
}

- (void) websiteUrl:(id)sender
{
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:websiteUrlString]];
}

- (void) openWebUIInBroswer:(id)sender
{
    if (preferencesController == nil)
	{
		preferencesController = [[PrefController alloc] init];
	}
    [[NSWorkspace sharedWorkspace] openURL:[NSURL URLWithString:[preferencesController returnUrlLink]]];
}


#pragma mark Preference window

- (void) showPreferences:(id)sender
{
	if (preferencesController == nil)
	{
		preferencesController = [[PrefController alloc] init];
	}
	
	[preferencesController showWindow: self];
	[[NSApplication sharedApplication] activateIgnoringOtherApps: YES];
}

- (void) setLoginItemEnabled:(BOOL)enabled
{
	NSString* myCurrentPath = [[NSBundle mainBundle] bundlePath];
	
	// set up architecture of getting login items
	NSUserDefaults* loginDefaults = [[NSUserDefaults alloc] init];
	NSMutableDictionary* loginDictionary = [[loginDefaults persistentDomainForName: @"loginwindow"] mutableCopy];
	if (!loginDictionary) 
		loginDictionary = [[NSMutableDictionary alloc] init];
	NSMutableArray* startupItems = [[loginDictionary objectForKey:@"AutoLaunchedApplicationDictionary"] mutableCopy];
	if (!startupItems)
		startupItems = [[NSMutableDictionary alloc] init];
	
	BOOL found = NO;
	NSDictionary *d, *myEntry;
	NSEnumerator* e = [startupItems objectEnumerator];
	while (d = [e nextObject])
	{
		if ([[d objectForKey:@"Path"] isEqualTo: myCurrentPath])
		{
			found = YES;
			myEntry = d;
		}
	}
	
	if (!enabled && found) // delete it
	{
		[startupItems removeObject: myEntry];
	}
	else if (enabled && !found) // add it
	{
		myEntry = [NSDictionary dictionaryWithObjectsAndKeys: myCurrentPath, @"Path",
                   [NSNumber numberWithBool: NO], @"Hide", nil];
		[startupItems addObject: myEntry];
	}
	else if (enabled && found)
		return;
	else if (!enabled && !found)
		return;
	
	// actually modify the defaults
	[loginDictionary setObject: startupItems forKey:@"AutoLaunchedApplicationDictionary"];
	[loginDefaults removePersistentDomainForName: @"loginwindow"];
	[loginDefaults setPersistentDomain:loginDictionary forName:@"loginwindow"];
	[loginDefaults synchronize];
}

- (void) setWebAuthInfo
{
    //open out defaults
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
    
    //set up script file
    NSString *theScript = [NSString stringWithFormat: @"%@:%@", [defaults objectForKey:loginUsernameKeyName],[defaults objectForKey:loginPasswordKeyName]];
    //setup write to file
    NSString *rootPath = [[NSBundle mainBundle] resourcePath];
    NSString *theFile = [rootPath stringByAppendingString: @"/binary/etc/lighttpd-plain.user"];        
    NSFileHandle *theFileHandle = [NSFileHandle fileHandleForWritingAtPath:theFile];
    [theFileHandle writeData:[theScript dataUsingEncoding:NSProprietaryStringEncoding]];
    [theFileHandle truncateFileAtOffset:[theScript length]];
    [theFileHandle closeFile];
}

- (void) readDefaults
{
	NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
	[self setLoginItemEnabled: [defaults boolForKey:startOnLoginKeyName]];
}

- (void) registerDefaults
{
    NSUserDefaults* theDefaults = [NSUserDefaults standardUserDefaults];
	NSDictionary* defaultsDic = [NSDictionary dictionaryWithObjectsAndKeys:
                                 [NSNumber numberWithBool: NO], startOnLoginKeyName,
                                 [NSNumber numberWithBool:YES], SUCheckAtStartupKey,
                                 [NSNumber numberWithInt:9091], serverPortKeyName,
                                 [NSNumber numberWithBool: NO], sslEnabledKeyName,
                                 [NSNumber numberWithBool: NO], enableLoginKeyName,
                                 [NSString stringWithString:@"admin"], loginUsernameKeyName,
                                 [NSString stringWithString:@"password"], loginPasswordKeyName,
                                 nil
                                 ];
	
	[theDefaults registerDefaults: defaultsDic];
}

#pragma mark Lighttpd

- (void) generateLighttpdConf
{
    //open up preferences
    
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
    
    //set up script data to write
    NSString *theScript = @"include \"lighttpd-base.conf\"\r";
    theScript = [theScript stringByAppendingString: [NSString stringWithFormat: @"server.port = %d\r",[defaults integerForKey:serverPortKeyName]]];
    
    if ([defaults boolForKey:enableLoginKeyName])
    {
        [self setWebAuthInfo];
        theScript = [theScript stringByAppendingString: @"include \"lighttpd-auth.conf\"\r"];
    }
    if ([defaults boolForKey:sslEnabledKeyName])
    {
        [self generateSll];
        theScript = [theScript stringByAppendingString: @"include \"lighttpd-ssl.conf\"\r"];
    }
    
    
    //setup write to file
    NSString *theFile = [NSString stringWithFormat: @"%@/binary/etc/lighttpd.conf", [[NSBundle mainBundle] resourcePath]];        
    NSFileHandle *theFileHandle = [NSFileHandle fileHandleForWritingAtPath:theFile];
    [theFileHandle writeData:[theScript dataUsingEncoding:NSProprietaryStringEncoding]];
    [theFileHandle truncateFileAtOffset:[theScript length]];
    [theFileHandle closeFile];
}

- (void) generateSll
{
    openssl = [[NSTask alloc] init];
    NSString *rootPath = [[NSBundle mainBundle] resourcePath];
    NSString *pathToBinary = [rootPath stringByAppendingString: @"/binary"];
    NSString *pathToEtc = [pathToBinary stringByAppendingString: @"/etc"];
    NSString *pathToOpenSll = @"/usr/bin/openssl";
    [openssl setLaunchPath: pathToOpenSll];
    [openssl setCurrentDirectoryPath: pathToEtc];
    [openssl setArguments:
     [NSArray arrayWithObjects:
      @"req", 
      @"-new",
      @"-x509", 
      @"-keyout", @"server.pem",
      @"-out", @"server.pem",
      @"-days", @"3650",
      @"-nodes",
      @"-config", @"openssl-autogen.conf",
      nil
      ]
     ];
    [openssl launch];
    [openssl waitUntilExit];
    [openssl release];
    openssl = nil;
}

- (void) startLighttpd
{
    if (![lighttpd isRunning]) 
    {
        [self generateLighttpdConf];
        lighttpd = [[NSTask alloc] init];
        NSString *rootPath = [[NSBundle mainBundle] resourcePath];
        NSString *pathToBinary = [rootPath stringByAppendingString: @"/binary"];
        NSString *pathToLibs = [pathToBinary stringByAppendingString: @"/lib"];
        NSString *pathToLighttpd = [pathToBinary stringByAppendingString: @"/sbin/lighttpd"];
        [lighttpd setCurrentDirectoryPath:pathToBinary];
        [lighttpd setLaunchPath:pathToLighttpd];
        [lighttpd setEnvironment: 
         [NSDictionary dictionaryWithObjectsAndKeys:
          pathToLibs, @"DYLD_LIBRARY_PATH",
          pathToBinary, @"BINARYDIR",
          nil
          ]
         ];
        [lighttpd setArguments:
         [NSArray arrayWithObjects:
          @"-f",@"./etc/lighttpd.conf",
          @"-D",
          nil
          ]
         ];
        [lighttpd launch];
    }
    [self menuIconUpdate];
}

- (void) stopLighttpd
{
    if ([lighttpd isRunning]) 
    {
        [lighttpd terminate];
        [lighttpd waitUntilExit];
        [lighttpd release];
        lighttpd = nil;
    }
    [self menuIconUpdate];
}

#pragma mark UKKQueue

- (void) watcher: (id<UKFileWatcher>) watcher receivedNotification: (NSString *) notification forPath: (NSString *) path
{
    if ([notification isEqualToString: UKFileWatcherWriteNotification])
    {
        [self checkForTransmission];
    }
}

- (void) checkForTransmission
{
    bool somethingChanged = NO;
    if ( [[NSFileManager defaultManager] fileExistsAtPath:[@"~/Library/Application Support/Transmission/socket" stringByExpandingTildeInPath]] )
    {
        transmissionDetected = YES;
        if ( ! [ lighttpd isRunning ] )
        {
            somethingChanged = YES;
            [self startLighttpd];
        }
    }
    else
    {
        transmissionDetected = NO;
        if ( [ lighttpd isRunning ] ) 
        {
            somethingChanged = YES;
            [self stopLighttpd];
        }
    }
    
    if ( somethingChanged )
        [self menuIconUpdate];
    
}


#pragma mark Utilities

- (void) killOldProcesses
{
    if (![self killPidFromFile: lighttpdPidString])
    {
        NSLog (@"Lighttpd failed to quit");
    }
}

- (bool) killPidFromFile:(NSString*) theFile
{
    
    NSFileManager *theFileManageer = [NSFileManager defaultManager];
    if (! [theFileManageer fileExistsAtPath:theFile])
    {
        return true;
        //no pid file means no process
    }
    
    NSError *theError;
    int cPid = [[NSString stringWithContentsOfFile:theFile encoding:NSProprietaryStringEncoding error:&theError] intValue] ;
    
    if ( cPid <= 0 )
    {
        //something is wrong w/ the pid file
        return false; 
    }
    
    //send kill command
    if ( kill(cPid, SIGTERM) != 0 )
    {
        //something went wrong w/ with the quitting
        return false;
    }
    //wait for process to die
    int i = 0;
    int forceTimeOut = 10; //in seconds
    int giveUpTimeOut = 20; //in seconds
    int pollPerSecond = 10; //times to poll per second
    
    while ( kill(cPid, 0) == 0 )
    {
        //if we take longer than 10 sec to quit we send another kill command
        i++;
        if ( i = (forceTimeOut * pollPerSecond) )
        {
            kill(cPid, SIGKILL);
        }
        //if that doesn't work we give up
        if ( i >= (giveUpTimeOut * pollPerSecond) )
        {
            return false; 
        }
        usleep(1000000/pollPerSecond); 
    }
    //pid ~> no pid means application died
    return true;
}

- (void) updateSocketLocation
{
    NSString *theFile = [NSString stringWithFormat: @"%@/binary/web/remote/data/socket.txt", [[NSBundle mainBundle] resourcePath]];
    NSFileHandle *theFileHandle = [NSFileHandle fileHandleForWritingAtPath:theFile];
    NSString *theSocketLocation = [@"~/Library/Application Support/Transmission/socket" stringByExpandingTildeInPath];
    [theFileHandle writeData:[theSocketLocation dataUsingEncoding:NSProprietaryStringEncoding]];
    [theFileHandle truncateFileAtOffset:[theSocketLocation length]];
    [theFileHandle closeFile];
}

- (bool) isTransmissionDetected
{
    return transmissionDetected;
}

@end