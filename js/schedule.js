var scheduleConfig = {
  timeframe: [6,23],
  gridHeightCell: 10,
  gridWidthCell: 200,
}

function createTimeGridArray(){
  var timeframeArray = []
  for (var i = scheduleConfig.timeframe[0]; i < scheduleConfig.timeframe[1]; i++) {
    timeframeArray.push(i);
  }
  var timeTable = _.reduce(timeframeArray, function(result, val, key){
    var intervals = ["00","05","10","15","20","25","30","35","40","45","50","55"];
    var hour = val < 10 ? "0"+ val : val;
    var obj = {};
    obj.hour = hour;
    obj.intervals = [];
    _.map(intervals, function(inter){
      (obj.intervals).push(inter);
    });
    result.push(obj);
    return result;
  },[]);

  return timeTable;
}


function createFlatTimeGridArray(){
  var timeframeArray = []
  for (var i = scheduleConfig.timeframe[0]; i < scheduleConfig.timeframe[1]; i++) {
    timeframeArray.push(i);
  }
  var timeTable = _.reduce(timeframeArray, function(result, val, key){
    var intervals = ["00","05","10","15","20","25","30","35","40","45","50","55"];
    var hour = val < 10 ? "0"+ val : val;
    var array = [];
    _.map(intervals, function(inter){
      array.push(hour+':'+inter);
    });
    result = _.concat(result, array);
    return result;
  },[]);

  return timeTable;
}
function loading(arg) {
  if(arg == true) {
    $('#loading').removeClass('fadeOut').removeClass('fadeIn');
    $('#loading').addClass("active");
    setTimeout(function(){
      $('#loading').addClass('fadeIn');
    }, 300);
  } else {
    $('#loading').addClass('fadeOut');
    setTimeout(function(){
      $('#loading').removeClass("active").removeClass('fadeOut').removeClass('fadeIn');
    }, 300);
  }
}

// presetning partner is now in event.js configuration
// function getPartnerId(array) {
//   var partnerIdArray = _.filter(array , function(o){
//             return o.name == "Presenting Partner";
//         }); 

//         var partnerExists = _.size(partnerIdArray) > 0 ? true : false;
//         var partnerId = "";
//         if (partnerExists == true) {
//           partnerId = partnerIdArray[0].id;
//         } else {
//           partnerId = "PARTNER_DOES_NOT_EXIST";          
//         }

