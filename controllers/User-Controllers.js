const User = require("../models/User-Model.js");
const Enroll = require("../models/Enrollment-model.js");
const bcryptjs = require("bcryptjs");
const auth = require("../auth.js");

module.exports.registerUser = (req, res) => {
    let newUser = new User({
        imgLink: req.body.imgLink,
        firstName: req.body.firstName,
        middleName: req.body.middleName,
        lastName: req.body.lastName,
        email: req.body.email,
        contactNumber: req.body.contactNumber,
        password: bcryptjs.hashSync(req.body.password, 10)
    })

    return newUser.save()
    .then(result => {
        res.send({
            code: "REGISTRATION-SUCCESS",
            message: "You are now registered!",
            result: result
        })
    })
    .catch(error => {
        res.send({
            code: "REGISTRATION-FAILED",
            message: "We've encountered an error during the registration. Please try again!",
            result: error
        })
    })
}

module.exports.getAllUsers = (req, res) => {
    return User.find({}).then(result => {
        if(result == null || result.length === 0){
            return res.send({
                code: "USER-EMPTY",
                message: "There is currently no User."
            })
        }else{
            return res.send({
                code: "ALL-USERS-RESULT",
                message: "Here are the list of users.",
                result: result
            })
        }
    })
}

// User Login
module.exports.loginUser = (req, res) =>{
    let {email, password} = req.body;
    return User.findOne({email: email}).then(result => {
        if(result == null){
            return res.send({
                code: "USER-NOT-REGISTERED",
                message: "Please register to login."
            })
        }else{
            const isPasswordCorrect = bcryptjs.compareSync(password, result.password);

            if(isPasswordCorrect){
                return res.send({
                    code: "USER-LOGIN-SUCCESS",
                    token: auth.createAccessToken(result)
                })
            }else{
                return res.send({
                    code: "PASSWORD-INCORRECT",
                    message: "Password is not correct. Please try again."
                })
            }
        }
    })
}

// Check email if existing
module.exports.checkEmail = (req,res) => {
    let {email} = req.body;
    return User.find({email: email}).then(result => {
        if(result.length > 0){
            return res.send({
                code: "EMAIL-EXISTS",
                message: "The user is registered."
            })
        }else{
            return res.send({
                code: "EMAIL-NOT-EXISTING",
                message: "The user is not registered."
            }) 
        }
    })
}

module.exports.getProfile = (req, res) => {
    const {id} = req.user;
    return User.findById(id).then(result => {
        if(result == null || result.length === 0){
            return res.send({
                code: "USER-NOT-FOUND",
                message: "Cannot find user with the provided ID."
            })
        }else{
            result.password = "*****";
            return res.send({
                code: "USER-FOUND",
                message: "A user was found.",
                result: result
            })
        }
    })
}

module.exports.updateProfile = (req, res) => {
    const { id } = req.user;
    const { imgLink, firstName, middleName, lastName, email, contactNumber, password } = req.body;

    const updateData = { imgLink, firstName, middleName, lastName, email, contactNumber };
   
    if (password) {
        updateData.password = bcryptjs.hashSync(password, 10);
    }
    User.findOne({ email }).then((existingUser) => {
        if (existingUser && existingUser._id.toString() !== id) {
            return res.send({
                code: "EMAIL-ALREADY-EXISTS",
                message: "The email is already in use. Please choose a different email.",
            });
        }
       
    User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
        .then((updatedUser) => {
            if (!updatedUser) {
                return res.send({
                    code: "USER-NOT-FOUND",
                    message: "Cannot find user with the provided ID.",
                });
            }
            res.send({
                code: "USER-UPDATE-SUCCESS",
                message: "Profile updated successfully.",
                result: updatedUser,
            });
        })
        .catch((error) => {
            if (error) {
                res.send({
                    code: "EMAIL-ALREADY-EXISTS",
                    message: "The email is already in use. Please choose a different email.",
                });
            } else {
                res.send({
                    code: "USER-UPDATE-FAILED",
                    message: "An error occurred while updating the profile.",
                    error: error.message,
                });
            }
        });
    })
};


module.exports.updateUser = async (req, res) => {
  const userId = req.body._id || req.user.id; 
  const {idAdmin, password, ...updatedDetails } = req.body; 

  console.log("Updating user:", userId, updatedDetails);

  if (!userId) {
    return res.status(400).send({
      code: "MISSING-ID",
      message: "User ID is required to update the user.",
    });
  }

  if (password) {
    updatedDetails.password = bcryptjs.hashSync(password, 10);
  }

 
  const allowedUpdates = ["imgLink","firstName", "middleName", "lastName", "email", "contactNumber", "password", "isAdmin"];
  const sanitizedUpdates = Object.keys(updatedDetails)
    .filter((key) => allowedUpdates.includes(key))
    .reduce((obj, key) => {
      obj[key] = updatedDetails[key];
      return obj;
    }, {});

  try {

    const updatedUser = await User.findByIdAndUpdate(userId, sanitizedUpdates, { new: true, runValidators: true });

    if (!updatedUser) {
      return res.status(404).send({
        code: "USER-NOT-FOUND",
        message: "User not found.",
      });
    }

    res.send({
      code: "USER-UPDATE-SUCCESS",
      message: "User updated successfully.",
      result: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).send({
      code: "UPDATE-FAILED",
      message: "An error occurred while updating the user.",
    });
  }
};

module.exports.deleteUser = async (req, res) => {
    // Debug log
  const Id = req.body._id;
  console.log("Request Body:", req.body._id);
  if (!Id) {
    return res.status(400).send({
      code: "MISSING-ID",
      message: "User ID is required.",
    });
  }

  try {
    const deletedUser = await User.findByIdAndDelete(Id);
    if (!deletedUser) {
      return res.status(404).send({
        code: "USER-NOT-FOUND",
        message: "User not found.",
      });
    }

    res.status(200).send({
      code: "USER-DELETED-SUCCESS",
      message: "User successfully deleted.",
      result: deletedUser,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).send({
      code: "SERVER-ERROR",
      message: "An error occurred while deleting the user.",
    });
  }
};
  




// Enroll a user
module.exports.enroll = (req, res) => {
    const {id} = req.user;
    
    let newEnrollment = new Enroll({
        userId: id,
        enrolledCourse: req.body.enrolledCourse,
        totalPrice: req.body.totalPrice
    })

    return newEnrollment.save().then((result, err) => {
        if(err){
            res.send({
                code: "ENROLLMENT-FAILED",
                message: "There is a problem during your enrollment, please try again!",
                error: err
            })
        }else{
            res.send({
                code: "ENROLLMENT-SUCCESSFUL",
                message: "Congratulations, you are now enrolled!",
                result: result
            })
        }
    })
}