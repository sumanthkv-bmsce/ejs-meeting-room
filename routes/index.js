var express = require('express');
var router = express.Router();
var mongoDB = require("mongodb")
var User = require('../models/user');
var locationData = require("../models/locationData");
var RoomRequest = require("../models/RoomRequestData");
var userRequest = require("../models/usersRequest");
var RequestToRoom = require("../models/requestToRoom")
var LocalStorage = require("localStorage")

router.get('/', function (req, res, next) {
	return res.render('index.ejs');
});


router.post('/', function(req, res, next) {
	// console.log(req.body);
	var personInfo = req.body;


	if(!personInfo.email || !personInfo.username || !personInfo.password || !personInfo.passwordConf){
		res.send();
	} else {
		if (personInfo.password == personInfo.passwordConf) {

			User.findOne({email:personInfo.email},function(err,data){
				if(!data){
					var c;
					User.findOne({},function(err,data){

						if (data) {
							console.log("if");
							c = data.unique_id + 1;
						}else{
							c=1;
						}
						var newPerson = new User({
							unique_id:c,
							email:personInfo.email,
							username: personInfo.username,
							profession: personInfo.profession,
							password: personInfo.password,
							passwordConf: personInfo.passwordConf
						});

						newPerson.save(function(err, Person){
							if(err)
								console.log(err);
							else
								console.log('Success');
						});

					}).sort({_id: -1}).limit(1);
					res.send({"Success":"You are regestered,You can login now."});
				}else{
					res.send({"Success":"Email is already used."});
				}

			});
		}else{
			res.send({"Success":"password is not matched"});
		}
	}
});

router.get('/login', function (req, res, next) {
	return res.render('login.ejs');
});

router.post('/login', function (req, res, next) {
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		if(data){
			
			if(data.password==req.body.password && data.profession == req.body.profession) {
				console.log("Done Login");
				req.session.userId = data.unique_id;
				LocalStorage.setItem("userId",req.session.userId)
				console.log(req.session.userId);
				res.send({"Success":"Success!"});
				
			}else{
				res.send({"Success":"Wrong Credentials!"});
			}
		}else{
			res.send({"Success":"This Email Is not regestered!"});
		}
	});
});

router.get('/profile', function (req, res, next) {
	User.findOne({unique_id:req.session.userId},function(err,data){
		// console.log(data);
		if(!data){
			res.redirect('/');
		}else{
			// console.log("found");
			if(data.profession == 'admin') {
				return res.render('admin.ejs', { userId:req.session.userId });
			}

			return res.render('customer.ejs', { userId:req.session.userId });
			// return res.send("hello");
		}
	});
});

router.post("/api/check/working/checkValid",async(req,res) => {

	var lId = parseInt(req.body.locationID);

	await locationData.findOne({locationID: lId},(err,data)=> {

		if(!data) return { "Success": "Invalid Selection" };
		if(parseInt(data.RemainingRooms) > 0) {
			return res.send({"Success":true});
		}

		return res.send({"Success": false});

	});
})

router.get("/postRequest",(req,res)=> {

	return res.render("postRequest.ejs");

});

router.post("/postRequest",async(req,res)=> {

	var body = req.body.data;
	var lNme = req.body.locationNme;
	console.log(body);


	var timeSplit1 = body.StartTime.split(':'),
		hours1,
		minutes1;
	hours1 = timeSplit1[0];
	minutes1 = timeSplit1[1];
	
	var dateSplit1 = body.Date.split('-'),
		year,
		month,
		day;
	year = dateSplit1[0];
	month = dateSplit1[1];
	day = dateSplit1[2];

	var dateInUTC = Math.floor((new Date(year,month,day,hours1,minutes1)).getTime())/1000;

	// var locationValues = await locationData.findOne({locationID: parseInt(body.locationID)});

	for(var i=0; i<5000000; ++i){}

	var record = new RoomRequest({
		locationID: parseInt(body.locationID),
		locationName:lNme,
		Date: body.Date,
		StartTime: body.StartTime,
		EndTime: body.EndTime,
		Cost: parseInt(body.Cost),
		Purpose: body.Purpose,
		Incentive: body.Incentive,
		NumberOfPeople:parseInt(body.NumberOfPeople),
		Details: body.Details,
		UTC: dateInUTC,
		userId: req.session.userId,
		Status: "Pending"
	}) 

	var requestID;
	record.save((err,respo)=> {
		if(err) {
			console.log(err);
		}
		requestID = respo._id;
	})

	var users = await userRequest.findOne({userId: req.session.userId});
	if(users === null) {

		var temp = []
		temp.push(record);
		var newUser = new userRequest({
			userId: req.session.userId,
			Requests: temp
		})
		await newUser.save((err,resp)=>{})

	}
	else {
		var temp = users.Requests;
		temp.push(record);

		await userRequest.updateOne({userId: req.session.userId},{ $set:{ Requests: temp} },(err,resp)=>{})

	}
	res.send( {
		"Success":true,
		"RequestID": requestID
	})

})

router.get("/allLocationData",async(req,res)=> {

	var allData = await locationData.find({});
	return res.send(allData);
})

router.post("/filteredData",async(req,res)=>{

	var location = req.body.location;

	var data = await locationData.find({locationName: location});
	console.log(data);
	return res.send(data);

})

router.get("/getCurrentUserRequests",async(req,res)=>{

	var currentUserId = req.session.userId;

	var requestedRooms = await userRequest.findOne({userId : currentUserId});

	return res.send({
		"Success": requestedRooms.Requests
	})

})