//         return partnerId;
// }
function conferenceArray(data, event){
  var colors = ["#ff3636" , "#f322a2" , "#a72fdc" , "#7031f3" , "#4679ff" , "#05caf3" , "#20ec9f" , "#42ec20" , "#f3e910" , "#a90000" , "#a90067" , "#8500a9" , "#5e00a9", "#2000a9" , "#0065a9" , "#00a988", "#00a91b" , "#6aa900", "#a95c00"];


  var conferencePathId = event.conferencePath;

  // var conference = _.filter(data , function(obj){
  //   return obj.name === "Conference Path";
  // });
  // var conferencePathExists = _.size(conference) > 0 ? true : false;
  // var conferencePathId = "";
  // if (conferencePathExists == true) {
  //   conferencePathId = conference[0].id;
  // } else {
  //   conferencePathId = "CONFERENCEPATHDOESNOTEXIST";
  // }
  var conferencePathArrayRaw = _.filter(data, function(obj){
    return obj.parentid === conferencePathId;
  })
  var conferencePathFinal = _.reduce(conferencePathArrayRaw, function(result, value, key){
    var obj = {};
    obj.id = value.id;
    obj.color = colors[key];
    obj.name = value.name;
    result.push(obj);
    return result;
  },[]);

  return conferencePathFinal;
}
function resetWhenDataIsInvalid() {
  console.error("Error loading API");
  $('#event-select-wrapper').show();
  loading(false);
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
  loading(true);
  console.log('event',event);
  $.when(GetAPIData(daysUrl),GetAPIData(topicsUrl),GetAPIData(categoriesUrl),GetAPIData(roomsUrl),GetAPIData(speakersUrl)).then(function(v1,v2,v3,v4,v5){
    var conferencePathArray = conferenceArray(v3, event);    
    // console.log("days",v1);
    console.log("topics",v2);
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

        obj.conferencePath = _.filter(conferencePathArray, function(object){
          return _.includes(value.categoryids, object.id)
        });

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


    $("#schedule").empty().removeClass("animated fadeOut"); // CLEARS SCHEDULE TABLE
    deferred.resolve(scheduleData);
  },function() {
    //error getting API => select again
    resetWhenDataIsInvalid();
    deferred.reject();

  });
  return deferred.promise();
}
function buildEventSelect(eventData){
  var output = '<select id="header-event-select" class="form-control">';
  output += '<option value="" disabled selected>Pick an event</option>';
  _.map(eventData, function(o){

      output += '<option value="'+o.id+'">'+o.name+'</option>';

  });
  output += '</select>';
  return output;
}
function buildEventSelectPrimary(eventData){
  var output = "";
  output += '<div id="event-select-wrapper">';
  output += '<select id="event-select" class="form-control">';
  output += '<option value="" disabled selected>Pick an event</option>';
  _.map(eventData, function(o){
    output += '<option value="'+o.id+'">'+o.name+'</option>';
  });
  output += '</select>';
  output += '</div>';
  return output;
}
function buildDaySelect(data){
  var days = _.reduce(data, function(result, value, key){
    result.push(value.date);
    return result;
  },[]);

  var output = '<select id="header-day-select" class="form-control">';
  // output += '<option value="" disabled seleted>Pick a date</option>';
  _.map(days, function(val){
    output += '<option value="'+val+'">'+val+'</option>';
  });
  output += '</select>';
  return output;}

  function buildConferencePathSelect(data){
    var conferencePathArray = _.chain(data)
                                .reduce(function(result, value, key){
                                  var topicConferenceArray = _.reduce(value.topics, function(result2, value2, key2){                                
                                    result2 = _.concat(result2, value2.conferencePath);
                                    return result2;
                                  },[]);
                                                        
                                  result = _.concat(result, topicConferenceArray);
                                  return result;
                                },[])
                                .uniqBy("id")
                                .sortBy(function(o){return o.name})
                                .value();
    var output = '<select id="header-conference-select" class="form-control">';
    output += '<option value="" seleted>Pick a conference path</option>';
    _.map(conferencePathArray, function(o){
      output += '<option value="'+o.id+'">'+o.name+'</option>';
    });
    output += '</select>';
    return output;
  }
  function renderHeader(data, event) {
    var output = '<div id="schedule-header" class="form-inline animated fadeIn">';
    output += '<i class="fa fa-calendar" aria-hidden="true"></i>';
    output += buildEventSelect(eventData);
    output += buildDaySelect(data);
    output += buildConferencePathSelect(data);
    output += '</div>';
    $("#schedule").prepend(output); 
  $("#header-event-select").val(event.id);
}
function renderRooms(data){  
  $('#header-rooms').remove()
  var rooms = _.chain(data.topics)
              .reduce(function(result, value, key){
                var obj = {};

                obj.name = value.room.title;
                obj.capacity = value.room.capacity;
                obj.id =  value.room.id;

                result.push(obj);
                return result;
              },[])
              .uniqBy("id")
              .sortBy("capacity")
              .value();
  rooms = rooms.reverse(); //sort desc

  var width = _.size(rooms)*scheduleConfig.gridWidthCell + 100;

  var output = "";
  output += '<div id="header-rooms" class="animated fadeIn" style="width: '+width+'px;">';
  _.map(rooms, function(o){
    output += '<div class="item">'+o.name+' ('+ o.capacity+')</div>'
  });
  output += '</div>';

  $('#schedule').prepend(output);
}
function renderGrid(timeframe){
  var output = '<div id="grid" class="animated fadeIn">';
  var timeTable = createTimeGridArray(); 
  _.map(timeTable, function(o){
    output += '<div class="hours">';
    _.map(o.intervals, function(interval){
      output += '<div class="intervals"><span>'+o.hour+':'+interval+'</span><span>'+o.hour+':'+interval+'</span></div>'
    });
    output += '</div>';
  });
  output += '</div>'; 

  $("#schedule").append(output);  
  $('#schedule .intervals').css("height",scheduleConfig.gridHeightCell+"px").css("lineHeight", scheduleConfig.gridHeightCell + 'px');
}

