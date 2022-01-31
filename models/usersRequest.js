var mongoose = require('mongoose');
var Schema = mongoose.Schema;

userRequestSchema = new Schema( {
	
	userId: Number,
    Requests: {
        type: Array,
        default: []
    }
    
})
userRequest = mongoose.model('userRequest', userRequestSchema);

module.exports = userRequest;