router.get("/getAdminContents",async(req,res)=> {

	var results = await RoomRequest.find({Status:"Pending"});

	return res.send({
		"Success": results
	})

})

router.post("/getAdminFilteredLocationData",async(req,res)=>{

	var locationNme = req.body.location;
	var results = await RoomRequest.find({Status:"Pending",locationName:locationNme});

	return res.send({
		"Success": results
	})

})

router.post("/getItemData",async(req,res)=> {

	var Id =req.body.ID;
	await LocalStorage.setItem("PropertyID",Id)
	return res.send({
		"Success":true
	})
})

router.get("/getItemData",async(req,res)=> {

	var Id = LocalStorage.getItem("PropertyID");
	var results = await RoomRequest.findOne({ _id: new mongoDB.ObjectId(Id)});
	LocalStorage.clear();
	return res.render("item.ejs",{ data1: results})

})

router.post("/searchRecords",async(req,res)=> {

	var date = req.body.Date;
	var startTime = req.body.StartTime;
	var location = req.body.Location;

	var results = await RoomRequest.find({ locationName: location });

	var temp1 = []
	results.forEach((val,idx)=>{
		if(val.Date < date) {
			temp1.push(val);
		}
		else if(val.Date === date) {
			if(val.EndTime <= startTime) {
				temp1.push(val);
			}
		}
	})

	if(temp1.length == 0) {
		return res.send({
			"Success": false
		});
	}
	
	var pos = -1;
	for(var idx in temp1) {
		var val = temp1[idx]
		var existedRequestID = val._id.toString()
		var room = await RequestToRoom.findOne({ RequestID: existedRequestID});
		if(room !== null) {
			pos = idx;
			break;
		}
	}

	if(pos!=-1) {
		return res.send({
			"Success": true,
			"Data": temp1[pos]
		})
	}
	
	return res.send({
		"Success": false
	});

})

router.post("/checkRoomsAvailable",async(req,res)=> {
	
	var location = req.body.Location;

	var results = await locationData.findOne({locationName: location})

	if(results.RemainingRooms > 0) {
		return res.send({
			"Success": true
		})
	}

	return res.send({
		"Success": false
	});

})

router.post("/updateCollections",async(req,res)=> {

	var location = req.body.Location;
	var ID = req.body.ID;
	var userID = req.body.userID;
	
	var room = await locationData.findOne({locationName: location})
	var roomNumber = room["RemainingRooms"]

	await locationData.updateOne({ locationName: location },{ $inc : { "RemainingRooms": -1 } })

	var newRecord = new RequestToRoom({
		RequestID: ID,
		Room: roomNumber
	})
	newRecord.save((err,resp)=>{})

	var userIDData = await userRequest.findOne({userId: userID})

	var requests = userIDData.Requests;

	for(var idx in requests) {
		if(requests[idx]._id.toString() === ID) {
			requests[idx].Status = "Approved"
			break;
		}
	}

	await userRequest.updateOne({ userId: userID },{ $set : { "Requests": requests } })

	await RoomRequest.updateOne({ _id: new mongoDB.ObjectId(ID) },{ $set : { "Status": "Approved" } })
	
	return res.send({
		"Success" : true
	})

})

router.post("/reallotRoom",async(req,res)=> {

	var existedRequestID = req.body.existedRequestID;
	var currentRequestID = req.body.ID
	var userID = req.body.userID;
	
	var room = await RequestToRoom.findOne({ RequestID: existedRequestID });

	var roomNumber = room.Room;

	var newRecord = new RequestToRoom({
		RequestID: currentRequestID,
		Room: roomNumber
	})
	newRecord.save((err,resp)=>{})

	var userIDData = await userRequest.findOne({userId: userID})

	var requests = userIDData.Requests;

	for(var idx in requests) {
		if(requests[idx]._id.toString() === currentRequestID) {
			requests[idx].Status = "Approved"
			break;
		}
	}	

	await userRequest.updateOne({ userId: userID },{ $set : { "Requests": requests } })

	await RoomRequest.updateOne({ _id: new mongoDB.ObjectId(currentRequestID) },{ $set : { "Status": "Approved" } })

	return res.send({
		"Success": true
	})

})

router.get("/requests/:requestId",async(req,res)=> {

	var requestId = req.params.requestId;

	var results = await RoomRequest.findOne({ _id: new mongoDB.ObjectId(requestId) });

	return res.render('trackRequest.ejs', { data : results });

})

router.get('/logout', function (req, res, next) {
	console.log("logout")
	if (req.session) {
    // delete session object
	LocalStorage.clear();
    req.session.destroy(function (err) {
    	if (err) {
    		return next(err);
    	} else {
    		return res.redirect('/');
    	}
    });
}
});

router.get('/forgetpass', function (req, res, next) {
	res.render("forget.ejs");
});

router.post('/forgetpass', function (req, res, next) {
	//console.log('req.body');
	//console.log(req.body);
	User.findOne({email:req.body.email},function(err,data){
		console.log(data);
		if(!data){
			res.send({"Success":"This Email Is not regestered!"});
		}else{
			// res.send({"Success":"Success!"});
			if (req.body.password==req.body.passwordConf) {
			data.password=req.body.password;
			data.passwordConf=req.body.passwordConf;

			data.save(function(err, Person){
				if(err)
					console.log(err);
				else
					console.log('Success');
					res.send({"Success":"Password changed!"});
			});
		}else{
			res.send({"Success":"Password does not matched! Both Password should be same."});
		}
		}
	});
	
});

module.exports = router;