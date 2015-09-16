# VoiceKit Cordova
VoiceKit is Evature voice interface to travel applications, implemented using Apache Cordova

To integrate with Eva follow the steps:

## Integrating in a new Project
1. Start a new Cordova project:   `cordova create <app folder>  <namespace> "<app name>"`
2. Add Android platform:  `cordova platform add android`
3. Install the following plugins:
     * cordova plugin add com.manueldeveloper.speech-recognizer --save
     * cordova plugin add org.apache.cordova.device --save
     * cordova plugin add org.apache.cordova.geolocation --save
     * cordova plugin add org.apache.cordova.speech.speechsynthesis --save
     * cordova plugin add org.apache.cordova.vibration --save
4. Eva requires AJAX access to its server, if you are using _Content-Security-Policy_ Meta tag then you have to update `connect-src` in it - for example, in the `<head>` section update the tag to:
    `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; connect-src 'self' https://vproxy.evaws.com">`
5. Download from this repository the files under the `www` folder and place them into your project.
7. Register to Evature at http://www.evature.com/registration/form to get your `API_KEY` and `SITE_CODE`. Copy paste the values to matching fields in `eva_app_setup.js` file.


## Integrating with existing application 
The major difference from the above steps is that you would not copy-paste the index.html file into your app - instead you need to modify your html file in this way:

1. Add the following snippet to your index.html, just before the closing of `</body>`

        <div id="cover" class="fullscreen"><ul id="chat-cont"></ul></div>
        <div id="voice_search_cont">
            <div class="slidewell show_on_hold">
                <h2> &#10143; </h2>
            </div>
            <div class="slidewell left show_on_hold">
                <h2> &#10143; </h2>
            </div>
            <div class="button undo_button show_on_hold"></div>
            <div class="button record_button"></div>
            <div class="button trash_button show_on_hold"></div>
        </div>
        
2. Include the js and css files:

   In your `<head>` section add:
   `<link rel="stylesheet" href="css/chat.css" />`
    
   At the end of your `<body>` section add:
   
        <script type="text/javascript" src="js/jquery-1.11.3.min.js"></script>
        <script type="text/javascript" src="js/chat.js"></script>
        <script type="text/javascript" src="js/eva_app_setup_eva.js"></script>                                                                                
  