const express = require('express');
const router = express.Router();
const { getChannels, createChannel, joinChannel, getMessages, sendMessage, editMessage, deleteMessage } = require('../controllers/channelController');
const { protect } = require('../middlewares/auth');

router.use(protect);
router.get('/', getChannels);
router.post('/', createChannel);
router.post('/:id/join', joinChannel);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/messages/:msgId', editMessage);
router.delete('/messages/:msgId', deleteMessage);

module.exports = router;
