const mongoose = require('mongoose')
const validator = require('validator');

const taskScheme = new mongoose.Schema({
	description: {
		type: String,
		required: true
	},
	completed: {
		type: Boolean,
		default: false
	},
	owner: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
		ref: 'User'
	}
}, {
	timestamps: true
})

const Task = mongoose.model('Task', taskScheme)

module.exports = Task