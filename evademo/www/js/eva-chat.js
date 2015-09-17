
(function () {
	var $ = jQuery;
	// window.eva is the namespace for all things global (functions, variables) used by the Eva integration scripts
	window.eva = window.eva || {};
	
	eva.FLOW_TYPE = {
			Hotel: 'Hotel',
			Flight: 'Flight',
			Car: 'Car',
			Question: 'Question'
		}
		
	
	eva.get = function(object, path, defVal) {
		var tokens = path.split('.');
		for (var i=0; i<tokens.length; i++) {
			object = object[tokens[i]];
			if (object === undefined) {
				return defVal;
			}
		}
		return object;
	}
	
	eva.getAirportCode = function (location) {
		if (location["All Airports Code"])
			return location["All Airports Code"];
			
		if (location["Airports"]) {
			return location["Airports"].split(',')[0];
		}
		return '';
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

	function addEvaChat(text, existing_evachat, speakIt) {
		var $chat;
		if (existing_evachat) {
			existing_evachat.html(text.replace(/<script/gi, '&lt;script'));
			$chat = existing_evachat;
		}
		else {
			$chat = $('<div data-position="eva-right" class="eva-notViewed eva-animBlock eva-right-bubble">'+text.replace("<","&lt;")+"</div>");
			var $li = $('<li class="eva-server-chat"></li>');
			$li.append($chat);
			$('#eva-chat-cont').append($li);
		}
		if (speakIt) {
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
	
	function stopSearchResults() {
		for (var i=0; i<window.frames.length; i++) {
			window.frames[i].stop();
		}
		$('.eva-search-results').hide();
	}
	
	function resetSession(quiet) {
		stopSearchResults();
//		hasSearchResults = false;
		$('#eva-chat-cont').empty();
		eva.prompt = eva.INITIAL_PROMPT	
		if (!quiet) {
			addMeChat("Start new search.")
			addEvaChat("Starting a new search, how may I help you?");
			speak("Starting a new search, how may I help you?");
		}
		eva.sessionId = "1";
	}
	
	function undoLastUtterance() {
		stopSearchResults();
		var $chatItems = $('#chat-cont > li');
		for (var i= $chatItems.length-1; i>0; i--) {
			var $chat = $($chatItems[i]);
			var found = $chat.hasClass('me-chat');
			$chat.slideUp(function(){ $(this).remove() })
			if (found) {
				break;
			}
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
			success: function(result) {
				console.log("Eva result is "+JSON.stringify(result, null, 4));
				var api_reply = result.api_reply;
				if (user_chat && api_reply && api_reply.ProcessedText) {
					
					
					var spans = [];
					//user_chat.text(api_reply.ProcessedText);
					
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
					stopSearchResults();
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
					var tripInfoRequest = (api_reply["Service Attributes"]["Trip Info"]||{})["Request"];
					if (tripInfoRequest == "Boarding Pass") {
						if (eva.callbacks && eva.callbacks.navigateApp) {
							var ok = eva.callbacks.navigateApp("BoardingPass");
							if (ok) {
								addEvaChat("Here is your Boarding Pass", eva_chat, true);
								return;
							}
						}
					}
					if (tripInfoRequest == "Itinerary") {
						if (eva.callbacks && eva.callbacks.navigateApp) {
							var ok = eva.callbacks.navigateApp("Itinerary");
							if (ok) {
								addEvaChat("Showing your Itinerary", eva_chat, true);
								return;
							}
						}
					}
					if (tripInfoRequest == "Boarding Time") {
						if (eva.callbacks && eva.callbacks.getBoardingTime) {
							var d = eva.callbacks.getBoardingTime();
							addEvaChat("Your boarding time is "+d, eva_chat, true);
							return;
						}
					}
					if (tripInfoRequest == "Departure Time") {
						if (eva.callbacks && eva.callbacks.getDepartureTime) {
							var d = eva.callbacks.getDepartureTime();
							addEvaChat("Your departure time is "+d, eva_chat, true);
							return;
						}
					}
					if (tripInfoRequest == "Arrival Time") {
						if (eva.callbacks && eva.callbacks.getArrivalTime) {
							var d = eva.callbacks.getArrivalTime();
							addEvaChat("Your arrival time is "+d, eva_chat, true);
							return;
						}
					}
					
					if (tripInfoRequest == "Gate") {
						if (eva.callbacks && eva.callbacks.getGateNumber) {
							var gate = eva.callbacks.getGateNumber();
							addEvaChat("Your gate number is "+gate, eva_chat, true);
							return;
						}
					}
		        };
		        
				if (api_reply.Flow) {
					var flow = api_reply.Flow;
					eva.prompt = eva.INITIAL_PROMPT;
					for (var i=0; i<flow.length; i++) {
						if (flow[i].Type == eva.FLOW_TYPE.Question) {
							eva.prompt = flow[i].SayIt;
							speak(flow[i].SayIt);
							if (eva_chat) {
								eva_chat.text(flow[i].SayIt);
								scrollToBottom();
							}
							else {
								addEvaChat(flow[i].SayIt);
							}
							return;
						}
					}
					
					var indexesToSkip = {};
					var first = true;
					for (var i=0; i<flow.length; i++) {
						if (indexesToSkip[i]) {
							console.log("Skipping "+i);
							continue;
						}
						if (flow[i].ReturnTrip) {
							// override SayIt by ReturnTrip SayIt, if it exists
							flow[i].SayIt = flow[i].ReturnTrip.SayIt;
							// skip the return segment flow element 
							console.log("To skip "+flow[i].ReturnTrip.ActionIndex);
							indexesToSkip[flow[i].ReturnTrip.ActionIndex] = true;
						}

						var sayIt = flow[i].SayIt;
						if (i==0) {
							if (eva_chat) {
								eva_chat.text(sayIt);
								scrollToBottom();
							}
						}
						else {
							addEvaChat(sayIt);
						}
						if (first) {
							speak(sayIt);
							first = false;
						}
					}
					
					
					
					eva.process_response(api_reply, eva_chat);
				}
				
			},
			error: function(e) {
				if (eva_chat)
					eva_chat.text("There was an error, try again later.");
				console.error("Error sending to Eva"+ e);
				alert("Error sending to Eva: "+e);
			}
		})
	}

	var meChat = null; 
	function start_chat() {
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
		if (eva.recording) {
			if (!navigator.speechrecognizer || !navigator.speechrecognizer.cancelRecognizer) {
				console.log("cancelRecognizer not supported");
			}
			else {
				navigator.speechrecognizer.cancelRecognizer();
			}
			eva.recording = false;
			$('.eva-record_button').removeClass('eva-is_recording');
			if (meChat != null) {
				meChat.closest('li').slideUp(function(){ $(this).remove(); })
				meChat = null;
			}
			return false;
		}
		if ($('#eva-search-results').is(":visible")) {
			speechSynthesis.cancel();
			$('#eva-search-results-bg').hide()
			$('#eva-search-results').fadeOut();
			return false;
		}
		
		if ($('#eva-cover').is(":visible")) {
			speechSynthesis.cancel();
			$('#eva-cover').fadeOut(function() {
				resetSession(true);
			});
			return false;
		}
		
		history.back();
		return false;
	}

//	window.onerror = function(message, url, lineNumber) {  
//	  //alert("Error: "+message+"  at line "+lineNumber+"  in url: "+url);
//	  console.error("Error: "+message+" at line "+lineNumber+"  in url: "+url);
//	  return true;
//	};  
	
	eva.process_response = function(api_reply) {
		
		if (api_reply.Flow) {
			// Examine flow to decide what kind of search to activate
			var flows = api_reply.Flow || [];
			for (var i=0; i<flows.length; i++) {
				var flow = flows[i];
				if (flow.Type == eva.FLOW_TYPE.Question) {
					// don't trigger search if there is a question
					return;
				}
			}
			for (var i=0; i<flows.length; i++) {
				var flow = flows[i];
				var from,to;
				if (flow.Type == eva.FLOW_TYPE.Flight) {
					hasFlight = true;
					if (flow.ReturnTrip) {
					}
	                from = flow.RelatedLocations[0];
	                to = flow.RelatedLocations[1];
	                isComplete = true; 
				}
			}
			
		}
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
//			if ($(this).is($('#voice_search_cont > .record_button'))) {
//				if (!showTimeout) {
//					showTimeout = setTimeout(function() {
//						showTimeout = false;
//						window.navigator.vibrate(25);
//						$('.show_on_hold').fadeIn(500);
//						$('.record_button').addClass('long-pressed');
//					}, 450)
//				}
//			}
			return false;
		});
		
		$eva_record_button.on('touchmove', function(e) {
			var delta = e.originalEvent.touches[0].pageX - $(window).width()/2;
			var translate = 'translateX('+ delta +'px)';
			var width = $eva_record_button.width();
			if (Math.abs(delta) > width) {
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
					if (eva.recording) {
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
					    start_chat();
					}
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
		
	})

})();