function renderCard(o, topics){
  var timeTable = createFlatTimeGridArray(); 
  var rooms = _.chain(topics)
              .reduce(function(result, value, key){
                result.push(value.room);
                return result;
              },[])
              .uniqBy("id")            
              .sortBy("capacity")
              .value();
  rooms = rooms.reverse(); 
  var offsetLeft = _.findIndex(rooms, {"title": o.room.title})*scheduleConfig.gridWidthCell;
  var offsetTop = _.indexOf(timeTable, o.start)*scheduleConfig.gridHeightCell;  
  var height = (_.indexOf(timeTable, o.finish) - _.indexOf(timeTable, o.start))*scheduleConfig.gridHeightCell;
  var output = "";
  if(o.isPartner === true) { 
    output += '<div class="item partner" style="width:'+scheduleConfig.gridWidthCell+'px; height:'+height+'px; top:'+offsetTop+'px; left:'+offsetLeft+'px;">';
  } else {
    output += '<div class="item" style="width:'+scheduleConfig.gridWidthCell+'px; height:'+height+'px; top:'+offsetTop+'px; left:'+offsetLeft+'px;">';
  }
  
  output += '<div class="content">';
  output += '<div class="conference-wrapper">';
  _.map(o.conferencePath, function(o){
    output += '<div class="conference" data-color="'+o.color+'" data-conference-id="'+o.id+'" style="background-color:'+o.color+';"></div>'
  });
  output += '</div>';
  output += '<h2>'+o.title+'</h2>';

  if(isSmallCard(o.start , o.finish) === true) {
    output += renderNarrowSpeakers(o.speakers);
  } else {
    output += renderSpeakers(o.speakers);
  }
  output += '</div>';

  output += '<div class="content-hidden">';
  output += '<p>' + o.sessionCode + '</p>';
  output += '<p>' + o.room.title + '</p>';
  output += '<p>' + o.start + " - " + o.finish + '</p>';

  output += '</div>'

  output += '</div>';
  return output;
}


function renderNarrowSpeakers(arr) {
  var output = '';
  var arrayWithoutNull = _.filter(arr, function(o){
    return o.name !== null;
  });
  if(_.size(arrayWithoutNull ) > 0 ) {
    output += '<div class="speakers">';  
    output += '<div class="speaker-icon"><i class="fa fa-user" aria-hidden="true"></i></div>';  
    output += '<div class="speaker-content">';
    output += '<p>...</p>';
    output += '</div>';
    output += '</div>';
  }

  return output;
}



function renderSpeakers(arr) {
  var output = '';
  var arrayWithoutNull = _.filter(arr, function(o){
    return o.name !== null;
  });
  if(_.size(arrayWithoutNull) > 0 ) {
    output += '<div class="speakers">';  
    output += '<div class="speaker-icon"><i class="fa fa-user" aria-hidden="true"></i></div>';
    output += '<div class="speaker-content">';
    _.map(arrayWithoutNull , function(o){
        output += '<p>' + o.name + '</p>';
    });

    output += '</div>';
    output += '</div>';
  }
  return output;
}


function isSmallCard(start , end) {  
  var timeslots = createFlatTimeGridArray();
  var result = (_.indexOf(timeslots , end)) - (_.indexOf(timeslots , start));
  
  if(result <= 2) {
    return true;
  } else {
    return false;
  }
    
}

