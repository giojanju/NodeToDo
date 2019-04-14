const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const User = require('../models/User')

router.post('/users/login', async (req, res) => {
	try {
		const { email, password } = req.body

		const user = await User.findByCredentials(email, password)
		const token = await user.generateAuthToken()

		res.send({ user, token })
	} catch (e) {
		res.status(422).send({'error': e })
	}
})

router.post('/users', async (req, res) => {
	const user = new User(req.body)

	try {
		await user.save()

		const token = await user.generateAuthToken()

		res.status(201).send({ user, token })
	} catch (e) {
		res.status(422).send(e)
	}

	// newUser.save().then(re => {
	// 	res.status(201).send({'success': true, 'data': newUser})
	// }).catch(er => {
	// 	res.status(422).send(er)
	// })
})

router.get('/users', auth, async (req, res) => {
	try {
		const users = await User.find({});

		res.send(users)
	} catch (e) {
		res.status(500).send()
	}
})

router.get('/users/me', auth, async (req, res) => {
	res.send({ user: req.user })
})

router.post('/users/logout', auth, async (req, res) => {
	try {
		req.user.tokens = req.user.tokens.filter(token => token.token !== req.token)
		await req.user.save()

		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.post('/users/logout-all', auth, async (req, res) => {
	try {
		req.user.tokens = []
		await req.user.save()

		res.send()
	} catch (e) {
		res.status(500).send()
	}
})

router.get('/users/:id', async (req, res) => {
	const _id = req.params.id

	try	{
		const user = await User.findById(_id)

		if (!user) {
			return res.status(404).send()
		}

		res.send(user)
	} catch (e) {
		res.status(404).send()
	}
})

router.patch('/users/me', auth, async (req, res) => {
	const _id = req.params.id

	const updates = Object.keys(req.body)
	const allowUpdates = ['name', 'email', 'password', 'age']
	const isValidOperation = updates.every(update => allowUpdates.includes(update))

	if (!isValidOperation || !updates.length) {
		return res.status(422).send({ 'error': 'Invalid updates!' })
	}

	try {
		const user = req.user
		updates.forEach(update => user[update] = req.body[update])
		await user.save()

		// const user = await User.findByIdAndUpdate(_id, req.body, { new: true, runValidators: true })

		if (!user) {
			return send.status(404).send()
		}

		res.send(user)
	} catch (e) {
		res.status(400).send(e)
	}
})

router.delete('/users/me', auth, async (req, res) => {
	const _id = req.user._id

	try {
		await req.user.remove()

		res.send(req.user)
	} catch (e) {
		res.status(500).send(e)
	}
})

module.exports = router