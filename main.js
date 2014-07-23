/**
 * The prefix that is used to form the URL all AJAX requests go to.  When
 * developing on the desktop this should be http://127.0.0.1:80 or wherever
 * the server component is configured at.  Any other time, like when it's built
 * as a PhoneGap app, it should be a server address.  The logic in the
 * mobileinit handler determines this.
 */

var ajaxURLPrefix = null;

var loggedInUser = null;

var userId;
/**
 * The ID of the item being updated, or null when doing an add.
 */
var updateID = null;


/**
 * Flag: is network connectivity available?
 */
var networkAvailable = true;


/**
 * Flags that tell us when each entity page has been visited.
 */
var pageVisited = {
  appointment : false
};


// ----------------------------------------------------------------------------
// EVENT HANDLERS.
// ----------------------------------------------------------------------------


/**
 * Startup code #1.  Do any non-UI setup here.
 */
$(document).on("mobileinit", function() {

  // Set JQM defaults.
  $.mobile.defaultPageTransition  = "none";
  $.mobile.defaultDialogTransition  = "none";
  $.mobile.phonegapNavigationEnabled = true;
  $.mobile.loader.prototype.options.text = "...Please Wait...";
  $.mobile.loader.prototype.options.textVisible = true;

  // Determine AJAX URL prefix.
  if (document.location.protocol.toLowerCase().indexOf("file") != -1) {
    ajaxURLPrefix = "http://www.nodejs-ebookingapp.rhcloud.com";
  } else {
    ajaxURLPrefix = "http://www.nodejs-ebookingapp.rhcloud.com";
  }

});

/**
 * Startup code #2.  The call to get server data has to be done here rather
 * than in the mobileinit handler because the UI needs to be built or the
 * calls to show and hide the screen mask will break.  The ready event
 * is triggered after the UI is built, whereas mobileinit happens before,
 * so we have to do the call here.
 */
$(document).on("ready", function() {

  // If we're running inside PhoneGap then we can determine if we have
  // connectivity up-front without trying the fetches.
  if (navigator && navigator.connection &&
    navigator.connection.type == Connection.NONE
  ) {
    showConnectivityMsg();
    alert("PLEASE MAKE SURE YOU ARE CONNECTED TO THE INTERNET");
  } else {
    downloadServerData();
  }

  var UserId = $(location).attr('hash');
  if (UserId != ""){
    UserId = UserId.substring(1, UserId.length);
    userId = UserId;
     UpdateProfile(UserId);
  }
});


// ----------------------------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------------------------

function UpdateProfile(UserId){
      $.ajax({
        url : ajaxURLPrefix + "/getuser/" + UserId, type : "get",
        contentType: "application/json",
        success : function(data) {
          console.log("SUCCESS GET USER!!");
          loggedInUser = data;


          $("#welcomeMsg").text("Welcome " + loggedInUser.firstName);
          document.getElementById("registerFirst_Name").value = loggedInUser.firstName;
          document.getElementById("registerLast_Name").value = loggedInUser.lastName;
          document.getElementById("registerLast_Name").value = loggedInUser.lastName;
          document.getElementById("registerAdress").value = loggedInUser.address;
          document.getElementById("registerCity").value = loggedInUser.city;
          document.getElementById("registerProvince").value = loggedInUser.province;
          document.getElementById("registerBirthday").value = loggedInUser.birthday;
          document.getElementById("registerPhone").value = loggedInUser.phone;
          document.getElementById("registerGender").value = loggedInUser.gender;
          document.getElementById("registerEmail1").value = loggedInUser.eMail;
          document.getElementById("registerEmail2").value = loggedInUser.eMail;
          document.getElementById("registerPassword1").value = loggedInUser.password;
          document.getElementById("registerPassword2").value = loggedInUser.password;
        populateList('appointment', "date", null);
      }
    })
}



function updateUserInfo()	{
	updateID = loggedInUser._id;
	doSave('editUser');
}

function fillUserInfo()	{
	document.getElementById("changeFirst_Name").value = loggedInUser.firstName;
}

