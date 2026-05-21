const ChannelRequest = require('../models/ChannelRequest');
const Channel = require('../models/Channel');
const { broadcastToAll } = require('../services/websocketService');

exports.submitRequest = async (req, res, next) => {
  try {
    const { name, description, icon } = req.body;
    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Channel name is required' });
    const request = await ChannelRequest.create({
      name: name.trim(), description, icon: icon || '📡',
      requestedBy: req.user._id,
    });
    await request.populate('requestedBy', 'name username');
    // Notify superadmins in real-time
    broadcastToAll({ type: 'CHANNEL_REQUEST', data: request });
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
};

exports.getRequests = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    const requests = await ChannelRequest.find(query)
      .populate('requestedBy', 'name username')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (error) { next(error); }
};

exports.reviewRequest = async (req, res, next) => {
  try {
    const { action, reviewNote } = req.body; // action: 'approve' | 'reject'
    if (!['approve', 'reject'].includes(action))
      return res.status(400).json({ success: false, message: 'Action must be approve or reject' });

    const request = await ChannelRequest.findById(req.params.id).populate('requestedBy', 'name username _id');
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'pending')
      return res.status(400).json({ success: false, message: 'Request already reviewed' });

    request.status = action === 'approve' ? 'approved' : 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewNote = reviewNote || '';
    request.reviewedAt = new Date();
    await request.save();

    let channel = null;
    if (action === 'approve') {
      channel = await Channel.create({
        name: request.name,
        description: request.description,
        icon: request.icon,
        type: 'public',
        createdBy: request.requestedBy._id,
        members: [request.requestedBy._id],
      });
    }

    // Notify the requester
    broadcastToAll({
      type: 'CHANNEL_REQUEST_REVIEWED',
      data: {
        requestId: request._id,
        status: request.status,
        channelName: request.name,
        reviewNote: request.reviewNote,
        targetUserId: request.requestedBy._id.toString(),
        channel,
      },
    });

    res.json({ success: true, data: request });
  } catch (error) { next(error); }
};
