const sgMail = require('@sendgrid/mail')
const sendGridApiKey = process.env.SENDGRID_API_KEY

sgMail.setApiKey(sendGridApiKey)

const sentWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'janjugio@gmail.com',
        subject: 'Thanks for joining you',
        text: `Welcome to the app, ${name}.`
    })
}

const sendCancelationEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'janjugio@gmail.com',
        subject: 'Your account close',
        text: `Your account close, ${name}.`
    })
}

module.exports = {
    sentWelcomeEmail,
    sendCancelationEmail
}