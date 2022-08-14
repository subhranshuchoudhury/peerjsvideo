// server.js
// where your node app starts

// we've started you off with Express (https://expressjs.com/)
// but feel free to use whatever libraries or frameworks you'd like through `package.json`.
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const mailer = require("nodemailer");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const { ExpressPeerServer } = require("peer");
// For time-stamp of last logins.

function timestamp() {
    let d = new Date();
    let ISTTime = new Date(d.getTime() + (330 + d.getTimezoneOffset()) * 60000);
    let timeStamp = `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][ISTTime.getDay()]} ${ISTTime.getHours() % 12 || 12}:${ISTTime.getMinutes()} ${ISTTime.getHours() >= 12 ? "PM" : "AM"} ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    return timeStamp;
}

smtpProtocol = mailer.createTransport({
    host: "smtp-relay.sendinblue.com",
    port: 587,
    auth: {
        user: "subhransuchoudhury00@gmail.com",
        pass: process.env.MAIL_PASS,
    }
});


app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
}));
app.use(passport.initialize());
app.use(passport.session());
mongoose.connect(process.env.DB_URL);

const userSkeliton = new mongoose.Schema({
    email: String,
    password: String,
}); // schema

const PeerSchema = new mongoose.Schema({
    email: String,
    peer: String,
    time: String


});

userSkeliton.plugin(passportLocalMongoose);

const Peer = new mongoose.model("peer", PeerSchema);
const User = new mongoose.model("user", userSkeliton);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => { res.header({ "Access-Control-Allow-Origin": "*" }); next(); })

//..
app.get("/", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("home");
    } else {
        res.redirect("/login");
    }

});

// register

app.post("/register", (req, res) => {

    User.register({ username: req.body.username }, req.body.password, (err, u) => {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/");
            });
        }
    });


});

app.get("/register", (req, res) => {
    res.render("register");
});

// Login

app.get("/login", (req, res) => {
    if (req.isAuthenticated()) {
        res.redirect("/");
    } else {
        res.render("login");

    }
});

app.post("/login", (req, res) => {
    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, (err) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect("/");
            });
        }
    });

});

// logout

app.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) {
            console.log(err);
            res.send("Something went wrong! Kindy retry or conatct subhranshu choudhury.")
        } else {
            res.redirect("/login");

        }
    });
});

// set the peer id

app.post("/update-peer", (req, res) => {
    if (req.isAuthenticated()) {

        Peer.findOne({ email: req.user.username }, (err, data) => {
            if (data) {
                Peer.updateOne({ email: req.user.username }, { $set: { peer: req.body.peerid, time: timestamp() } }, (err) => {
                    if (err) {
                        res.send(err);
                        console.log("Error! PUT method");
                    } else {
                        res.send("Data updated successfully.");
                        console.log("Data updated successfully.PUT method!")
                    }
                });
            } else {
                if (!err) {
                    const newPeer = new Peer({
                        email: req.user.username,
                        peer: req.body.peerid,
                        time: timestamp()
                    });

                    newPeer.save((err) => {
                        if (err) {
                            res.send(err);
                        } else {
                            console.log("Peer ID created.");
                        }

                    });
                } else {
                    res.send(err);
                }
            }
        })

    } else {
        res.send("Authorization Failed.");
    }

});

// get the peer ids

app.get("/peers", (req, res) => {
    Peer.find((err, peerData) => {
        if (!err) {
            res.send(peerData);
        } else {
            res.send(err);
        }
    })
})

// OTP

app.post("/sendotp", (req, res) => {
    const OTP = req.body.otp;
    const Email = req.body.emailid;
    const Pass = req.body.password;
    console.log("Here OTP: " + OTP + " Email: " + Email);

    // nodemailer
    let mailoption = {
        from: "subhransuchoudhury00@gmail.com",
        to: Email,
        subject: "VideoTalk OTP Verification",
        html: `Hi, Thanks for using our service.<br>Here is your OTP: <h2>${OTP}</h2>Your Password is: ${Pass}`
    }
    smtpProtocol.sendMail(mailoption, function (err, response) {
        if (err) {
            console.log(err);
        }
        console.log('Message Sent');
    });
    smtpProtocol.close();
});


// test -- ignore

app.post("/test", (req, res) => {
    console.log("Email: " + req.body.username)
    console.log("Password: " + req.body.password)
    res.render("home");
})
// listen for requests :)
const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});

//******************************************************************

// peerjs server
const peerServer = ExpressPeerServer(listener, {
    debug: true,
    path: '/myapp'
});

app.use('/peerjs', peerServer);
