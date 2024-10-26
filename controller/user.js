import {User} from '../model/user.js';

export const getProfile = (req, res) => {
  res.json(req.userData);
};

export const getPeople = async (req, res) => {
  try {
    const users = await User.find({}, { '_id': 1, username: 1 });
    res.json(users);
  } catch (err) {
    res.status(500).json('Error fetching users');
  }
};

