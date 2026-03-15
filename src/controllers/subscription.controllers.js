import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Subscription } from "../models/subscription.models.js"
import mongoose, { isValidObjectId } from "mongoose"

// Subscribe or unsubscribe from a channel
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    // Can't subscribe to yourself
    if (channelId.toString() === req.user._id.toString()) {
        throw new ApiError(400, "You can't subscribe to yourself")
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId
    })

    if (existingSubscription) {
        // Already subscribed → unsubscribe
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(
            new ApiResponse(200, { isSubscribed: false }, "Unsubscribed successfully")
        )
    }

    // Not subscribed → subscribe
    await Subscription.create({
        subscriber: req.user._id,
        channel: channelId
    })

    return res.status(200).json(
        new ApiResponse(200, { isSubscribed: true }, "Subscribed successfully")
    )
})

// Get all channels I have subscribed to
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const subscribedChannels = await Subscription.aggregate([
        // Step 1: Find all subscriptions where I am the subscriber
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        // Step 2: Get channel details
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        // Step 3: Flatten channel array
        {
            $addFields: {
                channel: { $first: "$channel" }
            }
        },
        // Step 4: Return only channel details
        {
            $project: {
                channel: 1,
                _id: 0
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribedChannels,
            "Subscribed channels fetched successfully"
        )
    )
})

// Get all subscribers of a channel
const getUserSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    const subscribers = await Subscription.aggregate([
        // Step 1: Find all subscriptions to this channel
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        // Step 2: Get subscriber details
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullname: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        // Step 3: Flatten subscriber array
        {
            $addFields: {
                subscriber: { $first: "$subscriber" }
            }
        },
        // Step 4: Return only subscriber details
        {
            $project: {
                subscriber: 1,
                _id: 0
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers,
            "Subscribers fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getSubscribedChannels,
    getUserSubscribers
}