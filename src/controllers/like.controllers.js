import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { Like } from "../models/like.models.js"
import mongoose, { isValidObjectId } from "mongoose"

// Toggle like on a video
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    // Check if already liked
    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Already liked → unlike
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Video unliked")
        )
    }

    // Not liked → like
    await Like.create({
        video: videoId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Video liked")
    )
})

// Toggle like on a comment
const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Comment unliked")
        )
    }

    await Like.create({
        comment: commentId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Comment liked")
    )
})

// Toggle like on a tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(
            new ApiResponse(200, { isLiked: false }, "Tweet unliked")
        )
    }

    await Like.create({
        tweet: tweetId,
        likedBy: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, { isLiked: true }, "Tweet liked")
    )
})

// Get all videos liked by the current user
const getLikedVideos = asyncHandler(async (req, res) => {
    const likedVideos = await Like.aggregate([
        // Step 1: Find all likes by this user on videos
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $ne: null }  // only video likes, not comments/tweets
            }
        },
        // Step 2: Get video details
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video",
                pipeline: [
                    // Step 3: Get owner details of each video
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
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
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    },
                    // Only return published videos
                    {
                        $match: { isPublished: true }
                    }
                ]
            }
        },
        // Step 4: Flatten video array
        {
            $addFields: {
                video: { $first: "$video" }
            }
        },
        // Step 5: Remove likes where video was deleted/unpublished
        {
            $match: {
                video: { $exists: true, $ne: null }
            }
        },
        // Step 6: Return only video details
        {
            $project: {
                video: 1,
                _id: 0
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}