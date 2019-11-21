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

const db = admin.firestore();

app.get('/screams',(req, res) =>{
db.collection('screams')
    .orderBy('createdAt', 'desc')
    .get()
    .then(data => {
      let screams = [];
      data.forEach((doc)=> {
        screams.push({
        screamId: doc.id,
        body: doc.data().body,
        userHandle: doc.data().userHandle,
        createdAt: doc.data().createdAt,
        commentCount: doc.date().commentCount,
        likeCount: doc.data().likeCount
        });
      });
      return res.json(screams);
  })
  .catch((err) => {
     console.error(err);
     res.status(500).json({error: err.code})
});
});

//middleware authutincation 
const FBAuth = (req, res, next) => {
    let idToken;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
     idToken = req.headers.authorization.split('Bearer ')[1];
} else {
    console.error('No token found')
    return res.status(403).json({ error: 'Unauthorized'});
}

admin.auth().verifyIdToken(idToken)
.then(decodedToken => {
    req.user = decodedToken;
    console.log(decodedToken);
    return db.collection('users')
    .where('userId', '==', req.user.uid)
    .limit(1)
    .get();
 })
 .then(data => {
     req.user.handle = data.docs[0].data().handle;
     return next();
 })
 .catch(err => {
     console.error('Error while verifying token ', err); 
     return res.status(403).json(err);   
     })
 }


 //singles screen post
 app.post('/scream',FBAuth,(req, res) => {
 if (req.body.body.trim() === ''){
     return res.status(400).json({ body: 'Body must not be empty'});
 }
    const newScream = {
        body: req.body.body,
        userHandle: req.body.handle,
        createdAt: new Date().toISOString()
    };

       db.collection('screams')
        .add(newScream)
        .then((doc) => {
            res.json({message: `document ${doc.id} was created successfully`});
        })
        .catch((err) => {
            res.status(500).json({ error: 'something went wrong'});
            console.error(err);
        });
});

const isEmail = (email) => {
    const regEx = /^(([^<>()[]\.,;:s@"]+(.[^<>()[]\.,;:s@"]+)*)|(".+"))@(([[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}.[0-9]{1,3}])|(([a-zA-Z-0-9]+.)+[a-zA-Z]{2,}))$/igm;
    if(email.match(regEx)) 
        return true;
    else  
        return false;
}

const isEmpty = (string) => {
    if(string.trim() === '') 
        return true;
    else 
        return false;
}

//Signup block
app.post('/signup', (req, res) => {
    const newUser = {
        email: req.body.email,
        password: req.body.password,
        confirmPassword: req.body.confirmPassword,
        handle: req.body.handle
    };

    let errors = {};

    if(isEmpty(newUser.email)){
        errors.email = 'Please provide your email'
    } else if(!isEmail(newUser.email)){
        errors.email = 'Please provide a valid email address'
    }

    if(isEmpty(newUser.password))
        errors.password = 'Please provide password ';
    if(newUser.password !== newUser.confirmPassword)
        errors.confirmPassword = 'The password does not match';
    if(isEmpty(newUser.handle))
        errors.handle = 'Please provide non emptyy handle'

    if(Object.keys(errors).length > 0)
        return res.status(400).json(errors);

    


    //TODO validate data
    let token, userId;
    db.doc(`/users/${signupUser.handle}`)
      .get()
      .then((doc) => {
          if(doc.exists){
              return res.status(400).json({ handle: 'this user exist.Please try other handle name '});
          }else{
              return firebase
              .auth()
              .createUserWithEmailAndPassword(signupUser.email,signupUser.password);
          }
      })
      .then((data) => {
          userId = data.user.uid;
          return data.user.getIdToken();
      })
      .then((idToken) => {
          token = idToken;
          const userCredentials ={
              handle: signupUser.handle,
              email: signupUser.email,
              createdAt: new Date().toISOString(),
              userId
          };
          return db.doc(`/users/${signupUser.handle}`).set(userCredentials);
        })
        .then(() => {
          return res.status(200).json({ token });
      })
      .catch((err) =>{
          console.error(err);
          if(err.code === 'auth/email-already-in-use'){
              return res.status(400).json({email: 'This email is already signup please login.'})
          }else{
          return res.status(500).json({ error: err.code });
          }
      });
    });

    app.post('/login', (req, res) => {
        const user ={
            email:req.body.email,
            password:req.body.password
        };
        let errors = {};
        if(isEmpty(user.email))
             errors.email = 'Must not be empty';
        if(isEmpty(user.password))
             errors.password = 'Must not be empty'

        if(Object.keys(errors).length > 0)
        return res.status(400).json(errors);

        firebase
           .auth()
           .signInWithEmailAndPassword(user.email,user.password)
           .then(data => {
               return data.user.getIdToken();
           })
           .then(token => {
               return res.json({token});
           })
           .catch((err) => {
               console.error(err);
               if(err.code === 'auth/wrong-password'){
                   return res.status(403).json({general:'Wrong Credentials: Please check email or password '})
               } else
                     return res.status(500).json({ error: err.code});
           });
    });
 exports.api = functions.region('europe-west2').https.onRequest(app);