function getRoomConflictArray(data) {
  var rawConflictArray = [];
  var timeframe = createFlatTimeGridArray();
  var arrayTimeIndexInterval = _.reduce(data, function(result, value, key){
    var obj = {};
    obj.id = value.id;
    obj.startIndex = _.indexOf(timeframe, value.start);
    obj.endIndex = _.indexOf(timeframe, value.finish);
    obj.room = value.room;
    result.push(obj);
    return result;
  },[]); 

  rawConflictArray = _.reduce(data, function(result, value, key){
    currentObj = _.filter(arrayTimeIndexInterval, function(obj){return obj.id == value.id})[0];      
    var filteredArrayByRoom = _.chain(arrayTimeIndexInterval)
                                .filter(function(o){return o.room.id == currentObj.room.id})
                                .filter(function(o){return o.id !== currentObj.id})
                                .value();
    var conflictArray = _.filter(filteredArrayByRoom, function(o){
      var condition = false;          
      for (var i = currentObj.startIndex; i <= currentObj.endIndex; i++) {        
        if (i > o.startIndex && i < o.endIndex || currentObj.startIndex == o.startIndex && currentObj.endIndex == o.endIndex) {
          condition = true;
        } 
      } 
      return condition;     
    });   
    // console.log("reduceCurrentObject", value);
    // console.log("currentObject", currentObj);
    // console.log("conflictArray", conflictArray); 
    if (_.size(conflictArray) > 0) { 
      console.log(value);
      var obj = {};
      obj.id = value.id;
      obj.sessionCode = value.sessionCode;
      obj.title = value.title;
      obj.roomName = value.room.title;
      obj.roomId = value.room.id;
      obj.start = value.start;
      obj.finish = value.finish;
      obj.roomConflict = _.reduce(conflictArray, function(result, value, key){
        var conflictObject = _.filter(data, function(o){return o.id == value.id})[0];
        var obj = {};
        obj.id = conflictObject.id;
        obj.sessionCode = conflictObject.sessionCode;
        obj.title = conflictObject.title;
        obj.roomName = conflictObject.room.title;
        obj.roomId = conflictObject.room.id;
        obj.start = conflictObject.start;
        obj.finish = conflictObject.finish;
        obj.errorType = "time";
        result.push(obj);

        return result;
      },[]);
      result.push(obj);
    } else {
      result = result;
    }      
    return result;
  },[]);
  var sortedByRoomArray = _.chain(rawConflictArray)                          
                          .sortBy("roomName")
                          .value();                          
  return sortedByRoomArray;
}
function renderRoomConflicts(conflictArray) {
  // $('#conflicts-room').remove();
  // $('#conflict-trigger').remove();
  // $('#refresh').remove();
  var output = '';
  output = '<div id="conflicts-wrapper" class="animated fadeIn">';
  output += '<div id="conflicts-room">';
  output += '<div class="header">';
  output += '<h2>Event conflicts</h2>';
  output += '<i id="conflicts-close" class="fa fa-times" aria-hidden="true"></i>';
  output += '</div>';
  _.map(conflictArray, function(o){   
    output += '<div class="item">';
    output += '<p class="name"><strong>Name:</strong> '+o.title+'</p>';
    output += '<p class="id"><strong>ID:</strong> '+o.id+'</p>';
    output += '<p class="session"><strong>Session Code:</strong> '+o.sessionCode+'</p>';
    output += '<p class="hours"><strong>Timeframe:</strong> '+o.start+'-'+o.finish+'</p>';
    output += '<p class="room"><strong>Room:</strong> '+o.roomName+'</p>';
    output += '<button class="detail"><i class="fa fa-eye" aria-hidden="true"></i> conflict</button>'
    _.map(o.roomConflict, function(obj){
      output += '<div class="conflict-item">';
      output += '<p class="name"><strong>Name:</strong> '+obj.title+'</p>';
      output += '<p class="id"><strong>ID:</strong> '+obj.id+'</p>';
      output += '<p class="id"><strong>Session Code:</strong> '+obj.sessionCode+'</p>';
      output += '<p class="hours"><strong>Timeframe:</strong> '+obj.start+'-'+obj.finish+'</p>';
      output += '<p class="room"><strong>Room:</strong> '+obj.roomName+'</p>';
      if (obj.errorType == "time") {
        output += '<p class="error-'+obj.errorType+'">Time interval conflict</p>'
      }
      if (obj.errorType == "speaker") {
        output += '<p class="error-'+obj.errorType+'">Speaker conflict</p>'
      }
      output += '</div>';
    });
    output += '</div>';
  });
  output += '</div>';
  output += '</div>';

  

  $('#schedule').before(output);

  //events conflict cards
  $('#conflicts-room .item .detail').on("click", function(){
    $('#conflicts-room .conflict-item').hide();
    $(this).parents(".item").find(".conflict-item").fadeIn(300);
  });
}
function renderTable(data) {
  // console.log(data.topics); 
  $('#conflicts-wrapper').remove();
  $('#conflict-trigger').remove();
  $('#refresh').remove();
  // console.log("THis is data", data);
  var conflictRoomArray = getRoomConflictArray(data.topics); 
  
  $('#schedule-header').append('<div id="refresh"><i class="fa fa-refresh" aria-hidden="true"></i> Refresh application</div>')

  if (_.size(conflictRoomArray) > 0) {
    $('#schedule-header').append('<div id="conflict-trigger"><i class="fa fa-exclamation-triangle" aria-hidden="true"></i> ('+_.size(conflictRoomArray)+') conflicts </div>');
    renderRoomConflicts(conflictRoomArray);
  } else {
    $('#schedule-header').append('<div id="conflict-trigger" class="noConflict">('+_.size(conflictRoomArray)+') conflicts </div>');
  }
  
  $("#event").remove();
  renderRooms(data);
  output = "";
  output += '<div id="event">';
  _.map(data.topics, function(o){
    output += renderCard(o, data.topics); //need to send data.topics so that I can offsetLeft by room
  });
  output += '</div>';
  $('#schedule').append(output);
}
function Schedule(data, event) {   
  renderHeader(data, event);
  renderGrid(scheduleConfig.timeframe);

  //Init - first render of schedule / first day autoselect
  renderTable(data[0]);  
  $('#grid').css("width", $('#header-rooms').width() + 100);

  //Schedule Events 
  $("#header-day-select").on("change", function(){ //header selecet event change
   var value = $(this).val();
   var dataFilteredByDate = _.filter(data, function(o){
     return o.date == value;
   });   
   renderTable(dataFilteredByDate[0]);
   $('#grid').css("width", $('#header-rooms').width() + 100);
  });
 
  $('body').on("click", "#conflict-trigger", function(){
    $('#conflicts-wrapper').removeClass("fadeIn").css("opacity", "1").fadeToggle(300);
    $('.conflict-item').hide();    
  });

  $('body').on("click", "#conflicts-close", function(){
    $('#conflicts-wrapper').removeClass("fadeIn").css("opacity", "1").fadeOut(300);
    $('.conflict-item').hide();

  });

  $('body').on("click", "#refresh", function(){
    var dataFilteredByDate = _.filter(data, function(o){
       return o.date == $("#header-day-select").val();
    });      
    renderTable(dataFilteredByDate[0]);
    $('#grid').css("width", $('#header-rooms').width() + 100);
    $('#header-conference-select').val("");
  });


   
  loading(false);

}



