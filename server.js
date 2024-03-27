const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const pool = require('./models/userModels');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.set('view engine', 'ejs');
app.use(express.static('public'));

//Autention 

app.get('/login', (req, res) => res.render('login'));
app.get('/register', (req, res) => res.render('register'));

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log("registering "+username + " " + password);
  try {
    const client = await pool.connect();
    // check if the user exist in db
    let result = await client.query('SELECT * FROM users WHERE name=$1', [username]);
    if (!result.rows[0]){
      // insert new user to db
      await client.query('INSERT INTO users (name, password) VALUES ($1, $2)', [username, password]);
    }
    else{
      // send message that user exist
      return res.send('User already exists!')
    }
    client.release();
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.redirect('/register');
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE name = $1 AND password = $2', [username, password]);
    if (result.rows.length > 0) {
      res.redirect('/?username=' + encodeURIComponent(username));
    } else {
      res.redirect('/login');
    }
    client.release();
  } catch (err) {
    console.error(err);
    res.redirect('/login');
  }
});

app.get('/', (req, res) => {
  // Retrieve the username from the query parameters
  const username = req.query.username;
  // Pass the username to the EJS template
  res.render('index', { username: username });
});

// app.get('/messages', (req, res) => {
//   // Retrieve last 50 messages for that room
//   console.log('getting messages...');
//   const room = req.query.room;
//   const limit=parseInt(req.query.limit || '100');
//   room_id=findRoomId(room) 
//   const client = pool.connect();
//   client.query(`SELECT * FROM messages WHERE RoomID=$1 ORDER BY timeStamp DESC LIMIT $2`, 
//   [room_id,limit]).then((result) => {res.send(JSON.stringify(result.rows))
//     client.release()})
//   console.log(res)
//   return  res;
// });

io.on('connection', (socket) => {
  console.log('A user has connected');

  socket.on('disconnect', () => console.log('User disconnected'));
  
  // socket.on('leave room', (room) => {
  //   socket.leave(room);
  //   console.log(`${socket.id} has left ${room}`);
  
  //   socket.to(room).emit('chat message', {
  //       msg: 'A user has left the room',
  //       user: 'System',
  //       room: room
  //   });
  //   });


 // Join room
 socket.on('join room', (data) => {
  socket.join(data.room)
  console.log(`${data.user} joined ${data.room}`)
  socket.username = data.user
  insertRoom(data.room)


  // Send message to all clients in room
  io.to(data.room).emit('chat message', {
    msg: `${data.user} has joined the  ${data.room}`,
    user: 'ChatApp',
    room: data.room
  })
})

// Leave room
socket.on('leave room', (room) => {
  socket.leave(room)
  console.log(`${socket.username} has left ${room}`)

  // Send message to all clients in room
  io.to(room).emit('chat message', {
    msg: `${socket.username} has left the room`,
    user: 'ChatApp',
    room: room
  })
})

socket.on('chat message', (data) => { 
  io.emit('chat message', {
    msg: data.msg,
    user: data.user,
    room: data.room
  })
  insertMessage(data.msg, data.user, data.room);
})


});

// async function findRoomId(room){
//   //Get room id from room table
//   const client = await pool.connect();
//   let rst = client.query('SELECT * FROM rooms WHERE name=$1', [room]).catch((e)=>console.error(e));
//   room_id=rst.rows[0].id;
//   return room_id;
// }

async function insertMessage(msg,user,room) {
  // Connect to the database
  const client = await pool.connect();
  console.log(msg,user,room)

  let result = await client.query('SELECT * FROM users WHERE name=$1', [user]);
  if  (!result.rows[0]) {
    return  res.status(400).send("No such user exists.");
  }
  console.log(result.rows[0].id)
  user_id = result.rows[0].id

  let rst = await client.query('SELECT * FROM rooms WHERE name=$1', [room]).catch((e)=>console.error(e));
  console.log("rooms "+rst.rows)
  room_id=rst.rows[0].id;
  
  try {
    const insertDataText = 'INSERT INTO messages (user_id, room_id,content) VALUES ($1, $2, $3) RETURNING *';
    const values = [user_id,room_id, msg]; // Data to be inserted

    const res = await client.query(insertDataText, values);
    console.log("Data inserted successfully:", res.rows);
  } catch (err) {
    console.error("An error occurred:", err.stack);
  } finally {
    // Release the client back to the pool
    client.release();
  }
}

async function insertRoom(room) {
  // Connect to the database
  const client = await pool.connect();
  console.log('the room  is ',room)

  let result = await client.query('SELECT * FROM rooms WHERE name=$1', [room]);
  if  (!result.rows[0]) {
   //Add room to rooms table
   const addToDB = `INSERT INTO rooms (name) VALUES($1) RETURNING id`;
   const value=await client.query(addToDB,[room]).then(res=>{return res.rows[0].id;}).catch(e => console.log(e))
    client.release();
  }
}

const port = 3006; 
server.listen(port, () => console.log(`Server is running on port ${port}`));
