var mongoose = require('mongoose');
var Schema = mongoose.Schema;

RoomRequestData = new Schema( {
	
	locationID: Number,
    locationName:String,
    Date: String,
    StartTime: String,
    EndTime: String,
    UTC: Number,
    Cost: Number,
    Purpose: String,
    NumberOfPeople:Number,
    Details: String,
    userId: String,
    Incentive: Number,
    Status: String

}),
RoomRequest = mongoose.model('RoomRequest', RoomRequestData);

module.exports = RoomRequest;