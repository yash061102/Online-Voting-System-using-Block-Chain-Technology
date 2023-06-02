const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passportUser, getUserByEmail, getUserById) 
{
  const authenticateUser = async (email, password, done) => 
  {
    const user = await getUserByEmail(email)
    console.log("config section")
    console.log(user)
    if (!user) {
      return done(null, false, { message: 'No such email registered!' })
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Incorrect password!' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passportUser.use('voter', new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passportUser.serializeUser((user, done) => done(null, user.id))
  passportUser.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

module.exports = initialize