function populateDoctors()	{
	var docList = document.getElementById("doctorList");
	var doctors = getAllFromLocalStorage("users");

	console.log("DOCTOR TEST " + doctors);

	for(var i = 0; i<doctors.length; i++){
		if(doctors[i].isDoctor){
			var temp = document.createElement('option');
			temp.text = temp.value = "Dr " + doctors[i].lastName;
			docList.add(temp, 0);
		}
	}
}


/**
 * Show the dialog when network connectivity is unavailable.
 */
function showConnectivityMsg() {

  networkAvailable = false;
} // End showConnectivityMsg().


/**
 * Downloads all data from the server for all entity types at app startup,
 * assuming a connection is available.  If connection is not available then
 * local data will be used and no updates will be allowed until the app is
 * restarted (and assuming a connection is available at that point).
 */
function downloadServerData() {

  $.mobile.loading("show");

  /**
   * Structure used during loading.
   */
  var fetching = {
    loaded_appointment : false,
    data_appointment : null,
    loaded_user : false,
    data_user : null
  };

  // Function executed when each of the four AJAX requests returns, regardless
  // of whether they succeeded or not.  Passed to this is the type of entity
  // completed and the response from the server, or null if the call failed.
  var completeLoad = function(inType, inResponse) {

    // Record that this entity type was loaded and the server's response.
    fetching["loaded_" + inType] = true;
    fetching["data_" + inType] = inResponse;

    // When all four have completed then it's time to get to work.
    if (fetching.loaded_appointment) {

      // If we got back data for all four entity types then we're good to go.
      if (fetching.data_appointment) {

        // Clear localStorage and then populate it with the fresh data.
        window.localStorage.clear();
        var types = [ "appointment" ];
        for (var i = 0; i < types.length; i++) {
          var typ = types[i];
          var dat = fetching["data_" + typ];
          var len = dat.length;
          var lst = window.localStorage;
          for (var j = 0; j < len; j++) {
            var obj = dat[j];
            lst.setItem(typ + "_" + obj._id, JSON.stringify(obj));
          }
        }
      } else {
        alert("YOU ARE CURRENTLY NOT CONNECTED TO THE SERVER");
        // One or more entities were not fetched, which we take to mean there's
        // a connectivity problem, so let the user know what's up.  Whatever
        // data is in localStorage will be used for this run.
        showConnectivityMsg();

      }

      // To conserve memory, erase the temporary load structure.
      fetching = null;

      // Unmask screen and we're done here.
      $.mobile.loading("hide");

    }

  };

  // Get all appointments.
  $.ajax({ url : ajaxURLPrefix + "/appointment" })
  .done(function(inResponse) { completeLoad("appointment", inResponse); })
  .fail(function(inXHR, inStatus) { completeLoad("appointment", null); });
} // End downloadServerData();().


/**
 * Get all entities of a given type from localStorage and return them
 * as objects.
 *
 * @param inType The type of entity to get (appointment
 */
function getAllFromLocalStorage(inType) {

  var items = [ ];

  // First, get the data of the appropriate type from localStorage.
  var lst = window.localStorage;
  for (var itemKey in lst) {
    if (itemKey.indexOf(inType) == 0) {
      var sObj = lst.getItem(itemKey);
      items.push(JSON.parse(sObj));
    }
  }

  // Second, sort the resultant array, since the order we get it from
  // localStorage is indeterminate.
  items.sort(function(a, b) {
    switch (inType) {
      case "appointment": default:
        return a.title > b.title;
      break;
    }
  });

  return items;

} // End getAllFromLocalStorage().


/**
 * Show a list view.
 *
 * @param inType The type of list to show.
 */
function showListView(inType) {

  // Flip to list view and ensure menu is closed.
  $("#" + inType + "Entry").hide("fast");
  $("#" + inType + "List").show("fast");
  $("#" + inType + "Menu" ).popup("close");

  // Clear entry form and reset updateID (do this last so that the user doesn't
  // see the clear happen before the transition).  Also note: NOT using jQuery
  // because why incur the overhead for something like this?!
  updateID = null;
  document.getElementById(inType + "EntryForm").reset();

} // End showListView().


/**
 * Save an entity.  This is used for adding a new entity as well as updating an
 * existing entity.
 *
 * @param inType The type of entity to save.
 */
