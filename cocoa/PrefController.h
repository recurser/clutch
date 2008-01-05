//
//  PrefController.h
//  Clutch
//
//  *
//	*	Copyright ¬© Kendall Hopkins
//  *      This code is licensed under the GPL version 2. 
//  *      For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html 
//	*

#import <Cocoa/Cocoa.h>
#import "MainController.h"

struct {
    int          serverPort;
    bool         sslEnabled;
    bool        enableLogin;
    NSString *loginUsername;
    NSString *loginPassword;
} appliedPreferences;

@interface PrefController : NSWindowController 
{
    IBOutlet    NSButton        *applySettings;
    IBOutlet    NSTextField     *theUrlLink;
}

- (IBAction) applyChangesToPrefwindow:(id) sender;

- (NSString *) returnUrlLink;

@end
