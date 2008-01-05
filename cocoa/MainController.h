//
//  MainController.h
//  Clutch
//
//  *
//	*	Copyright ¬© Kendall Hopkins
//  *      This code is licensed under the GPL version 2. 
//  *      For more details, see http://www.gnu.org/licenses/old-licenses/gpl-2.0.html 
//	*

#import <Cocoa/Cocoa.h>

@class PrefController;

@interface MainController : NSObject 
{
    NSStatusItem* statusMenuItem;
}

- (void) startLighttpd;
- (void) stopLighttpd;
- (bool) isTransmissionDetected;
- (void) setLoginItemEnabled:(BOOL) enabled;


@end
