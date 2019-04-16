const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const sharp = require('sharp')
const User = require('../models/User')
const multer = require('multer')

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

const upload = multer({
	'limits': {
		fileSize: 1000000
	},
	fileFilter(req, file, cb) {
		if (!file.originalname.endsWith('.jpg') && !file.originalname.endsWith('.jpeg')) {
			return cb(new Error('Please upload image'))
		}

		cb(undefined, true)
	}
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
	const buffer = await sharp(req.file.buffer).resize({ with: 250, height: 250 }).png().toBuffer()

	// req.user.avatar = req.file.buffer
	req.user.avatar = buffer
	await req.user.save()
	res.status(201).send()
}, (error, req, res, next) => {
	res.status(400).send({ 'error': error.message })
})

router.delete('/users/me/avatar', auth, async (req, res) => {
	req.user.avatar = undefined
	await req.user.save()

	res.send()
})

router.get('/users/:id/avatar', async (req, res) => {
	try {
		const user = await User.findById(req.params.id)

		if (!user || !user.avatar) {
			throw new Error()
		}

		res.set('Content-Type', 'image/png')
		res.send(user.avatar)
	} catch (e) {
		res.status(404).send()
	}
})

module.exports = router