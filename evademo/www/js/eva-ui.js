(function() {
	window.eva = window.eva || {};
	
	/**
	* getHeight - for elements with display:none
	 */
	eva.getHeight = function(el) {
	    var el_style      = window.getComputedStyle(el),
	        el_display    = el_style.display,
	        el_position   = el_style.position,
	        el_visibility = el_style.visibility,
	        el_max_height = el_style.maxHeight.replace('px', '').replace('%', ''),
	
	        wanted_height = 0;
	
	
	    // if its not hidden we just return normal height
	    if(el_display !== 'none' && el_max_height !== '0') {
	        return el.offsetHeight;
	    }
	
	    // the element is hidden so:
	    // making the el block so we can meassure its height but still be hidden
	    el.style.position   = 'absolute';
	    el.style.visibility = 'hidden';
	    el.style.display    = 'block';
	
	    wanted_height     = el.offsetHeight;
	
	    // reverting to the original values
	    el.style.display    = el_display;
	    el.style.position   = el_position;
	    el.style.visibility = el_visibility;
	
	    return wanted_height;
	};
	
	
	eva.slide = function(element, inital, target, time, callback) {
		var op = initial,  // initial opacity
    		start = new Date().getTime(),
    		timer = setInterval(function () {
		    	var fraction = Math.min(time,(new Date().getTime())-start)/time;
		    	var curr = (1-fraction)*initial + fraction * target;
		        element.style.height = Math.round(curr)+'px';
		        if( fraction >= 1) {
	            	clearInterval(timer);
	    	    	if (target == 0) {
	    	    		element.style.display = 'none';
	    	    	}
	    	    	if (callback) {
	    	    		callback();
	    	    	}
	            }
		    }, 17);
	}
	
//	eva.slideUp = function(element, callback) {
//		eva.slide(element, element.clientHeight, )
//	}
	
	var hasSearchResults = false;
	var scrollTimer = null;
	
	eva.scrollElement = function(element, scrollTarget, time) {
	    // time = scroll time in ms
	    var start = new Date().getTime(),
	        scroll0 = element.scrollTop;
	    if (scrollTimer) {
	    	clearInterval(scrollTimer);
	    	scrollTimer = null;
	    }
	    scrollTimer = setInterval(function() {
	            var fraction = Math.min(time,(new Date().getTime())-start)/time;
	            element.scrollTop = (1-fraction)*scroll0 + fraction * scrollTarget;
	            if( fraction >= 1) {
	            	clearInterval(scrollTimer);
	    	    	scrollTimer = null;
	            }
	        },17);
	}
	
	eva.scrollToBottom = function() {
		var evaCover = document.getElementById("eva-cover");
		var scrollTarget = evaCover.scrollHeight - evaCover.clientHeight;
		eva.scrollElement(evaCover, scrollTarget, 500);
	}
	
	eva.fade = function(element, initial, target, time, callback) {
		var op = initial,  // initial opacity
	    	start = new Date().getTime(),
	    	timer = setInterval(function () {
		    	var fraction = Math.min(time,(new Date().getTime())-start)/time;
		    	var op = (1-fraction)*initial + fraction * target;
		        element.style.opacity = op;
		        element.style.filter = 'alpha(opacity=' + op * 100 + ")";
		        if( fraction >= 1) {
	            	clearInterval(timer);
	    	    	if (target == 0) {
	    	    		element.style.display = 'none';
	    	    	}
	    	    	if (callback) {
	    	    		callback();
	    	    	}
	            }
		    }, 17);
	}
	
	eva.fadeOut = function(element, time, callback) {
		var elements = document.querySelectorAll(selector);
		for (var i=0; i<elements.length; i++) {
			var element = elements[i];
			eva.fade(element, 1, 0, time || 250, callback);
		}
	}
	
	eva.fadeIn = function(selector, time, callback) {
		var elements = document.querySelectorAll(selector);
		for (var i=0; i<elements.length; i++) {
			var element = elements[i];
			eva.fade(element, 0, 1, time || 250, callback);
		}
	}
	
	eva.createElements = function(htmlString) {
		var div = document.createElement('div');
		div.innerHTML = htmlString;
		var elements = div.childNodes;
	    return elements;
	}
	
	eva.createElement = function(htmlString) {
		var div = document.createElement('div');
		div.innerHTML = htmlString;
	    var element = div.firstChild;
	    return element;
	}
	
	eva.remClass = function(selector, cls) {
		var elements = document.querySelectorAll(selector);
		for (var i=0; i<elements.length; i++) {
			elements[i].classList.remove(cls);
		}
	}
	
	eva.addClass = function(selector, cls) {
		var elements = document.querySelectorAll(selector);
		for (var i=0; i<elements.length; i++) {
			elements[i].classList.add(cls);
		}
	}
	
})();