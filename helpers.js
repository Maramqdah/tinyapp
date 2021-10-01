const findUserByEmail = function (email, users) {
  for (let userId in users) {
    const user = users[userId];
    //console.log(user);
    // console.log(email);
    //console.log(user.email === email);
    if (user.email === email) {
      return user;
    }
  }
  return null;}

  module.exports = {findUserByEmail};