$(function(){
  //init first select
  $("#schedule").before(buildEventSelectPrimary(eventData));
  //on first select change
  $('body').on("change", "#event-select", function(){
    var value = $(this).val();
    $('#event-select-wrapper').hide();
    var eventSelectedArray = _.filter(eventData, function(o){
      return o.id == value;
    });
    var event = eventSelectedArray[0];
    $.when(getData(event)).then(function(data){
      console.log("DATA",data)
      Schedule(data, event); //event = need to send event information also for select to have the proper event value already selected;
    });

  });
  //application event change
  $('body').on("change", "#header-event-select", function(){
    $('#conflicts-wrapper').hide();
    var value = $(this).val();
    $('#schedule').addClass("animated fadeOut");
    var eventSelectedArray = _.filter(eventData, function(o){
      return o.id == value;
    });
    var event = eventSelectedArray[0];
    $.when(getData(event)).then(function(data){
       console.log("DATA",data)
      Schedule(data, event); //event = need to send event information also for select to have the proper event value already selected;
    });

  });

  //conference path filtering
  $('body').on("change","#header-conference-select", function(){
    $("#event .item").removeClass("filterIn").removeClass("filterOut");
    $("#event .item .content").css("backgroundColor","#292929");
    var value = $(this).val();
    // console.log(value);
    if(value !== "") {
      $("#event .item").each(function(){
        var id = $(this).find('.conference').attr("data-conference-id");
        // console.log(id == value);
        if (id == value) {
          $(this).addClass("filterIn")
          $(this).find(".content").css("backgroundColor", $(this).find('.conference').attr("data-color"));
          return;
        } else {
          $(this).addClass("filterOut");
        }
      });
    }

  });


  $('#schedule').on("scroll", function(e){
    // console.log();
    $("#header-rooms").css("top", $(this).scrollTop() + 64);
  });

$('body').on("mouseenter",".item", function(){
    $(this).trigger("showExtra");
});
$('body').on("mouseleave",".item", function(){
    $(this).trigger("hideExtra");
});


function fadeOutElement(arg){
  var deferred = $.Deferred();
  arg.removeClass("fadeIn").addClass("animated fadeOut");
  setTimeout(function(){
     deferred.resolve();
   },300);

  return deferred.promise();
}
function showElement(arg){
  var deferred = $.Deferred();
  arg.show();
  deferred.resolve();
  return deferred.promise();
}
$('body').on("showExtra", ".item", function(){
  var $el = $(this).find(".content");
  var $el2 = $(this).find(".content-hidden");
  $($el2).show();
  $($el).hide();
  // $.when(fadeOutElement($el)).then(($el).hide());
  // $.when(showElement($el2)).then($el2.removeClass("fadeOut").addClass("animated fadeIn"));
  // $(this).find(".content-hidden").addClass("animated fadeIn");
});
$('body').on("hideExtra", ".item", function(){
  var $el = $(this).find(".content");
  var $el2 = $(this).find(".content-hidden");
  $($el).show();
  $($el2).hide();
  // $.when(fadeOutElement($el2)).then(($el2).hide());
  // $.when(showElement($el)).then($el.removeClass("fadeOut").addClass("animated fadeIn"));
  // $(this).find(".content-hidden").addClass("animated fadeIn");
});


});