function doSave(inType) {
	var inType3 = "";
	if(inType == "editUser"){
		inType3 = "editUser";
		inType = "user";
	}
	if(inType == "editAppointment"){
		inType3 = "editAppointment";
		inType = "appointment";
	}

  // First things first: validate the form and abort if something's not right.
  if (!validations["check_" + inType](inType)) {
	  if(inType3 == "editAppointment"){

	  }else{
		 alert("Please fill all required fields!");
		 return;
 	  }
  }

  // Scrim screen for the duration of the call.
  $.mobile.loading("show");

  // Flip to list view and ensure menu is closed.
  $("#" + inType + "Entry").hide();
  $("#" + inType + "List").show();
  $("#" + inType + "Menu" ).popup("close");

  // Select appropriate HTTP method and ensure inUpdateID is a non-null value
  // no matter what.
  var httpMethod = "post";
  var uid = "";
  if (updateID) {
    httpMethod = "put";
    uid = "/" + updateID;
  }

  if (inType == "appointment") {
    $("#appointmentPatientId").val(loggedInUser._id);
  }

  // Get form data and then clear the form and reset updateID.
  var frmData = getFormAsJSON(inType);
  if(inType3 == "editAppointment"){
	  frmData = getFormAsJSON(inType3);
  }


  updateID = null;
  document.getElementById(inType + "EntryForm").reset();
  var inType2 = inType;

  // Send to server.
  $.ajax({
    url : ajaxURLPrefix + "/" + inType2 + uid, type : httpMethod,
    contentType: "application/json", data : frmData,
    success : function(data) {
        if(inType3 == "editUser"){
          console.log("SUCCESS GET UPDATE USER!!");
          loggedInUser = data;
          UpdateProfile(userId);
        }
      }
  })
  .done(function(inResponse) {
    // Add the item to localStorage.  Since we have the data in the form of a
    // string we just need to slice off the closing brace, then add the
    // two fields that MongoDB would add.
    frmData = frmData.slice(0, frmData.length - 1);
    frmData = frmData + ",\"__v\":\"0\",\"_id\":\"" + inResponse + "\"}";
    window.localStorage.setItem(inType + "_" + inResponse, frmData);
    // Now repopulate the listview from localStorage.  This is NOT the most
    // efficient way to go about doing this, but it's expedient in terms of
    // writing the code and for small data sets the performance will be fine.

    // Now update the UI as appropriate and we're done.
	   if (inType3 == "editUser"){
		  $.mobile.changePage($("#home"), { transition : "flow" });
		  alert("User Updated Successfully");
	   }else if (inType3 == "editAppointment"){
  		$.mobile.changePage($("#home"), { transition : "flow" });
      populateList(inType3, "date", null);
  		alert("Appointment Updated Successfully");
    }else if (inType == "user"){
      top.location.href = 'index.html';
      alert("User Created Successfully");
    }
    else {

          $.mobile.changePage($("#home"), { transition : "flow" });
          populateList(inType, "date", null);
          alert("Appointment Create Successfully");
    }
  })
  .fail(function(inXHR, inStatus) {
    $.mobile.changePage($("#home"), { transition : "flow" });
    alert("Appointment Failed to Create");
  });



} // End doSave().

