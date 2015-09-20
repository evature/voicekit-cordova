
(function () {
	"use strict";
	
	var $ = jQuery;
	// window.eva is the namespace for all things global (functions, variables) used by the Eva integration scripts
	window.eva = window.eva || {};
	if (!eva.callbacks) {
		eva.callbacks = {}
	}
	
	
	eva.enums = {
		FoodType: {
	        Unknown: "Unknown", // shouldnt get this one
	
	        // Religious:
	        Kosher:"Kosher", GlattKosher: "Glatt Kosher", Muslim: "Muslim", Hindu: "Hindu",
	        // Vegetarian:
	        Vegetarian: "Vegetarian", Vegan: "Vegan", IndianVegetarian: "Indian Vegetarian", RawVegetarian: "Raw Vegetarian", 
	        OrientalVegetarian: "Oriental Vegetarian", LactoOvoVegetarian: "Lacto Ovo Vegetarian",
	        LactoVegetarian: "Lacto Vegetarian", OvoVegetarian: "Ovo Vegetarian", JainVegetarian: "Jain Vegetarian",
	        // Medical meals:
	        Bland: "Bland", Diabetic: "Diabetic", FruitPlatter: "Fruit Platter", GlutenFree: "GlutenFree", 
	        LowSodium: "Low Sodium", LowCalorie: "Low Calorie", LowFat: "Low Fat", LowFibre: "Low Fibre",
	        NonCarbohydrate: "Non Carbohydrate", NonLactose: "Non Lactose", SoftFluid: "Soft Fluid", 
	        SemiFluid: "Semi Fluid", UlcerDiet: "Ulcer Diet", NutFree: "Nut Free", LowPurine: "Low Purine",
	        LowProtein: "Low Protein", HighFibre: "High Fibre",
	        // Infant and child:
	        Baby: "Baby", PostWeaning: "Post Weaning", Child: "Child", // In airline jargon, baby and infant < 2 years. 1 year < Toddler < 3 years.
	        // Other:
	        Seafood: "Seafood", Japanese: "Japanese"
	    },
	    
	    SeatType: { Unknown: "Unknown", Window: "Window", Aisle: "Aisle" },
		SeatClass: { Unknown: "Unknown",
			First: "First", Business: "Business", Premium: "Premium", Economy: "Economy"
		},
		
		
		SortEnum: {
			unknown: "unknown",
			reviews: "reviews", location: "location", price: "price", price_per_person: "price_per_person", 
			distance: "distance", rating: "rating", guest_rating: "guest_rating", 
			stars: "stars", time: "time", total_time: "total_time", duration: "duration", arrival_time: "arrival_time", 
			departure_time: "departure_time", outbound_arrival_time: "outbound_arrival_time", 
			outbound_departure_time: "outbound_departure_time", inbound_arrival_time: "inbound_arrival_time", 
			inbound_departure_time: "inbound_departure_time", airline: "airline", operator: "operator", 
			cruiseline: "cruiseline", cruiseship: "cruiseship", name: "name", popularity: "popularity", recommendations: "recommendations"
		},

		SortOrderEnum: {
			unknown: "unknown",
			ascending: "ascending", descending: "descending", reverse: "reverse"
		}
	};
	
	var FLOW_TYPE = {
			Hotel: 'Hotel',
			Flight: 'Flight',
			Car: 'Car',
			Question: 'Question'
		};
	
	eva.START_NEW_SEARCH_USER_TEXT = "Start new search.";
	eva.START_NEW_SEARCH_RESPONSE_TEXT = "Starting a new search, how may I help you?";
		
	
	var getField = function(object, path, defVal) {
		var tokens = path.split('.');
		for (var i=0; i<tokens.length; i++) {
			object = object[tokens[i]];
			if (object === undefined) {
				return defVal;
			}
		}
		return object;
	}
	
	var getAirportCode = function (location) {
		if (location["All Airports Code"])
			return location["All Airports Code"];
			
		if (location["Airports"]) {
			return location["Airports"].split(',')[0];
		}
		return undefined;
	}



	eva.INITIAL_PROMPT = "Hello, how can I help you?";
	eva.prompt = eva.INITIAL_PROMPT;
	eva.sessionId = "1";
	
//	var hasSearchResults = false;

	function scrollToBottom() {
		var $ = jQuery;
		$("#eva-cover").animate({
			scrollTop: $("#eva-cover")[0].scrollHeight
		}, 1000);
	}

	function addMeChat(text) {
		var $chat = $('<div data-position="eva-left" class="eva-notViewed eva-animBlock eva-left-bubble">'+text.replace("<","&lt;")+"</div>");
		var $li = $('<li class="eva-me-chat"></li>');
		$li.append($chat);
		$('#eva-chat-cont').append($li);
		scrollToBottom();
		$chat.removeClass('eva-notViewed').addClass('eva-viewed');
		return $chat;
	}
	
	eva.addMeChat = addMeChat;

	function addEvaChat(text, existing_evachat, speak_it, is_html) {
		var $chat;
		if (existing_evachat) {
			$chat = existing_evachat;
		}
		else {
			$chat = $('<div data-position="eva-right" class="eva-notViewed eva-animBlock eva-right-bubble"></div>');
		};
		if (is_html) {
			$chat.html(text.replace(/<script/gi, '&lt;script')); // allow html tags but not script tags
		}
		else {
			$chat.text(text);
		}
		if (!existing_evachat) {
			var $li = $('<li class="eva-server-chat"></li>');
			$li.append($chat);
			$('#eva-chat-cont').append($li);
		}

		if (speak_it) {
			speak($chat.text());
		}
		scrollToBottom();
		$chat.removeClass('eva-notViewed').addClass('eva-viewed');
		return $chat;
	}

	function speak(text) {
		speechSynthesis.cancel();
		var u = new SpeechSynthesisUtterance();
	    u.text = text;
	    u.lang = "en-US";
	    u.volume = "1.0";
	    u.onend = function() { };
	    console.log("Speaking: ["+text+"]");
	    speechSynthesis.speak(u)
	}
	
	/*function stopSearchResults() {
		for (var i=0; i<window.frames.length; i++) {
			window.frames[i].stop();
		}
		$('.eva-search-results').hide();
	}*/
	
	function resetSession(quiet) {
//		stopSearchResults();
//		hasSearchResults = false;
		$('#eva-chat-cont').empty();
		eva.prompt = eva.INITIAL_PROMPT	
		if (!quiet) {
			addMeChat(eva.START_NEW_SEARCH_USER_TEXT)
			addEvaChat(eva.START_NEW_SEARCH_RESPONSE_TEXT);
			speak(eva.START_NEW_SEARCH_RESPONSE_TEXT);
		}
		eva.sessionId = "1";
	}
	
	function undoLastUtterance() {
		//stopSearchResults();
		var $chat_items = $('#eva-chat-cont > li');
		var items_to_remove = [];
		for (var i= $chat_items.length-1; i>0; i--) {
			var $chat = $($chat_items[i]);
			var found = $chat.hasClass('eva-me-chat') || $chat.text() == eva.START_NEW_SEARCH_RESPONSE_TEXT;
			if (found) {
				if (i>0) {
					// check if the previous one is a server chat
					var $chat_prev = $($chat_items[i-1]);
					if ($chat_prev.hasClass('eva-server-chat') && $chat_prev.text() != eva.START_NEW_SEARCH_RESPONSE_TEXT) {
						items_to_remove.push($chat_prev);
					}
				}
				break;
			}
			items_to_remove.push($chat);
		}
		for (var i=0; i<items_to_remove.length; i++) {
			$(items_to_remove[i]).slideUp(function(){ $(this).remove() })
		}
		searchWithEva([], false, true);
		if ($('#eva-chat-cont > li').length == 0) {
			resetSession();
		}
	}

	function searchWithEva(texts, user_chat, edit_last) {
		var site_code = eva.site_code;
		var api_key = eva.api_key;
		if (!api_key || !site_code) {
			alert("No API_KEY!  Register at http://www.evature.com/registration/form and copy-paste it to eva_app_setup.js  - or contact us for help at info@evature.com");
			return;
		}
		var host = eva.host || 'https://vproxy.evaws.com';
		var url = host+'/v1.0?api_key='+encodeURIComponent(api_key)+'&site_code='+encodeURIComponent(site_code);
		if (eva.context) {
			url += '&context='+encodeURIComponent(eva.context);
		}
		if (eva.scope) {
			url += '&scope='+encodeURIComponent(eva.scope);
		}
		url += '&sdk_version=android_cordova_1.0&locale=US&from_speech=true&ffi_statement&ffi_chains';
		url += "&android_ver="+encodeURIComponent(window.device.version);
		url += "&device="+encodeURIComponent(window.device.model);
		url += "&uid="+encodeURIComponent(window.device.uuid);
		url += "&add_text=true"
		
		if (eva.location) {
			url += "&longitude=" + eva.location.longitude + "&latitude=" + eva.location.latitude;
		}
		if (edit_last) {
			url += '&edit_last_utterance=true&input_text=';
		}
		else {
			for (var i=0; i<texts.length; i++) {
				url += '&input_text='+encodeURIComponent(texts[i]);
			}
		}
		url += "&session_id="+eva.sessionId;
		
		var eva_chat;
		if (!edit_last) {
			eva_chat = addEvaChat("Thinking...");
		}

		console.log("Sending to Eva: "+url);
		$.ajax({
			url: url,
			dataType: 'json',
			success: function(response) { return processResponse(response, user_chat, eva_chat); },
			error: function(e) {
				if (eva_chat)
					eva_chat.text("There was an error, try again later.");
				console.error("Error sending to Eva"+ e);
				alert("Error sending to Eva: "+e);
			}
		})
	}
	eva.searchWithEva= searchWithEva;
	
	function startRecording() {
		if (!navigator.speechrecognizer) {
			return; // not ready yet
		}
		eva.recording = true;
		if ($('#eva-chat-cont > li').length == 0) {
			addEvaChat(eva.INITIAL_PROMPT);
		}
		$('#eva-cover').show();
		speechSynthesis.cancel();
		$('.eva-record_button').addClass('eva-is_recording');
		var meChat = null; 
		navigator.speechrecognizer.recognize(
				function(result) { 
					var texts = result; //result.texts;
					var isPartial = false; //result.isPartial;
					if (!isPartial) {
						eva.recording = false;
						$('.eva-record_button').removeClass('eva-is_recording');
					}
					if (texts.length > 0) {
						if (!meChat) {
							meChat = addMeChat("...");
						}
						if (isPartial) {
							meChat.text(texts[0]+"...");
						}
						else {
							meChat.text(texts[0]);
							searchWithEva(texts, meChat);
							meChat = null;
						}
					}
					else {
						alert("No Speech Results")
					}
				}, 
				function(e) {
					eva.recording = false;
					$('.eva-record_button').removeClass('eva-is_recording');
					if (e != 0 ) {
						// error=0 is user canceled - not really an error
						console.error("Speech Recognition Error "+e);
					}
					if (meChat != null) {
						meChat.closest('li').slideUp(function(){ $(this).remove(); })
						meChat = null;
					}
				}, 4 /*maxMatches*/, 
				eva.prompt /*promptString*/ //, 
				//"en-US" /*language*/
			);
	}

	function onBackKeyDown(e) {
		/* Below is needed for recording that is in the background, not the dialog button
		 * if (eva.recording) {
			if (!navigator.speechrecognizer || !navigator.speechrecognizer.cancelRecognizer) {
				console.log("cancelRecognizer not supported");
			}
			else {
				navigator.speechrecognizer.cancelRecognizer();
			}
			console.log("back pressed while recording, stopping recording");
			eva.recording = false;
			$('.eva-record_button').removeClass('eva-is_recording');
			if (meChat != null) {
				meChat.closest('li').slideUp(function(){ $(this).remove(); })
				meChat = null;
			}
			return false;
		}*/
		/*if ($('#eva-search-results').is(":visible")) {
			console.log("back pressed while showing search results, hiding");
			speechSynthesis.cancel();
			$('#eva-search-results-bg').hide()
			$('#eva-search-results').fadeOut();
			return false;
		}*/
		
		if ($('#eva-cover').is(":visible")) {
			speechSynthesis.cancel();
			$('#eva-cover').fadeOut(function() {
				//resetSession(true);
			});
			return false;
		}
		
		return true;
	}

//	window.onerror = function(message, url, lineNumber) {  
//	  //alert("Error: "+message+"  at line "+lineNumber+"  in url: "+url);
//	  console.error("Error: "+message+" at line "+lineNumber+"  in url: "+url);
//	  return true;
//	};  
	
	var shown_undo_tip = false;
	
	
	function processResponse(result, user_chat, eva_chat) {
		console.log("Eva result is "+JSON.stringify(result, null, 4));
		var api_reply = result.api_reply;
		var has_warnings = false;
		
		if (user_chat && api_reply && api_reply.ProcessedText) {
			
			// add highlighting for sematic parts and parse-warnings
			
			var spans = [];
			
			var warnings = api_reply.Warnings || [];	
			for (var i=0; i< warnings.length; i++) {
				var warning = warnings[i];
				var type = warning[0];
				var text = warning[1];
				if (type == "Parse Warning") {
					var data = warning[2];
					var position = data.position;
					if (position == -1 || position == undefined) {
						continue;
					}
					has_warnings = true;
					var text = data.text;
					spans.push({
						position: position,
						positionEnd: position+text.length,
						text: "<span class='eva-error'>"+text.replace(/</g, "&lt;")+"</span>"
					})
				}
			}
			
			if (api_reply["Last Utterance Parsed Text"]) {
				var parsedText  = api_reply["Last Utterance Parsed Text"];
				var times = parsedText["Times"] || [];
				for (var i=0; i<times.length; i++) {
					var time = times[i];
					var position = time.Position;
					if (position !== undefined && time.Text) {
						spans.push({
							position: position,
							positionEnd: position+time.Text.length,
							text: "<span class='eva-time'>"+time.Text.replace(/</g, "&lt;")+"</span>"
						})
					}
				}
				var locations = parsedText["Locations"] || [];
				for (var i=0; i<locations.length; i++) {
					var location = locations[i];
					var position = location.Position;
					if (position !== undefined && location.Text) {
						spans.push({
							position: position,
							positionEnd: position+location.Text.length,
							text: "<span class='eva-location'>"+location.Text.replace(/</g, "&lt;")+"</span>"
						})
					}
				}						
				
			}
			spans.sort(function(a,b) {
				return a.position - b.position;
			})
			
			var prevPos = 0;
			var resultText = '';
			for (var i=0; i<spans.length; i++) {
				var span = spans[i];
				if (span.position > prevPos) {
					resultText += api_reply.ProcessedText.slice(prevPos, span.position);
				}
				resultText += span.text;
				prevPos = span.positionEnd;
			}
			if (prevPos < api_reply.ProcessedText.length) {
				resultText += api_reply.ProcessedText.slice(prevPos, api_reply.ProcessedText.length);
			}
			user_chat.html(resultText);
		}
		
		if (result.session_id != eva.sessionId && eva.sessionId != "1") {
			// new session was started
//				stopSearchResults();
			var chats = $('#chat-cont > li');
			for (var i=0; i<chats.length; i++) {
				var $chat = $(chats[i]);
				var $balloon = $chat.find('div'); 
				if ($balloon.is(user_chat) || $balloon.is(eva_chat)) {
					continue;
				}
				$chat.remove();
			}
		}
		eva.sessionId = result.session_id || "1";
		
		if (!api_reply) {
			return;
		}
		
		if (api_reply["Service Attributes"]) {
			// TODO: handle the service attributes here, temporary until a flow element is generated for them
			var handled = handleServiceAttributes(api_reply);
			if (handled) {
				return;
			}
        };
        
		if (api_reply.Flow) {
			
			processFlow(api_reply, eva_chat);
			
			if (has_warnings) {
				showUndoTip();
			}
		}
	}
	
	function showUndoTip() {
		if (!shown_undo_tip) {
			shown_undo_tip = true;
			addEvaChat("<small><em>Drag the microphone button to the left to undo the last utterance.</em></small>", null, false, true);
		}
	}
	
	function handleServiceAttributes(api_reply) {
		if (getField(api_reply, "Service Attributes.Call Support")) {
			if (eva.callbacks && eva.callbacks.navigateApp) {
				var ok = eva.callbacks.navigateApp("CallSupport");
				if (ok) {
					return true;
				}
			}
		}
		var tripInfoRequest = getField(api_reply, "Service Attributes.Trip Info.Request");
		
		if (tripInfoRequest == "Boarding Pass") {
			if (eva.callbacks && eva.callbacks.navigateApp) {
				var ok = eva.callbacks.navigateApp("BoardingPass");
				if (ok) {
					addEvaChat("Here is your Boarding Pass", eva_chat, true);
					return true;
				}
			}
		}
		if (tripInfoRequest == "Itinerary") {
			if (eva.callbacks && eva.callbacks.navigateApp) {
				var ok = eva.callbacks.navigateApp("Itinerary");
				if (ok) {
					addEvaChat("Showing your Itinerary", eva_chat, true);
					return true;
				}
			}
		}
		if (tripInfoRequest == "Boarding Time") {
			if (eva.callbacks && eva.callbacks.getBoardingTime) {
				var cbResult = eva.callbacks.getBoardingTime();
				addEvaChat("Your boarding time is "+cbResult, eva_chat, true);
				return true;
			}
		}
		if (tripInfoRequest == "Departure Time") {
			if (eva.callbacks && eva.callbacks.getDepartureTime) {
				var cbResult = eva.callbacks.getDepartureTime();
				addEvaChat("Your departure time is "+cbResult, eva_chat, true);
				return true;
			}
		}
		if (tripInfoRequest == "Arrival Time") {
			if (eva.callbacks && eva.callbacks.getArrivalTime) {
				var cbResult = eva.callbacks.getArrivalTime();
				addEvaChat("Your arrival time is "+cbResult, eva_chat, true);
				return true;
			}
		}
		
		if (tripInfoRequest == "Gate") {
			if (eva.callbacks && eva.callbacks.getGateNumber) {
				var gate = eva.callbacks.getGateNumber();
				addEvaChat("Your gate number is "+gate, eva_chat, true);
				return true;
			}
		}
	}
	
	
	function processFlow(api_reply, eva_chat) {
		var flows = api_reply.Flow || [];
		eva.prompt = eva.INITIAL_PROMPT;
		// if Eva asks a question then ask it
		for (var i=0; i<flows.length; i++) {
			if (flows[i].Type == FLOW_TYPE.Question) {
				eva.prompt = flows[i].SayIt;
				addEvaChat(flows[i].SayIt, eva_chat, true);
				return;
			}
		}
		
		// no questions, handle the flow items - speak statements and trigger search/callbacks 
		var indexesToSkip = {};
		for (var i=0; i<flows.length; i++) {
			if (indexesToSkip[i]) {
				console.log("Skipping "+i);
				continue;
			}
			var flow = flows[i];
			if (flow.ReturnTrip) {
				// override SayIt by ReturnTrip SayIt, if it exists
				flow.SayIt = flow.ReturnTrip.SayIt;
				// skip the return segment flow element 
				console.log("To skip "+flow.ReturnTrip.ActionIndex);
				indexesToSkip[flow.ReturnTrip.ActionIndex] = true;
			}

			var sayIt = flow.SayIt;
			if (i==0) {
				addEvaChat(sayIt, eva_chat, true);
			}
			else {
				addEvaChat(sayIt);
			}
			
			switch (flow.Type) {
				case "Statement":
					switch (flow.StatementType) {
					case "Understanding":
					case "Unknown Expression":
					case "Unsupported":
						showUndoTip();
						break;
					}
					break;
				
				case "Flight":
					findFlightResults(api_reply, flow);
					break;
				case "Car":
				case "Hotel":
				case "Explore":
				case "Train":
				case "Cruise":
					// TODO
					break;
					
			}
		}
	}
		
	function findFlightResults(api_reply, flow) {
		if (!eva.callbacks.flightSearch) {
			return "Flight Search is not supported."; // app did not implement the needed callback 
		}
		
		var related_location_idxes = getField(flow, "RelatedLocations", []);
		var from_location  = getField(api_reply, "Locations", [])[related_location_idxes[0]];
		var to_location  = getField(api_reply, "Locations", [])[related_location_idxes[1]];

		var from = getField(from_location, "Name", "").replace(/(\(.*\))/, '').trim();
		var from_code = getAirportCode(from_location);
		
		var to = getField(to_location, "Name", "").replace(/(\(.*\))/, '').trim();
		var to_code = getAirportCode(to_location);
		
		
		var depart_date_min = null;
	    var depart_date_max = null;
	    var departure_str = getField(from_location, "Departure.Date", null);
        if (departure_str != null) {
        	var time = getField(from_location, "Departure.Time", "");
			var depart_date = new Date(departure_str+ " "+time);
			var restriction = getField(from_location, "Departure.Restriction");
			if (restriction == "no_later") {
				depart_date_max = depart_date;
			}
			else if (restriction == "no_earlier") {
				depart_date_min = depart_date;
			}
			else {
				depart_date_max = depart_date_min = depart_date;
			}
			/*var days_delta = getField(from_location, "Departure.Delta");
			if (days_delta && days_delta.startsWith('days=+')) {
				days_delta = parseInt(days_delta.slice(6), 10);
				depart_date_max = new Date(+depart_date + 24*3600*1000*days_delta);
			}
			else {
				depart_date_max = depart_date_min;
			}*/
		}
        
		var return_date_min = null;
	    var return_date_max = null;
	    var return_str = getField(to_location, "Departure.Date", null);
        if (return_str != null) {
        	var time = getField(to_location, "Departure.Time", "");
			var return_date = new Date(return_str+ " "+time);
			var restriction = getField(to_location, "Departure.Restriction");
			if (restriction == "no_later") {
				return_date_max = depart_date;
			}
			else if (restriction == "no_earlier") {
				return_date_min = depart_date;
			}
			else {
				return_date_max = return_date_min = depart_date;
			}
			/*var days_delta = getField(to_location, "Departure.Delta");
			if (days_delta && days_delta.startsWith('days=+')) {
				days_delta = parseInt(days_delta.slice(6), 10);
				return_date_max = new Date(+return_date + 24*3600*1000*days_delta);
			}
			else {
				return_date_max = return_date_min;
			}*/
		}

        var sort = getField(api_reply, "Request Attributes.Sort");
        if (sort) {
        	var sort_by = null, sort_order=null;        	
        	if (sort.By) {
        		sort_by = sort.By.toLowerCase().replace(/ /g, '_');        		
        	}
        	if (sort.Order) {
        		sort_order = sort.Order.toLowerCase().replace(/ /g, '_');
        	}
        }
        var nonstop=null, redeye=null, airlines=null, food=null, seat_type=null, seat_class=null;
        var flight_attr = api_reply["Flight Attributes"];
        if (flight_attr) {
        	redeye = flight_attr.Redeye;
        	nonstop = flight_attr.Nonstop;
        	if (flight_attr.Airline) {
        		airlines = [];
        		for (var i=0; i<flight_attr.Airline.length; i++) {
        			airlines.push(flight_attr.Airline[i].IATA);
        		}
        	}
        	if (flight_attr.Food) {
        		food = flight_attr.Food.replace(/[ \-]/g, '');
        	}
        	seat_type = getField(flight_attr, "Seat", null);
        	seat_class = getField(flight_attr, "Seat Class", null);
        }
        var travelers = getField(api_reply, "Travelers", null);
        
        eva.callbacks.flightSearch( 
        		from, from_code,  
        		to, to_code, 
				depart_date_min,  depart_date_max,
                return_date_min,  return_date_max,
                travelers,
                nonstop, seat_class,  airlines,
                redeye,  food, seat_type,
                sort_by,  sort_order );
	}

	
	
	$(function() {
		var flag = false;
		var showTimeout = false;
		eva.recording = false;
		
		var $eva_record_button = $('#eva-voice_search_cont > .eva-record_button');
		
		$eva_record_button.removeClass('eva-is_recording');
		$eva_record_button.on('touchstart mousedown', function(e) {
			console.log("touchstart record_button");
			$('.eva-show_on_hold').removeClass('eva-hovered');
			if ($(this).is($eva_record_button)) {
				if (!showTimeout) {
					showTimeout = setTimeout(function() {
						showTimeout = false;
						window.navigator.vibrate(25);
						$('.eva-show_on_hold').fadeIn(500);
						$eva_record_button.addClass('eva-long-pressed');
					}, 450)
				}
			}
			return false;
		});
		
		$eva_record_button.on('touchmove', function(e) {
			var delta = e.originalEvent.touches[0].pageX - $(window).width()/2;
			var translate = 'translateX('+ delta +'px)';
			var width = $eva_record_button.width();
			if (Math.abs(delta) > width) {
				if (showTimeout) {
					clearTimeout(showTimeout);
					showTimeout = false;
				}
				$('.eva-show_on_hold').fadeIn(500);
				$eva_record_button.addClass('eva-long-pressed');
			}
			$eva_record_button.css({'transform': translate, '-webkit-transform':translate});
			var $trash_button = $('.eva-trash_button');
			if ($trash_button.is(":visible") 
					&& e.originalEvent.touches[0].pageX >  $trash_button.position().left-5
					&& e.originalEvent.touches[0].pageY >  $trash_button.position().top-5
			) {
				$trash_button.addClass('eva-hovered');
			}
			else {
				$trash_button.removeClass('eva-hovered');
			}
			
			var $undo_button = $('.eva-undo_button');
			if ($undo_button.is(":visible") 
					&& e.originalEvent.touches[0].pageX <  $undo_button.position().left+$undo_button.width()+5
					&& e.originalEvent.touches[0].pageY >  $undo_button.position().top-5
			) {
				$undo_button.addClass('eva-hovered');
			}
			else {
				$undo_button.removeClass('eva-hovered');
			}
			return false;
		});
		
		// to work both mouse and touch - without waiting for click delay
		$eva_record_button.on('touchend mouseup', function(e) {
			console.log("touchend record_button");
			$eva_record_button.removeClass('eva-long-pressed').css({'transform': 'translateX(0)', '-webkit-transform':'translateX(0)'})
			if (!flag) { // ignore quick double taps
				var hoveringTrash = $('.eva-trash_button').hasClass('eva-hovered');
				var hoveringUndo = $('.eva-undo_button').hasClass('eva-hovered');
				if (hoveringTrash) {
					window.navigator.vibrate(25);
					resetSession();
//					var texts = ["Rent a car in JFK on Friday, return it in Washington DC on Monday"];
//					var chat = addMeChat(texts[0]);
//					searchWithEva(texts, chat)
				}
				
				if (hoveringUndo) {
					window.navigator.vibrate(25);
					undoLastUtterance();
				}
			
				$('.eva-show_on_hold').removeClass('eva-hovered');
				$('.eva-show_on_hold').fadeOut(55);
				if (showTimeout) {
					clearTimeout(showTimeout);
					showTimeout = false;
				}
				
				if ($('.eva-undo_button').is(":visible") == false) {
				    flag = true;
				    setTimeout(function(){ flag = false; }, 100);
				    
				    startRecording();
					/* Below is needed for recorder that is background thread, not dialog (replace instead of the startRecording above)
					 * if (eva.recording) {
						if (!navigator.speechrecognizer || !navigator.speechrecognizer.cancelRecognizer) {
							console.log("cancelRecognizer not supported");
						}
						else {
							navigator.speechrecognizer.cancelRecognizer();
						}
						$eva_record_button.removeClass('eva-is_recording');
						if (meChat != null) {
							meChat.closest('li').slideUp(function(){ $(this).remove(); })
							meChat = null;
						}
						eva.recording = false;
					}
					else {
					    startRecording();
					}*/
				}
			}
			
			
			return false
		});
		
		$(document).on('backbutton', onBackKeyDown);

		/*$('#eva-chat-cont').on('click', '.eva-chat', function(e) {
			if (hasSearchResults) {
				$('#eva-search-results').fadeIn('fast', function() {
					$('#eva-search-results-bg').show();
				})
			}
			return false;
		});*/
		
		
		/*$('#search-results').load(function(){
			hasSearchResults= true;
			console.log('loaded the iframe to '+$(this).attr('src'));
	        $('.search-results').show();
	    });*/
		
		navigator.geolocation.getCurrentPosition(
			function(position) { // on success
				var coords = position.coords;
				eva.location = coords;
				console.log("Got location:  lat="+coords.latitude+', long='+coords.longitude+
							' accuracy='+coords.accuracy);  // heading, speed, 	altitude, altitudeAccuracy
			},
			function(error) { // on error
				console.error('Error getting locaiton: '+error.code+'  - '+error.message)
			}
		);
		
	});

})();
