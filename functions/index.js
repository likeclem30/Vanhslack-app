const functions = require('firebase-functions');
const admin = require('firebase-admin');

const app = require('express')();
admin.initializeApp();

const Config = {
    apiKey: "AIzaSyAU84HqE-ragUiiEhskgY62g8KZhejeBEw",
    authDomain: "vhackslack.firebaseapp.com",
    databaseURL: "https://vhackslack.firebaseio.com",
    projectId: "vhackslack",
    storageBucket: "vhackslack.appspot.com",
    messagingSenderId: "687199975596",
    appId: "1:687199975596:web:d72384dba828ad618d4709",
    measurementId: "G-246NQLWKVP"
  };


const firebase = require('firebase');
firebase.initializeApp(Config);

app.get('/screams',(req, res) =>{
    admin
    .firestore()
    .collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach(doc => {
        screams.push({
        screamId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt
        });
      });
      return res.json(screams);
  })
  .catch((err) => console.error(err));
})

 app.post('/scream',(req, res) => {

    const newScream = {
        body: req.body.body,
        userHandle: req.body.userHandle,
        createdAt: new Date().toISOString()
    };

    admin
        .firestore()
        .collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({info: `document ${doc.id} created successfully`});
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong'});
            console.error(err);
        });
});

app.post('/signup',(req,res) =>{
    const signupUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle, 
    };
    //TODO validate data
    firebase.auth()
        .createUserWithEmailAndPassword(signupUser.email,signupUser.password)
        .then((data) => {
            return res
            .status(201)
            .json({info: `Your Account with Id: ${data.user.uid} signed up successfully`});
        })
        .catch((err) => {
            console.error(err);
            return res.status(500).json({ error: err.code});
        });
});
 exports.api = functions.region('europe-west2').https.onRequest(app);









