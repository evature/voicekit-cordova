;(function() {
	"use strict";
	
	window.eva = window.eva || {};
	
	// To get your Site Code and API Key register to Evature's webservice at http://www.evature.com/registration/form
	eva.site_code = undefined; // this is where you put your Site Code 
	eva.api_key =  undefined; // this is where you put your API Key

	eva.scope = 'f'; // flights only

	
	var dateFormatOptions =  {
		    weekday: "long", year: "numeric", month: "short",
		    day: "numeric", hour: "2-digit", minute: "2-digit"
		};
	
	eva.callbacks = {
		flightSearch: function( origin,  destination, 
				 departDateMin,  departDateMax,
                 returnDateMin,  returnDateMax,
                 travelers,
                 oneWay,  nonstop, seatClass,  airlines,
                 redeye,  food, seatType,
                 sortBy,  sortOrder ) {
			
			console.log("This is where we would search for flights matching the criteria: from "+origin+" to "+destination);
		},
			
		//"What is the departure time?"
		getDepartureTime: function() {
			return new Date(+new Date() + 3600*24*(2+Math.random()*4)).toLocaleTimeString("en-us", dateFormatOptions);
		},
	    // "What is the arrival time"
		getArrivalTime: function() {
			return new Date(+new Date() + 3600*24*(2+Math.random()*4)).toLocaleTimeString("en-us", dateFormatOptions);
		},
		//"What is the boarding time"
		getBoardingTime: function() {
			return new Date(+new Date() + 3600*24*(2+Math.random()*4)).toLocaleTimeString("en-us", dateFormatOptions);
		},
		// What is my gate number"
		getGateNumber: function() {
			return (1+Math.random()*12|0) +" at Terminal "+["A","B","C"][Math.random()*3|0];
		},
		
		
		navigateApp: function(toPage) {
			// "Show my boarding pass" 
			if (toPage == "BoardingPass") {
				console.log("This is where trip details will show");
				return true;
			}
			// "Show my trip details"
			if (toPage == "Itinerary") {
				console.log("This is where boarding pass will show");
				return true;
			}
		}
	};

})();