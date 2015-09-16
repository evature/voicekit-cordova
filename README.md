# Voice Cordova
VoiceKit Evature voice interface to travel applications, implemented using Apache Cordova

To integrate with Eva follow the steps:

1. start a new Cordova project:   `cordova create <app folder>  <namespace> "<app name>"`

2. Add Android platform:  `cordova platform add android`
3. Install the following plugins:
     * cordova plugin add com.manueldeveloper.speech-recognizer --save
     * cordova plugin add org.apache.cordova.device --save
     * cordova plugin add org.apache.cordova.geolocation --save
     * cordova plugin add org.apache.cordova.speech.speechsynthesis --save
     * cordova plugin add org.apache.cordova.vibration --save

4. Eva requires AJAX access to its server, if you are using _Content-Security-Policy_ Meta tag then you have to update `connect-src` in it - for example, in the `<head>` section update the tag to:

    `<meta http-equiv="Content-Security-Policy" content="default-src 'self' data: gap: https://ssl.gstatic.com 'unsafe-eval'; style-src 'self' 'unsafe-inline'; media-src *; connect-src 'self' https://vproxy.evaws.com">`
