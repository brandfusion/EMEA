
			$(function(){

				var config = {
					"name":"Directions EMEA 2017", 
					"value": "nav2017emea", 
					"id":"DEMEA2017",
					"apiKey": "27fb712f8df94818af9ba31ee2fd2783",
					"timeAdjust": "2",
					"conferencePath": "870c234b-cc83-44c7-abc4-7fb70a76c51e",
					"presentingPartner": "4404f28e-5b93-4da4-94d1-36fdf7d06597",
					"selectedFilters" : ["8a3b983a-3133-4589-bcf4-89616ffa2500" , "53fd7610-428b-461d-9a7f-876ca66d50ac"] 
				}





				function Schedule(data , id) {   
				 
					console.log("SCHEDULE DATA" , data);

				}

				function fn_equal_heights(target) {

					var heights = [];

					// the timeout function waits for the elements to be appended on the page , in order to get the correct height 
					$.each(target , function(i , el){
						setTimeout(function(){
							heights.push(el.clientHeight);
						} , 1000);
					});

					setTimeout(function(){
						var maxHeight = Math.max.apply(Math , heights);
						$.each(target , function(){
							$(this).css('height' , maxHeight + 'px');
						});
						// console.log(maxHeight);
					} , 1000);		
				}



				function buildFilterCategories(arr) {
					//console.log(arr);

					var output = '';
					_.map(arr , function(obj){
							output += '<li>' + '<a>' + obj.name + '  <span class="glyphicon glyphicon-plus" style="position: absolute; padding: 1em; right: 5px;"></span>' + '</a>';
							output += '<ul>';
							_.map(obj.subcategories , function(o){
								output += '<li class="filter-results" id="'+ o.id +'">' + o.name + '</li>';
							});
							output += '</ul>';

							output += '</li>';
					});
					
					$("#filterSessionsContainer").append(output);
				}



				function handleFilterCategories(data) {
			
					var firstLevel = _.reduce(data , function(result , value , key){
						if(value.parentid == "") {
							var obj = {};
							obj.name = value.name;
							obj.id = value.id;

						  result.push(obj);
						} else {
							result = result;
						}

						return result;
					} , []);


					var categoriesFilter = _.reduce(firstLevel , function(result , value , key){
						

						var arraySubcategories = _.filter(data , function(obj){
							return obj.parentid == value.id;
						});

						value.subcategories = arraySubcategories;
						result.push(value);
					  return result;

					} , []);


					categoriesFilter = _.filter(categoriesFilter , function(obj) {
						var isFound = false;

						_.map(config.selectedFilters , function(val){
							if(obj.id == val) {
								isFound = true;
							}
						});

						return isFound;
					});

					// console.log(categoriesFilter);
					buildFilterCategories(categoriesFilter);

				}


				function GetAPIData(link){
				  var deferred = $.Deferred();
				  $.ajax({
				    url: link,
				    type: 'GET',
				    dataType: 'jsonp'
				  })
				  .done(function(data){
				    deferred.resolve(data);
				  })
				  .fail(function(error) {
				    console.log("error API:", link);
				    deferred.reject();
				  });
				  return deferred.promise();
				}

				function getData(event){
				  var deferred = $.Deferred();
				  var eventId = event.value;
				  var eventApi = event.apiKey;
				  var eventTimeAdjust = parseFloat(event.timeAdjust);
				  var daysUrl = 'http://api.eventpoint.com/2.3/program/days?code='+eventId+'&apikey=' + eventApi;
				  var topicsUrl = 'http://api.eventpoint.com/2.3/program/topics?code='+eventId+'&apikey=' + eventApi + '&pagesize=200&minpublishstatus=0';
				  var categoriesUrl = 'https://api.eventpoint.com/2.3/program/categories?code='+eventId+'&apikey=' + eventApi;
				  var roomsUrl = 'https://api.eventpoint.com/2.3/program/rooms?code='+eventId+'&apikey=' + eventApi;
				  var speakersUrl = 'https://api.eventpoint.com/2.3/program/speakers?code='+eventId+'&apikey=' + eventApi;
				
				  //console.log('event',event);



				  $.when(GetAPIData(daysUrl),GetAPIData(topicsUrl),GetAPIData(categoriesUrl),GetAPIData(roomsUrl),GetAPIData(speakersUrl)).then(function(v1,v2,v3,v4,v5){
				    // var conferencePathArray = conferenceArray(v3, event);    
				    // console.log("days",v1);
				    console.log("topics",v2);
				    handleFilterCategories(v3);
				    // console.log("categories",v3);
				    // console.log("rooms",v4);
				    // console.log("speakers",v5);    
				    var scheduleData = _.reduce(v1, function(result, value, key){
				      var date = value.date;
				      // date = date.split('T')[0];
				      date = moment(date).format("YYYY-MM-DD");

				      var obj = {};
				      obj.date = date;
				      obj.topics = _.chain(v2.results)
				      .filter(function(o){
				        var dateAdjusted = "";
				        dateAdjusted = moment(o.start).utcOffset(eventTimeAdjust).format("YYYY-MM-DD");
				        return dateAdjusted == date;
				      })
				      .reduce(function(result, value, key){
				        var obj = {};
				        var roomsArray = _.chain(v4)
				                          .filter(function(o){
				                              return o.name == value.room;
				                          })
				                          .uniqBy("id")
				                          .value();
				        // var partnerId = getPartnerId(v3);
				        var partnerId = event.presentingPartner;
				                 
				        // console.log("SPEAKERS IDS " , speakersArray);
				        // console.log("PARTNER ID: " , partnerId);

				        obj.title = value.title;
				        obj.speakers = _.reduce(value.speakerids , function(result , value , key){
				          var obj = {};
				          var speakersName = _.filter(v5.results , function(o){
				            return o.id == value;
				          });

				          if(_.size(speakersName) > 0) {
				            obj.name = speakersName[0].name;
				          } else {
				            obj.name = null;
				          }

				          obj.id = value;
				          result.push(obj);
				          return result;
				        },[]);
				        obj.room = {};
				        obj.room.capacity = 0; //backup api
				        obj.room.id = undefined; //backup api
				        // console.log("roomsArray[0]", roomsArray )
				        // console.log("roomsArray[0] size ", _.size(roomsArray) )
				        // console.log("rooms v4", v4)
				        // console.log("current Value", value)

				        if (_.size(roomsArray) !== 0) {          
				          obj.room.capacity = roomsArray[0].capacity;  // verification added because US 2017 does not have a room name set to a topic and capacity property cant be found
				        }
				        obj.id = value.id;
				        obj.sessionCode = value.code;
				        obj.description = value.description;
				        obj.publishingStatus = value.publishingstatus;
				        
				        obj.room.title = value.room;
				        
				        if (_.size(roomsArray) !== 0) {    
				          obj.room.id = roomsArray[0].id;
				        }
				        obj.categoryids = value.categoryids;
				        obj.start = moment(value.start).utcOffset(eventTimeAdjust).format("HH:mm");
				        obj.finish = moment(value.finish).utcOffset(eventTimeAdjust).format("HH:mm");
				                      // console.log("timeadjust", Math.abs(eventTimeAdjust), "times:",obj.start, "timesoriginal", value.start);

				        // obj.conferencePath = _.filter(conferencePathArray, function(object){
				        //   return _.includes(value.categoryids, object.id)
				        // });

				        var isPartner = _.includes(value.categoryids, partnerId);         
				        if(isPartner === true) {
				          obj.isPartner = true;
				        } else {
				          obj.isPartner = false;
				        }
				        result.push(obj);
				        return result;

				        },[])
				      .sortBy("start")
				      .value();
				      result.push(obj);
				      return result;
				    },[]);


				    // $("#schedule").empty().removeClass("animated fadeOut"); // CLEARS SCHEDULE TABLE
				    deferred.resolve(scheduleData);
				  },function() {
				    //error getting API => select again
				    // resetWhenDataIsInvalid();
				    deferred.reject();

				  });
				  return deferred.promise();
				}
				
				function buildSchedule(dataset) {
					// console.log(dataset);					

					var output = '';

					$("#showSessions").empty();
					if(_.size(dataset) > 0) {

						

						_.map(dataset , function(day){

						


								if(day.topics.length > 0) {
										output += '<div class="col-md-12">';
										output += '<p style="text-align: center; padding-top: 0.5em">' + day.date + '</p>';

										_.map(day.topics , function(o){
												var title = o.title;
												var start = o.start;
												var finish = o.finish;
												var room = o.room.title;

												output += '<div class="sessionWrapper" style="border: 2px solid black; padding: 0.5em; margin-bottom: 0.5em; font-size: 12px">';

												output += '<p style="border-bottom: 1px solid red; padding-bottom: 0.5em">' + title + '</p>';
												output += '<p>' + "Room: " + room + '</p>';
												output += '<p>' + "Start: " + start + " End: " + finish + '</p>';

												output += '</div>';
										});

										output += '</div>';
								} 


						});


					} 

					$("#showSessions").append(output);
					

				}

				$.when(getData(config)).then(function(data){

				 

				  var dataSet = data;
				  console.log("dataset",dataSet);
				  // array in which we store the filters
				  var arrayOfFilters = [];

				  // show all sessions by default
				  buildSchedule(dataSet);

				  // get cookies 
				  getCookiesData();

				  // click handler for first level categories 
				  $("#filterSessionsContainer a").on("click" , function(e){
				  		var options = $(this).next(); // grab the ul

				  		options.toggle("slow");

				  		$(this).find("span").toggleClass("glyphicon glyphicon-plus glyphicon glyphicon-minus");
				  });


				  // click handler for filtering options
				  $("body").on("click" , ".filter-results", function(e){
				 
				  		var filterId = $(this).attr("id");
				  		var text = $(this).text();

			

				  		addToSelectedFilters(filterId , text);

				  		// console.log(arrayOfFilters);

				  		var finalOutputWithFilters = _.reduce(arrayOfFilters , function(result , value , key){
				  			

				  			if(key == 0) {
				  				result = setOutputForFilters(dataSet , value.id);
				  			} else {
				  				result = setOutputForFilters(result , value.id);
				  			}


				  			return result;
				  		} , []);

				  		// console.warn(finalOutputWithFilters);

				  	
				  		buildSchedule(finalOutputWithFilters);

				  });

				  // remove from selected filters on click
				  $("body").on("click" , ".applied-filter > span" , function(e){

				  		var idOfLi = $(this).parent().attr("id");
				  		var textOfLi = $(this).parent().text();

				  		_.remove(arrayOfFilters , function(arg){
				  			return arg.id == idOfLi;
				  		});

				  		removeToSelectedFilters(idOfLi , textOfLi);

				  		renderSelectedFilters(arrayOfFilters);


				  		// show remove all filters button if the length of the filters is greater than 0 
				  		if($("#selectedSessions").find("ul").children().length == 0) {
				  			$("#removeFilters").css("display" , "none");


				  			// empty the sessions wrapper
				  			$("#showSessions").empty();

				  			// show all sessions
				  			buildSchedule(dataSet);


				  		} else {
				  			$("#removeFilters").css("display" , "block");
				  		}

				  });


				  $("body").on("click" , "#removeFilters" , function(e){
				  		console.log("Remove all filters...");
				  		arrayOfFilters = [];
				  		renderSelectedFilters(arrayOfFilters);
				  		$("#removeFilters").css("display" , "none");

				  		// empty the sessions wrapper
				  		$("#showSessions").empty();

				  		// show all sessions
				  		buildSchedule(dataSet);


				  		Cookies.set("filtered" , "[]");


				  });


	  			  function setOutputForFilters(dataSet , filterId) {

	    			  		var filtered_days = _.reduce(dataSet , function(result , value , key) {
	    			  				var obj = {};
	    			  				obj.date = value.date;

	    			  				var filtered_topics = _.reduce(value.topics , function(result2 , value2 , key2) {
	    			  						var category_matched = _.filter(value2.categoryids , function(val) {
	    			  								var isFound = false;

	    			  								// _.map(arrayOfFilters , function(_obj) {
	    			  								// 		if(_obj.id == val) {
	    			  								// 				isFound = true;
	    			  								// 		}
	    			  								// });

	    			  								if(filterId == val) {
	    			  									isFound = true;
	    			  								}

	    			  							
	    			  								return isFound;
	    			  						});

	    					  				if(_.size(category_matched) > 0) {
	    			  							result2.push(value2);
	    			  						} else {
	    			  							result2 = result2;
	    			  						} 		

	    	  								return result2;
	    			  				} , []);


	    			  				obj.topics = filtered_topics;

	    			  				result.push(obj);

	    			  				return result;
	    			  		} , []);


	    			  		return filtered_days;

	  
	  			  }

				  function renderSelectedFilters(arr) {
				  	$("#selectedSessions").empty();
				  	var output = '';

				  	output += '<button id="removeFilters" style="margin:0em 0em 1em 3em; border-radius: 0px; border-color: black" class="btn btn-default">Remove filters</button>';
				  	output += '<ul>';

				  	_.map(arr , function(o){
				  		output += '<li class="applied-filter" id="'+ o.id +'">' + o.name + ' <span class="glyphicon glyphicon-remove"></span>' + '</li>';
				  	});

				  	output += '</ul>';


				  	$("#selectedSessions").append(output);


				  }

				  function removeToSelectedFilters(id , text) {

				  	var finalOutputWithFilters = _.reduce(arrayOfFilters , function(result , value , key){

				  		if(key == 0) {
				  			result = setOutputForFilters(dataSet , value.id);
				  		} else {
				  			result = setOutputForFilters(result , value.id);
				  		}


				  		return result;
				  	} , []);

				  	// console.warn(finalOutputWithFilters);

			 		renderSelectedFilters(arrayOfFilters);
			  		removeFilterFromCookie(id);

			  		buildSchedule(finalOutputWithFilters);
				  }



				  function getCookiesData() {
				  	var cookiesData = Cookies.get("filtered");

				  	

				  	if(cookiesData !== undefined) {
				  		var cookies = $.parseJSON(cookiesData);
				  		arrayOfFilters = cookies;
				  	}

				  	// console.warn(arrayOfFilters);


				  	var finalOutputWithFilters = _.reduce(arrayOfFilters , function(result , value , key){
				  		

				  		if(key == 0) {
				  			result = setOutputForFilters(dataSet , value.id);
				  		} else {
				  			result = setOutputForFilters(result , value.id);
				  		}


				  		return result;
				  	} , []);

				  	// console.warn(finalOutputWithFilters);

				  	console.log(arrayOfFilters);

				  	if(_.size(arrayOfFilters) > 0) {
				  		buildSchedule(finalOutputWithFilters);
				  	} else {
				  		buildSchedule(dataSet);
				  	}

				  	
				  	
				  	renderSelectedFilters(arrayOfFilters);
				  }

				  function addFilterToCookie(arr) {

						var arrString = JSON.stringify(arr);
						Cookies.set("filtered" , arrString , 1);

				  }


				  function removeFilterFromCookie(filterId) {
				  		// console.log(filterId);

				  		// var cookie = Cookies.get("filtered") === undefined ? "[]" : cookie;

				  		var cookie = Cookies.get("filtered");

				  		if(cookie !== undefined) {

				  			var removeCookie = $.parseJSON(cookie);

				  			removeCookie = _.filter(removeCookie , function(o){
				  				return o.id != filterId;
				  			});


				  			addFilterToCookie(removeCookie);
				  			// renderSelectedFilters(removeCookie);
				  			getCookiesData();
				  			
				  			// console.log(removeCookie);

				  			removeCookie = JSON.stringify(removeCookie);

				  		}
	
				  		
				  }

				  function addToSelectedFilters(id , text) {
				  	var target = $("#selectedSessions").find("ul");




				  	var object = {};
				  	object.id = id;
				  	object.name = text;

						
				  	var isThere = _.filter(arrayOfFilters , function(o){
				  		return o.id == object.id;
				  	});

				  	var isInArray = _.size(isThere) ? true : false;

				  	if(!isInArray) {
				  		arrayOfFilters.push(object);
				  		addFilterToCookie(arrayOfFilters);
				  		
				  	} else {
				  		alert("The filter is already applied!");
				  		return;
				  	}


				  	// console.log(arrayOfFilters);

				  	renderSelectedFilters(arrayOfFilters);

				  }


				});
					
			});



//# sourceMappingURL=main.js.map
