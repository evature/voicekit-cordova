(function() {
	window.eva = window.eva || {};
    // ajax without jquery - based on http://stackoverflow.com/a/18078705/519995
    var ajax = {};
    ajax.x = function() {
        if (typeof XMLHttpRequest !== 'undefined') {
            return new XMLHttpRequest();  
        }
        var versions = [
            "MSXML2.XmlHttp.6.0",
            "MSXML2.XmlHttp.5.0",   
            "MSXML2.XmlHttp.4.0",  
            "MSXML2.XmlHttp.3.0",   
            "MSXML2.XmlHttp.2.0",  
            "Microsoft.XmlHttp"
        ];

        var xhr;
        for(var i = 0; i < versions.length; i++) {  
            try {  
                xhr = new ActiveXObject(versions[i]);  
                break;  
            } catch (e) {
            }  
        }
        return xhr;
    };

    ajax.send = function(url, callback, method, data, err) {
        var x = ajax.x();
        x.open(method, url);
        x.onreadystatechange = function() {
            if (x.readyState == 4) {
            	if (x.status == 200) {
            		callback(JSON.parse(x.responseText));
            	}
            	else {
            		err(x.status, x.responseText);
            	}
            }
        };
        if (method == 'POST') {
            x.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
        }
        x.send(data)
    };

    ajax.get = function(url, data, callback, err) {
        var query = [];
        for (var key in data) {
            query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
        }
        ajax.send(url + (query.length ? '?' + query.join('&') : ''), callback, 'GET', null, err)
    };
    
    eva.ajax = ajax;
})();