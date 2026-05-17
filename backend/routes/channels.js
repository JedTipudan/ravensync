const express = require('express');
const router = express.Router();
const { getChannels, createChannel, joinChannel, getMessages, sendMessage, editMessage, deleteMessage, updateChannel, deleteChannel } = require('../controllers/channelController');
const { protect, authorize } = require('../middlewares/auth');

router.use(protect);
router.get('/', getChannels);
router.post('/', createChannel);
router.patch('/:id', updateChannel);
router.delete('/:id', deleteChannel);
router.post('/:id/join', joinChannel);
router.get('/:id/messages', getMessages);
router.post('/:id/messages', sendMessage);
router.patch('/messages/:msgId', editMessage);
router.delete('/messages/:msgId', deleteMessage);

module.exports = router;