function doLogin(inType) {

  // First things first: validate the form and abort if something's not right.
  if (!validations["check_" + inType](inType)) {
   alert("Please fill all required fields!");
   return;
  }

  // Scrim screen for the duration of the call.
  $.mobile.loading("show");

  // Flip to list view and ensure menu is closed.
  $("#" + inType + "Entry").hide();
  $("#" + inType + "List").show();
  $("#" + inType + "Menu" ).popup("close");

  // Select appropriate HTTP method and ensure inUpdateID is a non-null value
  // no matter what.
  var httpMethod = "get";

  // Get form data and then clear the form and reset updateID.
  var frmData = getFormAsJSON(inType);

  updateID = null;
  var emailIdent = $("#loginEmail").val();

  var inType2 = "login";

  var test = ajaxURLPrefix + "/" + inType2 + "/" + emailIdent;

  var loginUser;
  var loginUserId;
  // Send to server.
  $.ajax({
    url : ajaxURLPrefix + "/" + inType2 + "/" + emailIdent, type : httpMethod,
    contentType: "application/json",
    success : function(data) {
      loggedInUser = data;
      if (loggedInUser.length == 0) {
        alert("Invalid Username and Password");
        top.location.href = 'index.html';
      } else {
        loginUserId = data[0]._id;
        if ($('#loginPassword').val() == loggedInUser[0].password){
          top.location.href = 'home.html#' +loginUserId ;
        } else {
          alert("Invalid Username and Password");
          top.location.href = 'index.html';
        }
        
      }
    }
  })
  .done(function(inResponse) {
    // Add the item to localStorage.  Since we have the data in the form of a
    // string we just need to slice off the closing brace, then add the
    // two fields that MongoDB would add.
    frmData = frmData.slice(0, frmData.length - 1);
    frmData = frmData + ",\"__v\":\"0\",\"_id\":\"" + inResponse + "\"}";
    window.localStorage.setItem(inType + "_" + inResponse, frmData);
    // Now repopulate the listview from localStorage.  This is NOT the most
    // efficient way to go about doing this, but it's expedient in terms of
    // writing the code and for small data sets the performance will be fine.
    if(inType != "user"){
    	populateList(inType);
	}
    // Now update the UI as appropriate and we're done.
    $.mobile.loading("hide");
  })
  .fail(function(inXHR, inStatus) {
    $.mobile.changePage($("#login"), { role : "dialog" });
  });

} // End doLogin().


/**
 * Gets the data from a form as a string of JSON.
 *
 * @param  inType The type of entity to get form data for.
 * @return        The JSON string of that data.
 */
function getFormAsJSON(inType) {
  var frmData = $("#" + inType + "EntryForm").serializeArray();
  if(inType == "editAppointment"){
	  frmData = $("#appointmentEditForm").serializeArray();
  }
  var frmObj = { };
  for (var i = 0; i < frmData.length; i++) {
    var fld = frmData[i];
    frmObj[fld.name] = fld.value;
  }
  return JSON.stringify(frmObj);

} // End getFormAsJSON();


/**
 * An object that contains functions for doing validations of the entry forms.
 * Each of them returns true if the form is valid, false if not.
 */
var validations = {

  /**
   * Validate appointment form.
   */
  check_appointment : function() {
    if (isBlank("doctorList")) { return false; }
    if (isBlank("appointmentDate")) { return false; }
    if (isBlank("appointmentTime")) { return false; }
    return true;
  },

  check_user : function() {
    if (isBlank("registerFirst_Name")) { return false; }
    if (isBlank("registerLast_Name")) { return false; }
    if (isBlank("registerAdress")) { return false; }
    if (isBlank("registerCity")) { return false; }
    if (isBlank("registerProvince")) { return false; }
    if (isBlank("registerGender")) { return false; }
    if (isBlank("registerPassword1")) { return false; }
    if (isBlank("registerPassword2")) { return false; } //check are equal?
    if(userEntryForm.registerPassword1.value != userEntryForm.registerPassword2.value) { alert("Passwords do not match.");
    																					return false; }
    return true;
	},

  check_login : function() {
    if (isBlank("loginEmail")) { return false; }
    if (isBlank("loginPassword")) { return false; }
    return true;
  }

};


/**
 * Delete an entity.
 *
 * @param inType The type of entity to delete.
 */
function doDelete(inType) {

  // Scrim screen for the duration of the call.
  $.mobile.loading("show");

  // Flip to list view and ensure menu is closed.
  $("#" + inType + "Entry").hide();
  $("#" + inType + "List").show();
  $("#" + inType + "Menu" ).popup("close");

  var uid = "/" + updateID;

  // Clear entry form and reset updateID.
  updateID = null;
  document.getElementById(inType + "EntryForm").reset();

  // Send to server.
  $.ajax({ url : ajaxURLPrefix + "/" + inType + uid, type : "delete" })
  .done(function(inResponse) {
    // Remove item from localStorage.
    window.localStorage.removeItem(inType + "_" + inResponse);
    // Now repopulate the listview from localStorage.  This is NOT the most
    // efficient way to go about doing this, but it's expedient in terms of
    // writing the code and for small data sets the performance will be fine.
    populateList(inType, "date", null);
    // Now update the UI as appropriate and we're done.
    $.mobile.loading("hide");
	$.mobile.changePage($("#home"), { transition : "flow" });
	alert("Appointment Deleted Successfully");
  })
  .fail(function(inXHR, inStatus) {
    $.mobile.loading("hide");
    $.mobile.changePage($("#home"), { transition : "flow" });
    alert("Fail To Deleted");
  });

} // End doDelete().


