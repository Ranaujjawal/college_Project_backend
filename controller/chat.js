import {Message} from '../model/chat.js';
import { User } from '../model/user.js';

export const addusechathistory = async (req,res)=>{
  const { cardid} = req.body;
  console.log(req.body);
  const ourUserId = req.userData.userId;
  try {
    await User.findByIdAndUpdate(cardid, {
      $addToSet: { pastChats: ourUserId },
    });

    await User.findByIdAndUpdate(ourUserId, {
      $addToSet: { pastChats: cardid },
    });

    res.status(200).json({ 
      success:true,
      message: 'Chat started successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Error starting chat', error });
  }
};

export const pastchattings = async (req, res) => {
  const ourUserId = req.userData.userId; 
console.log(ourUserId);
  try {
    console.log("i am called");
    
    const currentUser = await User.findById(ourUserId).select('pastChats');
    
    if (!currentUser || !currentUser.pastChats) {
      return res.status(404).json({ message: 'No chat history found for this user.' });
    }

   
    const chatUsers = await User.find({
      _id: { $in: currentUser.pastChats }
    }).select('name avatar profession hourlyRate'); 

    res.status(200).json({ chatUsers });
  } catch (error) {
    console.log('Error fetching chat history:', error);
    res.status(500).json({ message: 'Error fetching chat history1234567', error });
  }
};

export const getMessages = async (req, res) => {
  const { userId } = req.body;
  const ourUserId = req.userData.userId;
  console.log(userId,ourUserId);
  try {
    const messages = await Message.find({
      sender: { $in: [userId, ourUserId] },
      recipient: { $in: [userId, ourUserId] },
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json('Error fetching messages');
  }
};
