var mongoose = require('mongoose');
var Schema = mongoose.Schema;

locationSchema = new Schema( {
	
	locationID: Number,
    locationName:String,
    NumberOfRooms: Number,
    RemainingRooms: Number

})
locationData = mongoose.model('locationData', locationSchema);

module.exports = locationData;