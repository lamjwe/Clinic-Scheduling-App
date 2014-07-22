// ****************************************************************************
// Data Access Object for CRUD operations against the database.
//TEST
// Frank W. Zammetti
// ****************************************************************************


// Imports.
var mongoose = require("mongoose");
var ObjectID=require('mongodb').ObjectID;
var db = mongoose.connection;
// Define database schemas for all entities.
var schemas = {
  appointment : mongoose.Schema({
    doctorId: String,
    time: String,
    date: Date,
    description: String,
    patientId: String 
  }),
  user : mongoose.Schema({
    _id : {"$oid" : String},
    category : String,
    firstName : String,
    lastName : String,
    address : String,
    province : String,
    city : String,
    birthday : Date,
    phone : String,
    eMail : String,
    gender : String,
    password : String,
    isDoctor : Boolean
  })
};




// Define database models for all entities.
var models = {
  appointment : mongoose.model("appointment", schemas.appointment),
  user : mongoose.model("user", schemas.user)
}


// Connect to database.
mongoose.connect("mongodb://admin:seng299@ds031567.mongolab.com:31567/ebooking_db");


/**
 * POST: (C)reate.
 *
 * @param opType  The type of operation (appointment, contact, note or task).
 * @param dataObj The data object built during the core server processing.
 */
function POST(opType, dataObj) {

  console.log(dataObj.id + ": DAO.POST() - CREATE : " + opType);

  var obj = new models[opType](dataObj.data);
  console.log(dataObj.id + ": obj: " + JSON.stringify(obj));
  obj.save(function (inError, inObj) {
    if (inError) {
      throw "Error: " + JSON.stringify(inError);
    } else {
      console.log(dataObj.id + ": Success: " + inObj._id);
      completeResponse(dataObj, 200, "text", "" + inObj._id);
    }
  });

} // End POST().

/**
 * GET: (R)ead.
 *
 * @param opType  The type of operation (appointment, contact, note or task).
 * @param dataObj The data object built during the core server processing.
 */
function LOGIN(opType, dataObj) {

  console.log(dataObj.id + ": DAO.LOGIN() READ : " + opType);
  models[opType].find({eMail : dataObj.ident},
    function (inError, inObj) {
      if (inError) {
        throw "Error: " + JSON.stringify(inError);
      } else {
        if (inObj == null) {
          console.log(dataObj.id + ": Object not found");
          completeResponse(dataObj, 404, "json", "");
        } else {
          console.log(dataObj.id + ": Success: " + JSON.stringify(inObj));
          completeResponse(dataObj, 200, "json", JSON.stringify(inObj));
        }
      }
    }
  );

} // End GET().

/**
 * GET: (R)ead.
 *
 * @param opType  The type of operation (appointment, contact, note or task).
 * @param dataObj The data object built during the core server processing.
 */
function GET(opType, dataObj) {

  console.log(dataObj.id + ": DAO.GET() READ : " + opType);
  //console.log("&&&&&&&&&&&&&&&&&&&& IN GET &&&&&&&&&&&&&&" + dataObj.ident);
  if(opType == "user"){
    models[opType].findOne({_id : ObjectID(dataObj.ident)},
      function (inError, inObj) {
        if (inError) {
          throw "Error: " + JSON.stringify(inError);
        } else {
          if (inObj == null) {
            console.log(dataObj.id + ": Object not found");
            completeResponse(dataObj, 404, "json", "");
          } else {
            console.log(dataObj.id + ": Success: " + JSON.stringify(inObj));
            completeResponse(dataObj, 200, "json", JSON.stringify(inObj));
          }
        }
      }
    );
  } else if (opType == "appointment") {
    models[opType].find({patientId : ObjectID(dataObj.ident)},
      function (inError, inObj) {
        if (inError) {
          throw "Error: " + JSON.stringify(inError);
        } else {
          if (inObj == null) {
            console.log(dataObj.id + ": Object not found");
            completeResponse(dataObj, 404, "json", "");
          } else {
            console.log(dataObj.id + ": Success: " + JSON.stringify(inObj));
            completeResponse(dataObj, 200, "json", JSON.stringify(inObj));
          }
        }
      }
    );
  }
} // End GET().


/**
 * Called from GET when no ID is passed.  Returns all items.
 *
 * @param dataObj The data object built during the core server processing.
 */
function GET_ALL(opType, dataObj) {

  console.log(dataObj.id + ": DAO.POST(): " + opType);

  // Set up sorting of results.  This doesn't actually matter since we
  // effectively lose this order once it hits localStorage on the client, but
  // it's good to see how to do this none the less.
  var opts = { sort : { } };
  switch (opType) {
    case "user":
      opts.sort.lastName = 1;
    break;
    case "appointment": default:
      opts.sort.title = 1;
    break;
  }
  console.log("IN GET_ALL!!!!!!!!!!");
  models[opType].find(null, null, opts, function (inError, inObjs) {
    if (inError) {
      throw "Error: " + JSON.stringify(inError);
    } else {
      console.log(dataObj.id + ": Success: " + JSON.stringify(inObjs));
      completeResponse(dataObj, 200, "json", JSON.stringify(inObjs));
    }
  });

} // End GET_ALL().


/**
 * PUT: (U)pdate.
 *
 * @param opType  The type of operation (appointment, contact, note or task).
 * @param dataObj The data object built during the core server processing.
 */
function PUT(opType, dataObj) {

  console.log(dataObj.id + ": DAO.PUT() UPDATE : " + opType);

  models[opType].findByIdAndUpdate(dataObj.ident, dataObj.data, { },
    function (inError, inObj) {
      if (inError) {
        throw "Error: " + JSON.stringify(inError);
      } else {
        console.log(dataObj.id + ": Success");
        completeResponse(dataObj, 200, "text", "" + inObj._id);
      }
    }
  );

} // End PUT().


/**
 * DELETE: (D)elete.
 *
 * @param opType  The type of operation (appointment, contact, note or task).
 * @param dataObj The data object built during the core server processing.
 */
function DELETE(opType, dataObj) {

  console.log(dataObj.id + ": DAO.DELETE() DELETE: " + opType);

  models[opType].findByIdAndRemove(dataObj.ident,
    function (inError, inObj) {
      if (inError) {
        throw "Error: " + JSON.stringify(inError);
      } else {
        console.log(dataObj.id + ": Success");
        completeResponse(dataObj, 200, "text", "" + inObj._id);
      }
    }
  );

} // End DELETE().


/**
 * Clears ALL data from the database.
 *
 * @param dataObj The data object built during the core server processing.
 */
function CLEAR_DATA(dataObj) {

  console.log(dataObj.id + ": DAO.CLEAR_DATA()");

  models.appointment.remove({}, function(inError) {
    if (inError) {
      throw "Error: " + JSON.stringify(inError);
    } else {

          console.log(dataObj.id + ": Success");
          completeResponse(dataObj, 200, "text", "");
      }



  });

} // End CLEAR_DATA().


// Make functions available outside of this module.
exports.POST = POST;
exports.LOGIN = LOGIN;
exports.GET = GET;
exports.PUT = PUT;
exports.DELETE = DELETE;
exports.GET_ALL = GET_ALL;
exports.CLEAR_DATA = CLEAR_DATA;
