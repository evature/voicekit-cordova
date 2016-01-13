# VoiceKit Cordova
VoiceKit is the Evature voice interface to travel applications, implemented using Apache Cordova.

To integrate with Eva follow these steps:

## Using VoiceKit
1. Start a new Cordova project:   `cordova create <app folder>  <namespace> "<app name>"`
2. Add an Android platform:  `cordova platform add android`
3. Install the following plugin:
     * cordova plugin add https://github.com/evature/voicekit-cordova.git --save
4. Eva requires AJAX access to its server. If you are using the _Content-Security-Policy_ Meta tag then you have to update `connect-src` in it - for example, in the `<head>` section update the tag to:
    `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; connect-src 'self' https://vproxy.evaws.com">`
5. If you do not already have Eva credentials, register to Evature at http://www.evature.com/registration/form to get your `API_KEY` and `SITE_CODE`. 
6. Follow the steps below. You can take a look at the demo application.

## Demo Application
See https://github.com/evature/demo-voicekit-cordova/ for an example of a demo application 

 
## eva.init
 
 Before you can start using Eva you need to initialize it: call  `eva.init(site_code, api_key, callback)` with your credentials.
 The callback will receive a parameter result
 
    `result.status` =  one of  ['ok', 'warning', 'error']
    `result.message` = a description of the error (if status != 'ok')
    
  If the result is of type `error` (this should never happen!) it means the service or the connectivity to it is currently unavailable - contact info@evature.com for details. If this is the case you should hide record button since the service might not be operational.
  
## eva.scope

If your app supports only certain types of travel queries, set `eva.scope` when you initialize your app according to http://www.evature.com/docs/request.html#scope

## User Interface setup

Call `eva.setupUI();` after eva.init is successful to setup the User Interface.
  
  
# Applicative Callbacks

Eva handles the dialog with the user up to the point the user requests an applicative action (eg. searching for flights). At this point Eva activates a callback function that should be implemented by you, the integrator.
  
Note that the callback implementation may close the Eva Chat Overlay and display a different page instead: simply hide the div with the id `eva-cover`.
 
## eva.callbacks

 The currently supported callbacks are:
 
    1. flightSearch - Activated when the user searches for flights, eg "Flight from NY to LA on Monday"
    2. departureTime - eg. "What is my departure time?"
    3. arrivalTime - eg. "what is my arrival time?"
    4. boardingTime - eg. "what is the boarding time?"
    5. gate - eg. "What is my gate number?"
    6. boardingPass - eg. "Show me my boarding pass"
    7. itinerary - eg. "Show me my trip info"
 
 Many more callbacks are in the process of being added!  Watch this space.
 
You do not have to implement all the callbacks. If you do not implement a specific end-user requested functionality Eva will respond with ""Sorry, this action is not supported yet".
To implment a function simply add a function to the `eva.callbacks` object, or completly replace it, for example:
    
    eva.callbacks.gate = function() {...}
    
or

    eva.callbacks = { gate: function() {...} }

The Callbacks' return value is described below.
 
Currently only the `flightSearch` callback has input parameters and they are described below. Only the `origin`, `destination`, `departDate` parameters are mandatory - the rest are optional.
             
 1.  originName - human readable name of the origin location
 1.  originCode -  Airport code of the departure airport
 1.  destinationName - as above but for the destination location
 1.  destinationCode - as above but for the destination location
 
 1.  departDateMin - the earliest departure date/time requested by the user (possibly null if only an upper limit is requested)
 1.  departDateMax - the latest date/time requested by the user (possibly identical to departDateMin if only a single date/time is specified, or null if only a lower limit is requested) 

    *              Example:  "fly from NY to LA not sooner than December 15th"  →  departDateMin = Dec 15,  departDateMax = null
    *              Example:                  "... no later than December 15th"  →  departDateMin = null,    departDateMax = Dec 15
    *              Example:                             "... on December 15th"  →  departDateMin = Dec 15,  departDateMax = Dec 15
    *         Note: the Date object passed will have a time of midnight (UTC) AND have an additional 'DATE_ONLY' flag if no time of day is specified.
    *              Example:  "fly from NY to LA on December 15th at 10am"  → departDate = Date object of "Dec 15th 10:00am (local timezone)"
    *              Example:  "fly from NY to LA on December 15th"          → departDate = Date object of "Dec 15th 00:00am (UTC timezone)"
    *                                                                       → and also  departDate.DATE_ONLY == true      
 7.  returnDateMin - same as for the departure date, except that it is possible both returnDateMin and Max are null (if one-way flight is requested)
 8.  returnDateMax
 9.  travelers - travelers.Adult = number of adults specified (undefined if not specified). Same for Infant, Child, Elderly (see enums in eva.enums.TravelersType)
 10.  nonstop - undefined if not specified,  true/false if requested
 11.  seatClass - array of Economy/Business/etc.. that the user specified. see  eva.enums.SeatClass
 12.  airlines - array of IATA Airline codes requested by the user 
 13.  redeye - undefined if not speficied, true/false if requested by the user
 14.  food - Food type requested by the user (see eva.enums.FoodType)
 15.  seatType - Window/Aisle or undefined if not specified (see eva.enums.SeatType)
 16.  sortBy - sorting criteria if specified by the user (see eva.enums.SortEnum)
 17.  sortOrder - sort order if specified by the user (see eva.enums.SortOrderEnum)

## Callback return value

 All calldbacks return the same, the return value should be one of the following:
 *          false - remove the "thinking..." chat bubble and take no further action
 *          true - replace the "thinking..." chat bubble with Eva's reply and speak it
 *          string - html string to be added the Eva's reply
 *          eva.AppResult - and object containing display_it, say_it, (can use different strings for display/speak)
 *          Promise - can be used for async operations. The promise should resolve to one of the above return values. 

For example look at `eva-app-setup.js`, it include placeholder functions for the different callbacks.

1. boardingTime, gate - are examples of returning a simple string result. The text will be appended to Eva's reply and spoken.
2. departureTime - is an example of returning an html string. It will be appended to Eva's reply and spoken (but only the text content is spoken of course, the markup is not).
3. arrivalTime - is an example of returning a promise. You can use it to fetch data from database/server asynchronously. In this example a setTimeout is used instead. The resolved result is a string.
4. boardingPass - is an example of returning an AppResult with one stsring for `sayIt` (in this case empty) and another string for the display (in this case an html table).
5. itinerary - fades out the Eva overlay div, and presents an alert when the div is hidden. It returns true in order to replace the chat bubble with Eva's default response.
6. flight search - is an example of returning a Promise which resolves to an AppResult with one string for `sayIt` and another `display_it`.
