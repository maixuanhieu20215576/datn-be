const verificationService = require("../services/verification.service");

const login = async (req, res) => {
  const { username, password } = req.body;
  try {
    const { user, accessToken } = await verificationService.login({
      username,
      password,
    });
    res.status(200).json({ user, accessToken });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const register = async (req, res) => {
  const { username, password , fullName, email} = req.body;
  try {
    const response = await verificationService.register({ username, password , fullName, email});
    res.status(200).json(response);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
module.exports = {
  login,
  register,
};
