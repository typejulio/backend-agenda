const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const bcrypt = require('bcrypt')
const cors = require('cors')
// const { v4: uuidv4 } = require('uuid');
// uuidv4(); // ⇨ '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed'


const app = express()

//Config JSON response
app.use(express.json())
app.use(express.urlencoded({
  extended: true
}))
app.use(cors())


// Models
const User = require('./models/User')

//Public Route
app.get('/', (req, res) => {
  res.status(200).json({ msg: 'Bem vindo a nossa API!' })
})


app.get('/users', async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) { res.status(5000).send(error) }
})


//Routes Register User
app.post('/auth/register', async (req, res) => {

  const { name, email, password, confirmPassword } = req.body

  //validations
  if (!name) {
    return res.status(422).json({ message: 'O nome é obrigatório!' })
  }
  if (!email) {
    return res.status(422).json({ message: 'O email é obrigatório!' })
  }
  if (!password) {
    return res.status(422).json({ message: 'A senha é obrigatório!' })
  }

  if (password !== confirmPassword) {
    return res.status(422).json({ message: 'As senhas não conferem!' })
  }

  //check if user exists

  const userExists = await User.findOne({ email: email })

  if (userExists) {
    return res.status(422).json({ message: 'Por favor utilize outro email!' })

  }

  //create password

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  //create user
  const user = new User({
    name,
    email,
    password: passwordHash,
    contacts: []
  })
  console.log(user)
  try {

    await user.save()
    res.status(201).json({ message: 'Usuário criado com sucesso!' })

  } catch (error) {
    res.status(500).json({
      message: 'Houve um erro no servidor, tente novamente mais tarde!'
    })
  }
})

//Login User

app.post('/auth/login', async (req, res) => {

  const { email, password } = req.body

  if (!email) {
    return res.status(422).json({ message: 'O email é obrigatório!' })
  }
  if (!password) {
    return res.status(422).json({ message: 'A senha é obrigatório!' })
  }

  // check if user exists
  const user = await User.findOne({ email: email })
  const nameUser = user.name //Received name
  const contacts = user.contacts //received contacts
  const id = user._id
  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado!' })

  }

  //check it password match
  const checkPassword = await bcrypt.compare(password, user.password)

  if (!checkPassword) {
    return res.status(400).json({ message: 'Senha inválida!' })
  }

  try {
    res.status(200).json({
      nameUser,
      id,
      contacts,
      message: 'Autenticação realizada com sucesso!'
    })

  } catch (error) {
    res.status(500).json({
      message: 'Houve um erro no servidor, tente novamente mais tarde!'
    })
  }

})


//------------------------------------USER ROUTES--------------------------------------------

// Private Route

app.get("/user/contacts/:id", async (req, res) => {
  const id = req.params.id

  //check if user exists
  const user = await User.findById(id, '-password')

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado!' })
  }

  res.status(200).json({ user })
})

app.post("/user/contacts/:id", async (req, res) => {
  const id = req.params.id
  const { nameContact, emailContact, telephoneContact } = req.body

  //check if user exists
  const user = await User.findById(id, '-password')

  // received contacts

  if (!user) {
    return res.status(404).json({ message: 'Usuário não encontrado!' })
  }

  if (!nameContact) {
    return res.status(422).json({ message: 'O nome do contato é obrigatório!' })
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  user.contacts.push({
    idContato: JSON.stringify(getRandomInt(0, 1000)),
    nameContact,
    emailContact,
    telephoneContact
  })

  console.log(user)

  try {

    await user.save()
    res.status(201).json(user)

  } catch (error) {
    res.status(500).json({
      message: 'Houve um erro no servidor, tente novamente mais tarde!'
    })
  }
})

app.put('/user/contacts/:id', async (req, res) => {
  const id = req.params.id
  const { idContato, nameContact, emailContact, telephoneContact } = req.body

  const idBody = idContato
  const user = await User.findById(id, '-password').exec()

  const contactsUpdate = user.contacts.find(({ idContato }) => idContato === idBody)
  console.log(contactsUpdate)

  //check if contact exists
  if (!contactsUpdate) {
    return res.status(400).json({ error: "Contato não existe" })
  }

  contactsUpdate.nameContact = nameContact ?? contactsUpdate.nameContact
  contactsUpdate.emailContact = emailContact ?? contactsUpdate.emailContact
  contactsUpdate.telephoneContact = telephoneContact ?? contactsUpdate.telephoneContact

  user.updateOne()

  res.status(200).json({ user })

})

app.delete("/user/contacts/:id", async (req, res) => {
  const id = req.params.id
  const { idContato } = req.body

  const user = await User.findById(id, '-password').exec()
  const contactIndex = user.contacts.findIndex(({ id }) => id === idContato)

  if (contactIndex >= 0) {
    user.contacts.splice(contactIndex, 1);


    res.status(200).json({ user })
  } else {
    console.log("\nContato não encontrado, nenhuma alteração foi feita!!!\n");
    res.status(400).json({ error: "Contato não encotrado" })
  }
})




//Credenciais
mongoose.connect('mongodb+srv://Teste3:EB9mxs2jAgKh4k7m@cluster0.h6ibyuy.mongodb.net/?retryWrites=true&w=majority')
  .then(() => {

    app.listen(3001)
    console.log('Conectou ao Banco!')
  }
  ).catch((err) => console.log(err))

