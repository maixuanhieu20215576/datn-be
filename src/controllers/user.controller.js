const getUserInfo = async (req, res) => {
  try {
    const userId = req.userId;
    const userInfomation = await userService.getUserInfo(userId);
    res.status(200).json(userInfomation);
  } catch (err) {
    res.status(500).json(err);
  }
};
module.exports = {
  getUserInfo,
};