/**
 * Fired when an entity page is shown.
 *
 * @param inType The type of entity page being shown.
 */
function pageShowHandler(inType) {

  if (!pageVisited[inType]) {

    $.mobile.loading("show");

    // Populate the list.
    populateList(inType);

    // If network connectivity is found to be unavailable at any
    // point then disable new and save capabilities.  Note that this is
    // done here rather than the more reasonable downloadServerData() when
    // the message is shown because we can't guarantee this page has been
    // loaded at that point.
    if (!networkAvailable) {
      $("#" + inType + "NewLink").remove();
      $("#" + inType + "SaveButton").button("disable");
    }

    pageVisited[inType] = true;
    $.mobile.loading("hide");

  }

} // pageShowHandler().


/**
 * Populates the list view for an entity type and optionally filters the list.
 *
 * @param inType        The type of entity to populate.
 * @param inFilterField The field of the entity to filter by, or null if no
 *                      filtering should be applied (show all).
 * @param inFilterValue The value of the filter field to match, or null if no
 *                      filtering should be applied (show all).
 */
function populateList(inType, inFilterField, inFilterValue) {



  // Get items of the appropriate type from localStorage.
  var items = [];

  // Select appropriate HTTP method and ensure inUpdateID is a non-null value
  // no matter what.
  var httpMethod = "get";

  // Get form data and then clear the form and reset updateID.
  var frmData = getFormAsJSON(inType);

  // Get reference to listview's UL element and remove existing children.


  updateID = null;
  var userId = loggedInUser._id;
  if (inType == "editAppointment"){
    inType = "appointment";
  }

  var ul = $("#" + inType + "ListUL");
  ul.children().remove();

  var ulAppHistory = $("#appointmentHistoryListUL");
  ulAppHistory.children().remove();

  var inType2 = "get" + inType;
  var loginUser;
  var loginUserId;
  // Send to server.
  $.ajax({
    url : ajaxURLPrefix + "/" + inType2 + "/" + userId, type : httpMethod,
    contentType: "application/json",
    success : function(data) {
      items = data;

      items = items.sort(function(a, b){
        return a.date > b.date;
      });

      var allAppointments = items.slice(0);

      if (inType == "appointment" && inFilterField == "date"){

        var tempItems2 = [];
        var fullDate = new Date();
        var twoDigitMonth = (fullDate.getMonth()+1)+"";if(twoDigitMonth.length==1)  twoDigitMonth="0" +twoDigitMonth;
        var twoDigitDate = fullDate.getDate()+"";if(twoDigitDate.length==1) twoDigitDate="0" +twoDigitDate;
        var current_date = fullDate.getFullYear() + "-" + twoDigitMonth + "-" + twoDigitDate;
        // CAST tempItems2[i].date to string then trim. Then compare.
        var dateString = "";
        for (var i = 0; i < items.length; i++) {
          dateString = items[i].date.toString();
          dateString = dateString.substring(0,10);
          if (dateString >= current_date){
            tempItems2.push(items[i]);
          }
        }
        items = tempItems2;
      }

      ///APPOINTMENT HISTORY
      var appHistory = [];
      var index;
      for (index = 0; index < allAppointments.length; index++) {
        appHistory.push(allAppointments[index].date);
      }
      appHistory = $.unique(appHistory);

      appHistory = appHistory.sort(function(a, b){
        return a.date > b.date;
      });

      var appLen = appHistory.length;
      for (var i = 0; i < appLen; i++) {
        dateString = appHistory[i].toString();
        dateString = dateString.substring(0,10);
        ulAppHistory.append(
          "<li data-role=\"list-divider\" data-theme=\"b\" role=\"heading\" class=\"ui-li ui-li-divider ui-bar-b\">" + dateString + "</li>"
        );

        for(var j = 0; j < allAppointments.length; j++){
          if(appHistory[i] == allAppointments[j].date){
            dateString = allAppointments[j].date.toString();
            dateString = dateString.substring(0,10);

            var liHead = "";
            // Item not filtered out, so create the LI now.
            var liText = "";

            liText = "<p>" + allAppointments[j].description + "</p>";

            liHead = "<h2>" + dateString + " - " + allAppointments[j].time + "</h2>";

            ulAppHistory.append(
              "<li class=\"ui-li ui-li-static ui-btn-up-c\">"+ liHead + liText +  " </li>"
            );
          }
        }
      }

      // Have to refresh the listview to tell JQM to do it's thing.
      // ulAppHistory.listview("refresh");
      ///END APPOINTMENT HISTORY

      // Iterate over those items and create a LI for each and append to the UL,
      // applying filtering, if specified.
      var len = items.length;
      for (var i = 0; i < len; i++) {
        var item = items[i];
        dateString = item.date.toString();
        dateString = dateString.substring(0,10);
        var liHead = "";
        // Item not filtered out, so create the LI now.
        var liText = "";

        liText = "<p>" + item.description + "</p>";

        liHead = "<h2>" + dateString + " - " + item.time + "</h2>";

        ul.append(
          "<li onClick=\"viewEditItem('" + inType + "', '" + item._id + "');\"" +
          "id=\"" + item._id + "\"><a href=\"#editApp\">" + liHead + liText + "</a></li>"
        );
      }

      // Have to refresh the listview to tell JQM to do it's thing.
      ul.listview("refresh");
    }
  })
  .done(function(inResponse) {

  })
  .fail(function(inXHR, inStatus) {
    $.mobile.changePage($("#login"), { role : "dialog" });
  });

} // End populateList().


