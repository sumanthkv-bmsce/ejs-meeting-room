var mongoose = require('mongoose');
var Schema = mongoose.Schema;

requestToRoom = new Schema( {
	
	RequestID: String,
    Room: Number

})
RequestToRoom = mongoose.model('RequestToRoom', requestToRoom);

module.exports = RequestToRoom;