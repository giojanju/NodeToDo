const express = require('express')
const router = new express.Router()
const Task = require('../models/Task')
const auth = require('../middleware/auth')

// GET /tasks?completed=true
// GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res) => {
	const match = {}
	const sort = {}

	if (req.query.completed) {
		match.completed = req.query.completed
	}

	if (req.query.sortBy) {
		const parts = req.query.sortBy.split(':')
		sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
	}

	try {
		await req.user.populate({
			path: 'tasks',
			match,
			options: {
				limit: parseInt(req.query.limit),
				skip: parseInt(req.query.skip),
				sort
			}
		}).execPopulate()
		res.send(req.user.tasks)
	} catch (e) {
		res.status(500).send()
	}
})

router.get('/tasks/:id', auth, async (req, res) => {
	try {
		const task = await Task.findOne({ _id:req.params.id, owner: req.user.id })
		await task.populate('owner').execPopulate()

		if (!task) {
			res.status(404).send({'error': 'This is not found'})
		}

		res.send(task)
	} catch (e) {
		res.status(404).send(e)
	}
})

router.post('/tasks', auth, async (req, res) => {
	const task = new Task({
		...req.body,
		owner: req.user._id
	})

	try {
		await task.save()
		res.status(201).send({'success': true, 'data': task})
	} catch (e) {
		res.status(422).send(e)
	}
})

router.patch('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id

	const updates = Object.keys(req.body)
	const updateFields = ['description', 'completed']
	const isValidFields = updates.every(element => updateFields.includes(element))
	if (!isValidFields || !updates.length) {
		return res.status(422).send({'error': 'Wrong update!'})
	}

	try {
		const task = await Task.findOne({ _id: _id, owner: req.user.id })

		if (!task) {
			return res.status(404).send()
		}

		updates.forEach(field => task[field] = req.body[field])
		await task.save()
		res.send(task)
	} catch (e) {
		res.status(422).send()
	}
})

router.delete('/tasks/:id', auth, async (req, res) => {
	const _id = req.params.id

	try {
		const task = await Task.findByOneAndDelete({ _id: _id, owner: req.user.id })

		if (!task) {
			return res.status(404).send({'error': 'Model not found'})
		}

		res.send(task)
	} catch (e) {
		res.status(500).send(e)
	}
})

module.exports = router