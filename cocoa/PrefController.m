//
//  PrefController.m
//  Clutch
//
//  *
//	*	Copyright ¬© Kendall Hopkins
//  *      This code is licensed under the GPL version 2. 
//  *      For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html 
//	*

#import "PrefController.h"
#import "GlobalConstants.h"

@interface PrefController (Private)

- (void) updateCurrentPreference;
- (bool) checkForChangesInPreferences;
- (void) updateInterface;

@end


@implementation PrefController

- (id) init
{
	self = [super initWithWindowNibName:@"Preferences"];
    
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
    [defaults addObserver:self forKeyPath:startOnLoginKeyName options:NSKeyValueObservingOptionNew context:NULL];
    [defaults addObserver:self forKeyPath:serverPortKeyName options:NSKeyValueObservingOptionNew context:NULL];
    [defaults addObserver:self forKeyPath:sslEnabledKeyName options:NSKeyValueObservingOptionNew context:NULL];
    [defaults addObserver:self forKeyPath:enableLoginKeyName options:NSKeyValueObservingOptionNew context:NULL];
    [defaults addObserver:self forKeyPath:loginUsernameKeyName options:NSKeyValueObservingOptionNew context:NULL];
    [defaults addObserver:self forKeyPath:loginPasswordKeyName options:NSKeyValueObservingOptionNew context:NULL];

	return self;
}
     
-(void) observeValueForKeyPath: (NSString *) keyPath ofObject: (id) object change: (NSDictionary *) change context: (void *) context
{
    if ( keyPath == startOnLoginKeyName )
    {
        MainController* mainController = [[NSApplication sharedApplication] delegate];
        NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
        [mainController setLoginItemEnabled: [defaults boolForKey:startOnLoginKeyName]];
    }
    else if ( keyPath == serverPortKeyName )
    {
        NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
        int newPort = [defaults integerForKey:serverPortKeyName];
        if ( newPort < 1024 || newPort > 65535 )
        {
            [defaults setObject:[NSNumber numberWithInt:appliedPreferences.serverPort] forKey:serverPortKeyName];
        }
    }
    else if ( keyPath == sslEnabledKeyName || keyPath == enableLoginKeyName || keyPath == loginUsernameKeyName || keyPath ==  loginPasswordKeyName )
    {
        [self updateInterface];
    }
}

- (void) windowDidLoad
{
    [applySettings setEnabled:false];
    [self updateCurrentPreference];
    [theUrlLink setStringValue:[self returnUrlLink]];
}

- (IBAction) applyChangesToPrefwindow:(id) sender
{
    [applySettings setEnabled:false];
    
    //reset lighttpd
    MainController* mainController = [[NSApplication sharedApplication] delegate];
    [mainController stopLighttpd];
    if ( [mainController isTransmissionDetected] )
        [mainController startLighttpd];
    
    //set currently used settings
    [self updateCurrentPreference];
    
    //update link
    [theUrlLink setStringValue:[self returnUrlLink]];
}

- (NSString *) returnUrlLink
{
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
    
    NSString *theUrl = @"";
    if ([defaults boolForKey:sslEnabledKeyName])
    {
        theUrl = [theUrl stringByAppendingString: @"https://"];
    }
    else
    {
        theUrl = [theUrl stringByAppendingString: @"http://"];
    }
    NSString *theIP = [NSString stringWithContentsOfURL:[NSURL URLWithString:@"http://clutchbt.com/ip.php"] encoding:NSProprietaryStringEncoding error:nil];
    if ( theIP == nil )
        theIP = @"Localhost";
    theUrl = [theUrl stringByAppendingString: [NSString stringWithFormat: @"%@:%d", theIP, [defaults integerForKey:serverPortKeyName]]];
    return theUrl;
}

- (void) updateInterface
{
    if ([self checkForChangesInPreferences])
    {
        [applySettings setEnabled:true];
    }
    else
    {
        [applySettings setEnabled:false];
    }
}

- (void) updateCurrentPreference
{
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];

    appliedPreferences.serverPort = [defaults integerForKey:serverPortKeyName];
    appliedPreferences.sslEnabled = [defaults boolForKey:sslEnabledKeyName];
    appliedPreferences.enableLogin = [defaults boolForKey:enableLoginKeyName];
    if (appliedPreferences.loginUsername != nil)
        [appliedPreferences.loginUsername release];
    appliedPreferences.loginUsername = [defaults objectForKey:loginUsernameKeyName];
    [[defaults objectForKey:loginUsernameKeyName] retain];
    
    if (appliedPreferences.loginPassword != nil)
        [appliedPreferences.loginPassword release];
    appliedPreferences.loginPassword = [defaults objectForKey:loginPasswordKeyName];
    [[defaults objectForKey:loginPasswordKeyName] retain];

}

- (bool) checkForChangesInPreferences
{
    NSUserDefaults* defaults = [NSUserDefaults standardUserDefaults];
    
    if (appliedPreferences.serverPort != [defaults integerForKey:serverPortKeyName])
        return 1;
    if (appliedPreferences.sslEnabled != [defaults boolForKey:sslEnabledKeyName])
        return 1;
    if (appliedPreferences.enableLogin != [defaults boolForKey:enableLoginKeyName])
        return 1;
    if (1 == [defaults boolForKey:enableLoginKeyName])
    {
        NSString *tempString; //if i dont type case this way i get a warning
        tempString = [defaults objectForKey:loginUsernameKeyName];
        if ([tempString compare: appliedPreferences.loginUsername])
            return 1;
        tempString = [defaults objectForKey:loginPasswordKeyName];
        if ([tempString compare: appliedPreferences.loginPassword] )
            return 1;
    }
    
    return 0;
}

@end