/**
 * Show an entry view for creating a new item.
 *
 * @param inType The type of entity to create.
 */
function newItem(inType) {

  // Clear entry form and reset updateID.
  updateID = null;
  document.getElementById(inType + "EntryForm").reset();

  // Flip to entry view and ensure menu is closed.
  $("#" + inType + "Entry").show("fast");
  $("#" + inType + "List").hide("fast");
  $("#" + inType + "Menu" ).popup("close");

  // Disable that delete button too!
  $("#" + inType + "DeleteButton").button("disable");

} // End newItem().


/**
 * Select an item for viewing/editing from a list.
 *
 * @param inType The type of entity selected.
 * @param inID   The ID of the entity.
 */
function viewEditItem(inType, inID) {

  document.getElementById("editAppError").style.visibility="hidden";
  document.getElementById("editAppForm").style.visibility="visible";
  // Record the item being viewed/edited.
  updateID = inID;

  // Populate data.
  var itemData = JSON.parse(window.localStorage.getItem(inType + "_" + inID));
  for (fld in itemData) {
	  console.log(fld);
    if (fld != "_id" && fld != "__v") {
	//document.getElementByName("appEditForm").elements["name="+fld].value = itemData[fld];
      $("#appointmentEditForm [name=" + fld + "]").val(itemData[fld]);
    }
  }

  // Flip to entry view and ensure menu is closed.
  $("#" + inType + "Entry").show();
  $("#" + inType + "List").hide();
  $("#" + inType + "Menu" ).popup("close");

  // Enable that delete button too!
  $("#" + inType + "DeleteButton").button("enable");

} // End viewEditItem().

function logout(){
  top.location.href='index.html';
}

/**
 * Checks if a given form field is blank.
 *
 * @param  inID The ID of a form field to check.
 * @return      True if the object is blank, false if not.
 */
function isBlank(inID) {

  var fld = $("#" + inID).val();

  if (fld === null) {
    return true;
  } else if (fld === undefined) {
    return true;
  } else if (fld === "") {
    return true;
  }

  return false;

} // End isBlank().
